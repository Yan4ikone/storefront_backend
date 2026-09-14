import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { AdminCatalogService } from "./admin-catalog.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";
import { CreateProductDto, UpdateProductDto } from "./dto/product.dto";

@Controller("admin/catalog")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "manager")
export class AdminCatalogController {
  constructor(private readonly adminCatalogService: AdminCatalogService) {}

  @Get("categories")
  getCategories() {
    return this.adminCatalogService.getCategories();
  }

  @Post("categories")
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminCatalogService.createCategory(dto);
  }

  @Patch("categories/:slug")
  updateCategory(@Param("slug") slug: string, @Body() dto: UpdateCategoryDto) {
    return this.adminCatalogService.updateCategory(slug, dto);
  }

  @Delete("categories/:slug")
  deleteCategory(@Param("slug") slug: string) {
    return this.adminCatalogService.deleteCategory(slug);
  }

  @Get("products")
  getProducts() {
    return this.adminCatalogService.getProducts();
  }

  @Get("products/:slug")
  getProduct(@Param("slug") slug: string) {
    return this.adminCatalogService.getProduct(slug);
  }

  @Post("products")
  createProduct(@Body() dto: CreateProductDto) {
    return this.adminCatalogService.createProduct(dto);
  }

  @Patch("products/:slug")
  updateProduct(@Param("slug") slug: string, @Body() dto: UpdateProductDto) {
    return this.adminCatalogService.updateProduct(slug, dto);
  }

  @Delete("products/:slug")
  deleteProduct(@Param("slug") slug: string) {
    return this.adminCatalogService.deleteProduct(slug);
  }
}
