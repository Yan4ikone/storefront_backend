import { IsArray, IsOptional, IsString, Matches, MinLength } from "class-validator";

// slug — часть URL (/catalog/:slug) и первичный ключ в БД, поэтому его нельзя
// менять через UpdateCategoryDto: если понадобится переименовать раздел по
// сути, проще удалить и создать заново.
export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9-]+$/, {
    message: "slug: только латинские строчные буквы, цифры и дефис",
  })
  slug!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  // Ключ иконки Lucide, см. lib/icon-map.ts на фронте — если ключа там нет,
  // витрина покажет нейтральную иконку по умолчанию, ничего не сломается.
  @IsString()
  icon!: string;

  @IsArray()
  @IsString({ each: true })
  items!: string[];
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  items?: string[];
}
