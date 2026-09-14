import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { User, UserRole } from "@prisma/client";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // Нет декоратора @Roles — значит достаточно быть залогиненным (JwtAuthGuard).
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: User }>();
    const user = request.user;
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException("Недостаточно прав для этого действия");
    }
    return true;
  }
}
