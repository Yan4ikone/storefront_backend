import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
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

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ordersService.findOne(id);
  }
}
