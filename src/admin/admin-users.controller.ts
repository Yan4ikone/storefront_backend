import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { AdminUsersService } from "./admin-users.service";
import { UpdateBalanceDto } from "./dto/user.dto";

@Controller("admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "manager")
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  getCustomers() {
    return this.adminUsersService.getCustomers();
  }

  // Баланс — пока заглушка (см. UpdateBalanceDto): только админ/менеджер
  // может изменить значение вручную, никакого реального платежа тут нет.
  @Patch(":id/balance")
  setBalance(@Param("id") id: string, @Body() dto: UpdateBalanceDto) {
    return this.adminUsersService.setBalance(id, dto.balance);
  }
}
