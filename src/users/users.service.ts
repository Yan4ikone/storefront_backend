import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { toPublicUser } from "./public-user";
import { UpdateMeDto } from "./dto/update-me.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateMe(userId: string, dto: UpdateMeDto) {
    if (dto.email || dto.phone) {
      const clashing = await this.prisma.user.findFirst({
        where: {
          id: { not: userId },
          OR: [dto.email ? { email: dto.email } : undefined, dto.phone ? { phone: dto.phone } : undefined].filter(
            (clause): clause is NonNullable<typeof clause> => Boolean(clause)
          ),
        },
      });
      if (clashing) {
        throw new ConflictException("Этот email или телефон уже используется другим аккаунтом");
      }
    }

    const user = await this.prisma.user.update({ where: { id: userId }, data: dto });
    return toPublicUser(user);
  }

  // Смена пароля из личного кабинета — требует знания текущего пароля
  // (восстановление "забыл пароль" пока не реализовано, см. backlog плана).
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException("Текущий пароль указан неверно");
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException("Новый пароль должен отличаться от текущего");
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { ok: true };
  }

  // Заказы конкретного покупателя для личного кабинета — в отличие от
  // /admin/orders (все заказы, только для admin/manager), здесь всегда
  // только свои.
  getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      // Миниатюра товара в истории заказов — текущее фото из каталога (не
      // снимок на момент заказа: если его сменили, покажется новое).
      include: { items: { include: { product: { select: { images: true } } } } },
      orderBy: { createdAt: "desc" },
    });
  }

  // --- Избранное ---

  getFavorites(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: { product: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async addFavorite(userId: string, productSlug: string) {
    const product = await this.prisma.product.findUnique({ where: { slug: productSlug } });
    if (!product) {
      throw new BadRequestException(`Товар "${productSlug}" не найден`);
    }
    await this.prisma.favorite.upsert({
      where: { userId_productSlug: { userId, productSlug } },
      create: { userId, productSlug },
      update: {},
    });
    return { ok: true };
  }

  async removeFavorite(userId: string, productSlug: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, productSlug } });
    return { ok: true };
  }
}
