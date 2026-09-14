import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";

// Временная защита админки одним общим паролем — полноценной авторизации с
// пользователями и ролями (admin/manager) ещё нет, это отдельный этап
// (см. раздел 10 плана, Users & Auth). Пароль передаётся на каждый запрос
// как Authorization: Bearer <ADMIN_PASSWORD> (задаётся в .env бэкенда).
@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      // Лучше держать админку недоступной, чем открыть её без защиты
      // из-за забытой переменной окружения.
      throw new UnauthorizedException(
        "Админка не настроена: задайте ADMIN_PASSWORD в .env бэкенда"
      );
    }

    if (!token || token !== adminPassword) {
      throw new UnauthorizedException("Неверный пароль администратора");
    }

    return true;
  }
}
