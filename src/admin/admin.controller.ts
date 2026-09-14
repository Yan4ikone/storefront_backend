import { Controller, Get, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { toPublicUser } from "../users/public-user";

// Проверка сессии для формы входа в админку на фронте: если и JwtAuthGuard
// (валидный токен), и RolesGuard (роль admin/manager) пропустили запрос —
// значит это сотрудник, можно показывать админку. Раньше это делал общий
// пароль (AdminAuthGuard) — теперь это обычный вход по email/телефону + пароль
// через /auth/login, просто с проверкой роли.
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "manager")
export class AdminController {
  @Get("session")
  checkSession(@CurrentUser() user: User) {
    return { ok: true, user: toPublicUser(user) };
  }
}
