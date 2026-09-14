import { SetMetadata } from "@nestjs/common";
import type { UserRole } from "@prisma/client";

export const ROLES_KEY = "roles";

// @Roles("admin", "manager") над контроллером/хендлером — используется вместе
// с JwtAuthGuard + RolesGuard (RolesGuard должен идти вторым в @UseGuards,
// чтобы request.user уже был проставлен).
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
