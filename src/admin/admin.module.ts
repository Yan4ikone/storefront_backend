import { Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { AdminController } from "./admin.controller";
import { AdminCatalogController } from "./admin-catalog.controller";
import { AdminCatalogService } from "./admin-catalog.service";
import { AdminOrdersController } from "./admin-orders.controller";
import { AdminReportsController } from "./admin-reports.controller";
import { AdminReportsService } from "./admin-reports.service";

@Module({
  imports: [OrdersModule],
  controllers: [
    AdminController,
    AdminCatalogController,
    AdminOrdersController,
    AdminReportsController,
  ],
  providers: [AdminCatalogService, AdminReportsService],
})
export class AdminModule {}
