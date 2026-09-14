import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "./auth.service";

// Проверяет Authorization: Bearer <JWT> и кладёт пользователя в request.user —
// дальше его читают @CurrentUser() и RolesGuard. В отличие от старого
// AdminAuthGuard (общий пароль всей админки), теперь это токен конкретного
// аккаунта — годится и для покупателей (GET /users/me), и, вместе с
// RolesGuard, для админки.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    if (!token) {
      throw new UnauthorizedException("Нужно войти в аккаунт");
    }

    const payload = this.authService.verify(token);
    if (!payload) {
      throw new UnauthorizedException("Сессия недействительна — войдите заново");
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException("Аккаунт не найден");
    }

    (request as Request & { user: typeof user }).user = user;
    return true;
  }
}
