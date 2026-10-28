import { IsInt, Min } from "class-validator";

// Баланс — пока ручная заглушка (см. комментарий у User.balance в
// schema.prisma): меняет только админ, реального пополнения через платёжный
// сервис ещё нет.
export class UpdateBalanceDto {
  @IsInt()
  @Min(0)
  balance!: number;
}
