import { IsString, MinLength } from "class-validator";

export class LoginDto {
  // Email или телефон — какой из них, определяем на бэкенде поиском по обоим полям.
  @IsString()
  @MinLength(3)
  emailOrPhone!: string;

  @IsString()
  @MinLength(1, { message: "Введите пароль" })
  password!: string;
}
