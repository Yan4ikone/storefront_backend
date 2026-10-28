import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { toPublicUser } from "../users/public-user";

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomers() {
    const users = await this.prisma.user.findMany({
      where: { role: "customer" },
      orderBy: { createdAt: "desc" },
    });
    return users.map(toPublicUser);
  }

  async setBalance(id: string, balance: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Пользователь "${id}" не найден`);
    }
    const updated = await this.prisma.user.update({ where: { id }, data: { balance } });
    return toPublicUser(updated);
  }
}
