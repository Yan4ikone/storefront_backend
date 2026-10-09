import { Body, Controller, Get, Headers, Param, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import { AuthService } from "../auth/auth.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";

// Списка "GET /orders" (все заказы) здесь намеренно нет — это была бы утечка
// чужих заказов. Список есть под /admin/orders (роли admin/manager, см.
// src/admin) и под /users/me/orders (свои же заказы, см. src/users).
@Controller("orders")
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly authService: AuthService
  ) {}

  @Post()
  async create(@Body() dto: CreateOrderDto, @Headers("authorization") authHeader?: string) {
    // Гостевой чекаут сохранён сознательно: авторизация не обязательна для
    // заказа. Если человек всё же вошёл — заказ попадёт в его личный кабинет.
    const user = await this.authService.getUserFromAuthHeader(authHeader);
    return this.ordersService.create(dto, user?.id);
  }

  @Get("group/:groupId")
  findGroup(@Param("groupId") groupId: string) {
    return this.ordersService.findByGroupId(groupId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ordersService.findOne(id);
  }

  // Отмена заказа покупателем из личного кабинета — требует входа (у
  // гостевых заказов нет userId, сравнить владельца было бы не с чем).
  @UseGuards(JwtAuthGuard)
  @Post(":id/cancel")
  cancel(@Param("id") id: string, @CurrentUser() user: User) {
    return this.ordersService.cancelByCustomer(id, user.id);
  }
}
