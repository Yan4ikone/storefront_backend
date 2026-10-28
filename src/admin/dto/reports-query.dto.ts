import { IsIn, IsISO8601, IsOptional } from "class-validator";
import { ORDER_STATUSES, type OrderStatusValue } from "./order-status.dto";

// Группировка сводного отчёта по выручке — по дням, неделям (с понедельника)
// или месяцам. День — разумный дефолт для небольшого магазина.
export const REPORT_GROUP_BY = ["day", "week", "month"] as const;
export type ReportGroupBy = (typeof REPORT_GROUP_BY)[number];

// from/to — даты в формате YYYY-MM-DD (IsISO8601 без strict принимает и такой
// короткий формат, не только полный datetime). Если не заданы — сервис сам
// подставит текущий месяц (см. AdminReportsService.resolveRange).
export class ReportsSummaryQueryDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsIn(REPORT_GROUP_BY)
  groupBy?: ReportGroupBy;
}

export class ReportsOrdersQueryDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  // Тип — не просто string, а тот же литеральный union, что и у Order.status
  // в Prisma (OrderStatus); иначе дальше по цепочке (AdminReportsService ->
  // prisma.order.findMany) TypeScript не даст передать это поле в where без
  // приведения типа.
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatusValue;
}
