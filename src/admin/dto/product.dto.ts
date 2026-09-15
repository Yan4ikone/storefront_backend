import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class SpecItemDto {
  @IsString()
  label!: string;

  @IsString()
  value!: string;
}

// slug — первичный ключ и часть URL (/product/:slug), а ещё на него ссылаются
// уже сделанные заказы (OrderItem.productSlug) — поэтому, как и у категорий,
// он не редактируется через UpdateProductDto.
export class CreateProductDto {
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9-]+$/, {
    message: "slug: только латинские строчные буквы, цифры и дефис",
  })
  slug!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  categorySlug!: string;

  @IsString()
  compatibility!: string;

  @IsInt()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  oldPrice?: number;

  @IsOptional()
  @IsString()
  badge?: string;

  // Внутренний код товара — необязателен (не у всех товаров сразу есть артикул),
  // но если задан, должен быть уникальным (см. schema.prisma @unique).
  @IsOptional()
  @IsString()
  article?: string;

  @IsString()
  description!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecItemDto)
  specs!: SpecItemDto[];

  // "В наличии" (true) / "под заказ" (false). Не задано в запросе — берётся
  // значение по умолчанию из schema.prisma (true).
  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  // slug'и моделей устройств (CompatibilityModel) для фильтра "Совместимость" —
  // список актуальных значений отдаёт GET /catalog/compatibility. Необязательное
  // поле: без него товар считается универсальным (не привязан ни к одной модели).
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  compatibilityModelSlugs?: string[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  compatibility?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  oldPrice?: number;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsString()
  article?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecItemDto)
  specs?: SpecItemDto[];

  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  // Полностью заменяет набор моделей устройств товара (не задано в запросе —
  // текущие связи не трогаются; пустой массив — снять все).
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  compatibilityModelSlugs?: string[];
}
