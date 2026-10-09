import { IsBoolean, IsIn } from "class-validator";

// Линейный прогресс заказа (показывается покупателю как линия с точками) —
// "cancelled" стоит отдельно, вне линии, доступен из любого статуса.
export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "assembled",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES)
  status!: OrderStatusValue;
}

export class ResolveCancellationDto {
  @IsBoolean()
  approve!: boolean;
}
