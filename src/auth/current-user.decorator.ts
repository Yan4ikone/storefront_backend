import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { User } from "@prisma/client";

// @CurrentUser() в контроллере — читает request.user, который проставил
// JwtAuthGuard. Использовать только под этим гвардом, иначе будет undefined.
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest<Request & { user: User }>();
  return request.user;
});
