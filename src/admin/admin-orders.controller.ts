import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { OrdersService } from "../orders/orders.service";
import { UpdateOrderStatusDto, ResolveCancellationDto } from "./dto/order-status.dto";

@Controller("admin/orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "manager")
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto.status);
  }

  // Подтвердить или отклонить запрос покупателя на отмену уже подтверждённого
  // заказа (см. OrdersController.cancel / OrdersService.cancelByCustomer).
  @Patch(":id/cancellation")
  resolveCancellation(@Param("id") id: string, @Body() dto: ResolveCancellationDto) {
    return this.ordersService.resolveCancellationRequest(id, dto.approve);
  }
}
