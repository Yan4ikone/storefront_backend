import { Global, Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RolesGuard } from "./roles.guard";

// @Global — AuthService/JwtAuthGuard/RolesGuard нужны почти всем модулям
// (users, orders, admin), удобнее не импортировать AuthModule в каждый
// отдельно (по аналогии с PrismaModule).
@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
