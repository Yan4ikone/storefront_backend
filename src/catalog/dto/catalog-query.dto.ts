import { Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";

export const PRODUCT_SORT_OPTIONS = ["new", "price_asc", "price_desc"] as const;
export type ProductSort = (typeof PRODUCT_SORT_OPTIONS)[number];

// Параметры GET /catalog/products — один и тот же эндпоинт обслуживает и обычный
// просмотр раздела (только category), и поиск по всему каталогу (только q, см.
// GET /search на фронте), и их сочетание — чтобы не заводить два набора фильтров
// по цене/совместимости для разных сценариев.
export class QueryProductsDto {
  @IsOptional()
  @IsString()
  category?: string;

  // Поисковая строка — если задана, включается полнотекстовый поиск Postgres
  // (см. CatalogService.searchProducts) вместо обычной выборки.
  @IsOptional()
  @IsString()
  q?: string;

  // slug'и моделей устройств через запятую (?compatibility=iphone-12,iphone-13) —
  // совпадение по ЛЮБОЙ из них (обычная логика ИЛИ для чекбоксов мультивыбора).
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.split(",").filter(Boolean) : value
  )
  @IsString({ each: true })
  compatibility?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsIn(PRODUCT_SORT_OPTIONS)
  sort?: ProductSort;
}

// Параметры GET /catalog/compatibility — список моделей устройств для чекбоксов
// фильтра, опционально ограниченный товарами одного раздела.
export class QueryCompatibilityDto {
  @IsOptional()
  @IsString()
  category?: string;
}
