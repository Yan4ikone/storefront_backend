import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { QueryProductsDto } from "./dto/catalog-query.dto";

// Общий include для карточки/списка товаров — помимо раздела подтягиваем и
// связанные модели устройств (см. schema.prisma CompatibilityModel), чтобы
// фронт мог показать структурированную совместимость, а не только строку
// Product.compatibility.
const PRODUCT_INCLUDE = {
  category: true,
  compatibilityModels: { include: { compatibilityModel: true } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  getCategories() {
    return this.prisma.category.findMany({ orderBy: { name: "asc" } });
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category) {
      throw new NotFoundException(`Раздел "${slug}" не найден`);
    }
    return category;
  }

  // Модели устройств, реально встречающиеся среди товаров (опционально — только
  // внутри одного раздела), сгруппированные по производителю — для чекбоксов
  // фильтра "Совместимость". Не путать с Category.items (произвольные текстовые
  // подпункты раздела вроде "Камеры"/"Шлейфы" — они про тип товара, а не про модель устройства).
  async getCompatibilityModels(categorySlug?: string) {
    const models = await this.prisma.compatibilityModel.findMany({
      where: {
        products: categorySlug ? { some: { product: { categorySlug } } } : { some: {} },
      },
      orderBy: [{ brand: "asc" }, { model: "asc" }],
    });

    const byBrand = new Map<string, { slug: string; model: string }[]>();
    for (const m of models) {
      const list = byBrand.get(m.brand) ?? [];
      list.push({ slug: m.slug, model: m.model });
      byBrand.set(m.brand, list);
    }
    return Array.from(byBrand.entries()).map(([brand, models]) => ({ brand, models }));
  }

  getProducts(query: QueryProductsDto) {
    const q = query.q?.trim();
    if (q) {
      return this.searchProducts(q, query);
    }

    return this.prisma.product.findMany({
      where: this.buildWhere(query),
      include: PRODUCT_INCLUDE,
      orderBy: this.buildOrderBy(query.sort),
    });
  }

  private buildWhere(query: QueryProductsDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};
    if (query.category) {
      where.categorySlug = query.category;
    }
    if (query.minPrice != null || query.maxPrice != null) {
      where.price = {
        ...(query.minPrice != null ? { gte: query.minPrice } : {}),
        ...(query.maxPrice != null ? { lte: query.maxPrice } : {}),
      };
    }
    if (query.compatibility?.length) {
      where.compatibilityModels = {
        some: { compatibilityModelSlug: { in: query.compatibility } },
      };
    }
    return where;
  }

  private buildOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
    if (sort === "price_asc") return { price: "asc" };
    if (sort === "price_desc") return { price: "desc" };
    return { createdAt: "desc" };
  }

  // Полнотекстовый поиск средствами Postgres (to_tsvector/plainto_tsquery,
  // русская конфигурация) с ранжированием по релевантности (ts_rank_cd),
  // считается на лету по name + description + compatibility. Отдельного
  // индексируемого tsvector-столбца пока нет — при текущем размере каталога
  // (десятки-сотни товаров) это быстро без доп. миграций; при заметном росте
  // каталога стоит завести generated tsvector-колонку с GIN-индексом.
  //
  // Prisma не хранит объекты с сырых SQL-запросов как модели с relations, поэтому
  // делаем это в два шага: сырым SQL находим slug'и в нужном порядке, а затем
  // обычным findMany подтягиваем полные объекты (с include) и восстанавливаем порядок.
  private async searchProducts(q: string, query: QueryProductsDto) {
    // COALESCE(p.article, '') — артикул есть не у всех товаров (nullable),
    // конкатенация NULL || строка дала бы NULL и товар выпал бы из индекса.
    const conditions: Prisma.Sql[] = [
      Prisma.sql`to_tsvector('russian', p.name || ' ' || p.description || ' ' || p.compatibility || ' ' || COALESCE(p.article, '')) @@ plainto_tsquery('russian', ${q})`,
    ];
    if (query.category) {
      conditions.push(Prisma.sql`p."categorySlug" = ${query.category}`);
    }
    if (query.minPrice != null) {
      conditions.push(Prisma.sql`p.price >= ${query.minPrice}`);
    }
    if (query.maxPrice != null) {
      conditions.push(Prisma.sql`p.price <= ${query.maxPrice}`);
    }
    if (query.compatibility?.length) {
      conditions.push(
        Prisma.sql`EXISTS (
          SELECT 1 FROM product_compatibility pc
          WHERE pc."productSlug" = p.slug
            AND pc."compatibilityModelSlug" IN (${Prisma.join(query.compatibility)})
        )`
      );
    }

    const orderBy =
      query.sort === "price_asc"
        ? Prisma.sql`p.price ASC`
        : query.sort === "price_desc"
          ? Prisma.sql`p.price DESC`
          : Prisma.sql`ts_rank_cd(to_tsvector('russian', p.name || ' ' || p.description || ' ' || p.compatibility || ' ' || COALESCE(p.article, '')), plainto_tsquery('russian', ${q})) DESC`;

    const rows = await this.prisma.$queryRaw<{ slug: string }[]>(
      Prisma.sql`SELECT p.slug FROM products p WHERE ${Prisma.join(conditions, " AND ")} ORDER BY ${orderBy} LIMIT 200`
    );

    const slugs = rows.map((r) => r.slug);
    if (slugs.length === 0) return [];

    const found = await this.prisma.product.findMany({
      where: { slug: { in: slugs } },
      include: PRODUCT_INCLUDE,
    });
    const bySlug = new Map(found.map((p) => [p.slug, p]));
    // findMany с `{ in }` не сохраняет порядок аргумента — восстанавливаем порядок
    // по релевантности/сортировке, посчитанный в сыром запросе выше.
    return slugs.map((slug) => bySlug.get(slug)).filter((p): p is (typeof found)[number] => Boolean(p));
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: PRODUCT_INCLUDE,
    });
    if (!product) {
      throw new NotFoundException(`Товар "${slug}" не найден`);
    }

    const related = await this.prisma.product.findMany({
      where: { categorySlug: product.categorySlug, NOT: { slug: product.slug } },
      take: 4,
    });

    return { ...product, related };
  }
}
