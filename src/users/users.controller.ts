import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { toPublicUser } from "./public-user";
import { UsersService } from "./users.service";
import { UpdateMeDto } from "./dto/update-me.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

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

  @Patch("password")
  changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Get("orders")
  orders(@CurrentUser() user: User) {
    return this.usersService.getMyOrders(user.id);
  }

  @Get("favorites")
  favorites(@CurrentUser() user: User) {
    return this.usersService.getFavorites(user.id);
  }

  @Post("favorites/:slug")
  addFavorite(@CurrentUser() user: User, @Param("slug") slug: string) {
    return this.usersService.addFavorite(user.id, slug);
  }

  @Delete("favorites/:slug")
  removeFavorite(@CurrentUser() user: User, @Param("slug") slug: string) {
    return this.usersService.removeFavorite(user.id, slug);
  }
}
