import { Controller, Get, Param, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { QueryCompatibilityDto, QueryProductsDto } from "./dto/catalog-query.dto";

// Пути соответствуют разделу 6 плана архитектуры: GET /catalog/...
// (глобальный префикс /api/v1 добавляется в main.ts).
@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("categories")
  getCategories() {
    return this.catalogService.getCategories();
  }

  @Get("categories/:slug")
  getCategory(@Param("slug") slug: string) {
    return this.catalogService.getCategoryBySlug(slug);
  }

  // Список моделей устройств для чекбоксов фильтра "Совместимость" — см.
  // QueryCompatibilityDto. Используется и витриной, и админкой (для формы товара).
  @Get("compatibility")
  getCompatibility(@Query() query: QueryCompatibilityDto) {
    return this.catalogService.getCompatibilityModels(query.category);
  }

  @Get("products")
  getProducts(@Query() query: QueryProductsDto) {
    return this.catalogService.getProducts(query);
  }

  @Get("products/:slug")
  getProduct(@Param("slug") slug: string) {
    return this.catalogService.getProductBySlug(slug);
  }
}
