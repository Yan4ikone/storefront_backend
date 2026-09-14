import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { toPublicUser } from "./public-user";
import { UsersService } from "./users.service";
import { UpdateMeDto } from "./dto/update-me.dto";

@Controller("users/me")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  me(@CurrentUser() user: User) {
    return toPublicUser(user);
  }

  @Patch()
  update(@CurrentUser() user: User, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(user.id, dto);
  }

  @Get("orders")
  orders(@CurrentUser() user: User) {
    return this.usersService.getMyOrders(user.id);
  }
}
