import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  // Экспортируем сервис — им пользуется и AdminModule (список заказов, смена статуса).
  exports: [OrdersService],
})
export class OrdersModule {}
