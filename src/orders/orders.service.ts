import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { Order, OrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";

interface SnapshotItem {
  productSlug: string;
  name: string;
  price: number;
  qty: number;
  inStock: boolean;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // Возвращает массив заказов: обычно один, но если покупатель выбрал
  // "оформить раздельно" и в корзине реально есть и "в наличии", и "под
  // заказ" товары — два заказа с общим groupId (см. схему и DTO).
  async create(dto: CreateOrderDto, userId?: string): Promise<Order[]> {
    if (dto.items.length === 0) {
      throw new BadRequestException("В заказе должен быть хотя бы один товар");
    }
    if (dto.deliveryMethod === "courier" && !dto.address?.trim()) {
      throw new BadRequestException("Для курьерской доставки нужно указать адрес");
    }

    // Название, цену и наличие берём из каталога на момент оформления заказа,
    // а не то, что прислал браузер — иначе цену можно было бы подменить на клиенте.
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

    const allItems: SnapshotItem[] = dto.items.map((item) => {
      const product = bySlug.get(item.productSlug)!;
      return {
        productSlug: product.slug,
        name: product.name,
        price: product.price,
        qty: item.qty,
        inStock: product.inStock,
      };
    });

    if (dto.splitByAvailability) {
      const availableItems = allItems.filter((i) => i.inStock);
      const backorderItems = allItems.filter((i) => !i.inStock);

      if (availableItems.length > 0 && backorderItems.length > 0) {
        const groupId = randomUUID();
        const [orderA, orderB] = await Promise.all([
          this.createSingleOrder(dto, availableItems, userId, groupId),
          this.createSingleOrder(dto, backorderItems, userId, groupId),
        ]);
        return [orderA, orderB];
      }
    }

    return [await this.createSingleOrder(dto, allItems, userId, null)];
  }

  private createSingleOrder(
    dto: CreateOrderDto,
    items: SnapshotItem[],
    userId: string | undefined,
    groupId: string | null
  ) {
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
        groupId,
        items: { create: items },
      },
      include: { items: true },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: { select: { images: true } } } } },
    });
    if (!order) {
      throw new NotFoundException(`Заказ "${id}" не найден`);
    }
    return order;
  }

  // Для страницы подтверждения раздельного заказа (/order/group/:groupId на
  // фронте) — оба заказа, получившиеся из одной корзины при разделении.
  async findByGroupId(groupId: string) {
    const orders = await this.prisma.order.findMany({
      where: { groupId },
      include: { items: { include: { product: { select: { images: true } } } } },
      orderBy: { createdAt: "asc" },
    });
    if (orders.length === 0) {
      throw new NotFoundException(`Заказы группы "${groupId}" не найдены`);
    }
    return orders;
  }

  // Используется только админкой (см. src/admin) — публичного GET /orders нет
  // намеренно, это был бы просмотр чужих заказов без авторизации.
  findAll() {
    return this.prisma.order.findMany({
      include: { items: { include: { product: { select: { images: true } } } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    await this.findOne(id);
    // Смена статуса администратором закрывает и открытый запрос на отмену
    // (например, если менеджер решил всё же выполнить заказ, а не отменять).
    return this.prisma.order.update({
      where: { id },
      data: { status, cancellationRequested: false },
    });
  }

  // Покупатель нажал "Отменить заказ" в личном кабинете. "Новый" заказ ещё
  // никто не начал собирать — удаляется сразу. Более поздний статус требует
  // подтверждения менеджера/админа (см. resolveCancellationRequest).
  async cancelByCustomer(id: string, userId: string) {
    const order = await this.findOne(id);
    if (order.userId !== userId) {
      throw new ForbiddenException("Это не ваш заказ");
    }
    if (order.status === "cancelled") {
      throw new BadRequestException("Заказ уже отменён");
    }
    if (order.status === "delivered") {
      throw new BadRequestException("Заказ уже доставлен, отменить его нельзя");
    }

    if (order.status === "new") {
      await this.prisma.orderItem.deleteMany({ where: { orderId: id } });
      await this.prisma.order.delete({ where: { id } });
      return { ok: true, deleted: true };
    }

    if (order.cancellationRequested) {
      return { ok: true, deleted: false, alreadyRequested: true };
    }

    await this.prisma.order.update({
      where: { id },
      data: { cancellationRequested: true },
    });
    return { ok: true, deleted: false, alreadyRequested: false };
  }

  // Админ/менеджер разбирает запрос на отмену от покупателя: approve=true —
  // подтверждает (статус -> cancelled), approve=false — отклоняет (заказ
  // продолжает идти своим статусом, флаг просто снимается).
  async resolveCancellationRequest(id: string, approve: boolean) {
    const order = await this.findOne(id);
    if (!order.cancellationRequested) {
      throw new BadRequestException("У этого заказа нет запроса на отмену");
    }
    return this.prisma.order.update({
      where: { id },
      data: {
        cancellationRequested: false,
        status: approve ? "cancelled" : order.status,
      },
    });
  }
}
