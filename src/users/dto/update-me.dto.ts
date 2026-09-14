import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

// Смены пароля здесь пока нет — отдельная задача (плюс восстановление пароля),
// не входила в объём этого этапа.
export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: "Некорректный email" })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(5, { message: "Некорректный телефон" })
  phone?: string;
}
