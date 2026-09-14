import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { ReportGroupBy } from "./dto/reports-query.dto";

export interface ReportPeriodRow {
  period: string;
  ordersCount: number;
  revenue: number;
  cancelledCount: number;
  cancelledAmount: number;
}

export interface ReportsTotals {
  ordersCount: number;
  revenue: number;
  cancelledCount: number;
  cancelledAmount: number;
}

export interface ReportsSummary {
  from: string;
  to: string;
  groupBy: ReportGroupBy;
  rows: ReportPeriodRow[];
  totals: ReportsTotals;
}

const pad = (n: number) => String(n).padStart(2, "0");

// Период по умолчанию — текущий календарный месяц: разумная точка отсчёта
// для бухгалтерии, если даты не заданы явно.
function resolveRange(from?: string, to?: string): { start: Date; end: Date } {
  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const toDate = to ? new Date(to) : now;
  // Верхняя граница — конец суток "to" включительно, а не полночь того дня.
  const end = new Date(
    toDate.getFullYear(),
    toDate.getMonth(),
    toDate.getDate(),
    23,
    59,
    59,
    999
  );
  return { start, end };
}

// Ключ и подпись периода для группировки. Неделя считается с понедельника —
// без ISO-номеров недель, этого достаточно для сортировки и отображения.
function periodKeyAndLabel(date: Date, groupBy: ReportGroupBy): { key: string; label: string } {
  if (groupBy === "month") {
    const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
    return { key, label: key };
  }
  if (groupBy === "week") {
    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diffToMonday);
    const key = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
    return { key, label: `нед. с ${pad(monday.getDate())}.${pad(monday.getMonth() + 1)}.${monday.getFullYear()}` };
  }
  const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return { key, label: `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}` };
}

@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // Сводка "выручка и заказы по периодам". Отменённые заказы считаются
  // отдельно (cancelledCount/cancelledAmount) и не входят в revenue —
  // так попросили не искажать итоговую сумму продаж.
  //
  // Важная оговорка (см. README): у магазина пока нет онлайн-оплаты и
  // фискализации (см. модель Order в schema.prisma) — "выручка" здесь это
  // сумма по всем заказам кроме отменённых (new + confirmed + done), т.е.
  // ориентировочная сумма продаж по заявкам, а не бухгалтерская выручка в
  // строгом смысле (по факту оплаты/отгрузки). Для точных цифр эти данные
  // нужно сверять с реальными оплатами.
  async getSummary(from?: string, to?: string, groupBy: ReportGroupBy = "day"): Promise<ReportsSummary> {
    const { start, end } = resolveRange(from, to);
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true, itemsTotal: true, status: true },
      orderBy: { createdAt: "asc" },
    });

    const byKey = new Map<string, ReportPeriodRow>();
    for (const order of orders) {
      const { key, label } = periodKeyAndLabel(order.createdAt, groupBy);
      let row = byKey.get(key);
      if (!row) {
        row = { period: label, ordersCount: 0, revenue: 0, cancelledCount: 0, cancelledAmount: 0 };
        byKey.set(key, row);
      }
      if (order.status === "cancelled") {
        row.cancelledCount += 1;
        row.cancelledAmount += order.itemsTotal;
      } else {
        row.ordersCount += 1;
        row.revenue += order.itemsTotal;
      }
    }

    // Заказы отсортированы по createdAt asc, а Map хранит порядок первой
    // вставки ключа — так что строки уже идут в хронологическом порядке.
    const rows = Array.from(byKey.values());
    const totals = rows.reduce<ReportsTotals>(
      (acc, row) => ({
        ordersCount: acc.ordersCount + row.ordersCount,
        revenue: acc.revenue + row.revenue,
        cancelledCount: acc.cancelledCount + row.cancelledCount,
        cancelledAmount: acc.cancelledAmount + row.cancelledAmount,
      }),
      { ordersCount: 0, revenue: 0, cancelledCount: 0, cancelledAmount: 0 }
    );

    return { from: start.toISOString(), to: end.toISOString(), groupBy, rows, totals };
  }

  // Реестр заказов за период — та же выборка, что видит /admin/orders, но с
  // фильтром по датам и статусу, для сверки бухгалтером или выгрузки в Excel.
  getOrdersRegister(from?: string, to?: string, status?: string) {
    const { start, end } = resolveRange(from, to);
    return this.prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        ...(status ? { status } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: "asc" },
    });
  }
}
