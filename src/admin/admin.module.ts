import { Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { S3StorageService } from "../s3.service";
import { AdminController } from "./admin.controller";
import { AdminCatalogController } from "./admin-catalog.controller";
import { AdminCatalogService } from "./admin-catalog.service";
import { AdminOrdersController } from "./admin-orders.controller";
import { AdminReportsController } from "./admin-reports.controller";
import { AdminReportsService } from "./admin-reports.service";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUsersService } from "./admin-users.service";

@Module({
  imports: [OrdersModule],
  controllers: [
    AdminController,
    AdminCatalogController,
    AdminOrdersController,
    AdminReportsController,
    AdminUsersController,
  ],
  providers: [AdminCatalogService, AdminReportsService, AdminUsersService, S3StorageService],
})
export class AdminModule {}
