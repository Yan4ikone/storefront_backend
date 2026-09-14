import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";
import { CreateProductDto, UpdateProductDto } from "./dto/product.dto";

@Injectable()
export class AdminCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Категории ---

  getCategories() {
    return this.prisma.category.findMany({ orderBy: { name: "asc" } });
  }

  async createCategory(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({ data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException(`Раздел с slug "${dto.slug}" уже существует`);
      }
      throw error;
    }
  }

  async updateCategory(slug: string, dto: UpdateCategoryDto) {
    await this.ensureCategoryExists(slug);
    return this.prisma.category.update({ where: { slug }, data: dto });
  }

  async deleteCategory(slug: string) {
    await this.ensureCategoryExists(slug);
    try {
      await this.prisma.category.delete({ where: { slug } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictException(
          "Нельзя удалить раздел, пока в нём есть товары — сначала перенесите или удалите их"
        );
      }
      throw error;
    }
    return { ok: true };
  }

  private async ensureCategoryExists(slug: string) {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category) {
      throw new NotFoundException(`Раздел "${slug}" не найден`);
    }
  }

  // --- Товары ---

  getProducts() {
    return this.prisma.product.findMany({
      include: { category: true, compatibilityModels: { include: { compatibilityModel: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getProduct(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { compatibilityModels: { include: { compatibilityModel: true } } },
    });
    if (!product) {
      throw new NotFoundException(`Товар "${slug}" не найден`);
    }
    return product;
  }

  async createProduct(dto: CreateProductDto) {
    await this.ensureCategoryExists(dto.categorySlug);
    const { compatibilityModelSlugs, ...rest } = dto;
    try {
      return await this.prisma.product.create({
        data: {
          ...rest,
          specs: dto.specs as unknown as Prisma.InputJsonValue,
          compatibilityModels: compatibilityModelSlugs?.length
            ? { create: compatibilityModelSlugs.map((compatibilityModelSlug) => ({ compatibilityModelSlug })) }
            : undefined,
        },
        include: { compatibilityModels: { include: { compatibilityModel: true } } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException(`Товар с slug "${dto.slug}" уже существует`);
      }
      throw error;
    }
  }

  async updateProduct(slug: string, dto: UpdateProductDto) {
    await this.getProduct(slug);
    if (dto.categorySlug) {
      await this.ensureCategoryExists(dto.categorySlug);
    }
    const { compatibilityModelSlugs, ...rest } = dto;
    return this.prisma.product.update({
      where: { slug },
      data: {
        ...rest,
        specs: dto.specs ? (dto.specs as unknown as Prisma.InputJsonValue) : undefined,
        // Полная замена набора связей — проще и надёжнее, чем сравнивать старый/
        // новый список построчно. Не задано в запросе — связи не трогаем.
        compatibilityModels: compatibilityModelSlugs
          ? {
              deleteMany: {},
              create: compatibilityModelSlugs.map((compatibilityModelSlug) => ({ compatibilityModelSlug })),
            }
          : undefined,
      },
      include: { compatibilityModels: { include: { compatibilityModel: true } } },
    });
  }

  async deleteProduct(slug: string) {
    await this.getProduct(slug);
    await this.prisma.product.delete({ where: { slug } });
    return { ok: true };
  }
}
