import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { toPublicUser } from "./public-user";
import { UpdateMeDto } from "./dto/update-me.dto";

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

  // Заказы конкретного покупателя для личного кабинета — в отличие от
  // /admin/orders (все заказы, только для admin/manager), здесь всегда
  // только свои.
  getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
