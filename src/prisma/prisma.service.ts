import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Managed PostgreSQL на Timeweb сам рвёт простаивающие соединения по
  // idle-session timeout (видно в логах БД: "terminating connection due to
  // idle-session timeout"). Пул соединений Prisma об этом не узнаёт сразу —
  // следующий запрос, который достаётся "протухшему" соединению, виснет или
  // падает по таймауту на стороне клиента (именно так выглядел баг со входом
  // в админку после паузы). Лечим простым пингом раз в 4 минуты — заметно
  // короче наблюдаемого серверного idle-timeout (в логах разрывы шли с
  // интервалом от ~20 минут), так что соединение из пула никогда не успевает
  // "остыть" настолько, чтобы сервер его закрыл.
  private keepAliveTimer?: NodeJS.Timeout;

  async onModuleInit() {
    await this.$connect();
    this.keepAliveTimer = setInterval(() => {
      this.$queryRaw`SELECT 1`.catch(() => undefined);
    }, 4 * 60 * 1000);
  }

  async onModuleDestroy() {
    if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
    await this.$disconnect();
  }
}
