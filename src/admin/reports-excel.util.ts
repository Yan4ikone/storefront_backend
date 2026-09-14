import { Workbook } from "exceljs";
import type { Order, OrderItem } from "@prisma/client";
import type { ReportsSummary } from "./admin-reports.service";

const STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  done: "Выполнен",
  cancelled: "Отменён",
};

const DELIVERY_LABELS: Record<string, string> = {
  pickup: "Самовывоз",
  courier: "Курьер/ТК",
};

// Сводный отчёт (выручка и заказы по периодам) в виде .xlsx — те же данные,
// что показывает таблица в админке, плюс итоговая строка.
export async function buildSummaryWorkbookBuffer(summary: ReportsSummary): Promise<Buffer> {
  const workbook = new Workbook();
  workbook.creator = "МобДетали";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Сводка");
  sheet.columns = [
    { header: "Период", key: "period", width: 22 },
    { header: "Заказов, шт", key: "ordersCount", width: 14 },
    { header: "Выручка, ₽", key: "revenue", width: 16 },
    { header: "Отменено, шт", key: "cancelledCount", width: 14 },
    { header: "Отменено, ₽", key: "cancelledAmount", width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };

  summary.rows.forEach((row) => sheet.addRow(row));

  const totalsRow = sheet.addRow({
    period: "Итого",
    ordersCount: summary.totals.ordersCount,
    revenue: summary.totals.revenue,
    cancelledCount: summary.totals.cancelledCount,
    cancelledAmount: summary.totals.cancelledAmount,
  });
  totalsRow.font = { bold: true };

  sheet.getColumn("revenue").numFmt = "#,##0";
  sheet.getColumn("cancelledAmount").numFmt = "#,##0";

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// Реестр заказов за период в виде .xlsx — построчно, с составом заказа
// в одну ячейку (текстом), чтобы файл оставался одной простой таблицей.
export async function buildOrdersWorkbookBuffer(
  orders: (Order & { items: OrderItem[] })[]
): Promise<Buffer> {
  const workbook = new Workbook();
  workbook.creator = "МобДетали";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Заказы");
  sheet.columns = [
    { header: "Дата", key: "createdAt", width: 18 },
    { header: "№ заказа", key: "id", width: 18 },
    { header: "Покупатель", key: "customerName", width: 22 },
    { header: "Телефон", key: "phone", width: 16 },
    { header: "Способ доставки", key: "deliveryMethod", width: 16 },
    { header: "Сумма, ₽", key: "itemsTotal", width: 14 },
    { header: "Статус", key: "status", width: 14 },
    { header: "Состав заказа", key: "items", width: 55 },
  ];
  sheet.getRow(1).font = { bold: true };

  orders.forEach((order) => {
    sheet.addRow({
      createdAt: order.createdAt.toLocaleString("ru-RU"),
      id: order.id,
      customerName: order.customerName,
      phone: order.phone,
      deliveryMethod: DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod,
      itemsTotal: order.itemsTotal,
      status: STATUS_LABELS[order.status] ?? order.status,
      items: order.items.map((item) => `${item.name} × ${item.qty}`).join("; "),
    });
  });

  sheet.getColumn("itemsTotal").numFmt = "#,##0";

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
