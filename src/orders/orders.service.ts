import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto, userId?: string) {
    if (dto.items.length === 0) {
      throw new BadRequestException("В заказе должен быть хотя бы один товар");
    }
    if (dto.deliveryMethod === "courier" && !dto.address?.trim()) {
      throw new BadRequestException("Для курьерской доставки нужно указать адрес");
    }

    // Название и цену берём из каталога на момент оформления заказа, а не то,
    // что прислал браузер — иначе цену можно было бы подменить на клиенте.
    const slugs = dto.items.map((item) => item.productSlug);
    const products = await this.prisma.product.findMany({
      where: { slug: { in: slugs } },
    });
    const bySlug = new Map(products.map((product) => [product.slug, product]));

    const missing = slugs.filter((slug) => !bySlug.has(slug));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Товары не найдены в каталоге: ${missing.join(", ")}`
      );
    }

    const items = dto.items.map((item) => {
      const product = bySlug.get(item.productSlug)!;
      return {
        productSlug: product.slug,
        name: product.name,
        price: product.price,
        qty: item.qty,
      };
    });
    const itemsTotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

    return this.prisma.order.create({
      data: {
        customerName: dto.customerName,
        phone: dto.phone,
        email: dto.email,
        deliveryMethod: dto.deliveryMethod,
        address: dto.address,
        comment: dto.comment,
        itemsTotal,
        userId,
        items: { create: items },
      },
      include: { items: true },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException(`Заказ "${id}" не найден`);
    }
    return order;
  }

  // Используется только админкой (см. src/admin) — публичного GET /orders нет
  // намеренно, это был бы просмотр чужих заказов без авторизации.
  findAll() {
    return this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    return this.prisma.order.update({ where: { id }, data: { status } });
  }
}
