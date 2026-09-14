import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { AdminReportsService } from "./admin-reports.service";
import { ReportsOrdersQueryDto, ReportsSummaryQueryDto } from "./dto/reports-query.dto";
import { buildOrdersWorkbookBuffer, buildSummaryWorkbookBuffer } from "./reports-excel.util";

// Отчёты для бухгалтерии: сводка по выручке/заказам за период и реестр
// заказов, каждый — как JSON (для таблицы в админке) и как .xlsx (скачать
// и отправить бухгалтеру). См. AdminReportsService про то, что именно
// считается "выручкой" при отсутствии подключённой онлайн-оплаты.
@Controller("admin/reports")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "manager")
export class AdminReportsController {
  constructor(private readonly reportsService: AdminReportsService) {}

  @Get("summary")
  getSummary(@Query() query: ReportsSummaryQueryDto) {
    return this.reportsService.getSummary(query.from, query.to, query.groupBy);
  }

  @Get("summary.xlsx")
  async downloadSummary(@Query() query: ReportsSummaryQueryDto, @Res() res: Response) {
    const summary = await this.reportsService.getSummary(query.from, query.to, query.groupBy);
    const buffer = await buildSummaryWorkbookBuffer(summary);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="report-summary.xlsx"');
    res.send(buffer);
  }

  @Get("orders")
  getOrdersRegister(@Query() query: ReportsOrdersQueryDto) {
    return this.reportsService.getOrdersRegister(query.from, query.to, query.status);
  }

  @Get("orders.xlsx")
  async downloadOrdersRegister(@Query() query: ReportsOrdersQueryDto, @Res() res: Response) {
    const orders = await this.reportsService.getOrdersRegister(query.from, query.to, query.status);
    const buffer = await buildOrdersWorkbookBuffer(orders);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="report-orders.xlsx"');
    res.send(buffer);
  }
}
