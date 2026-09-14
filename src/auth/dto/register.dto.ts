import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

// Нужен email ИЛИ телефон (хотя бы один) — это проверяется в AuthService,
// а не декораторами, чтобы вернуть один понятный текст ошибки.
export class RegisterDto {
  @IsOptional()
  @IsEmail({}, { message: "Некорректный email" })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(5, { message: "Некорректный телефон" })
  phone?: string;

  @IsString()
  @MinLength(6, { message: "Пароль должен быть не короче 6 символов" })
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;
}
