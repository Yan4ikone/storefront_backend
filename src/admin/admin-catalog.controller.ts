import {
  Body,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
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

  // Фото товара — файл приходит как multipart/form-data, поле "file". Храним
  // в памяти (не на диск multer'ом), потому что всё равно пересжимаем через
  // sharp (см. AdminCatalogService.addProductImage) — исходный файл на диск
  // писать не нужно.
  @Post("products/:slug/images")
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } }))
  uploadImage(
    @Param("slug") slug: string,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 8 * 1024 * 1024 })] }))
    file: Express.Multer.File
  ) {
    return this.adminCatalogService.addProductImage(slug, file);
  }

  @Delete("products/:slug/images")
  deleteImage(@Param("slug") slug: string, @Body("path") imagePath: string) {
    return this.adminCatalogService.removeProductImage(slug, imagePath);
  }
}
