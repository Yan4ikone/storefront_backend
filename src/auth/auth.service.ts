import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import type { User, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { toPublicUser, type PublicUser } from "../users/public-user";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

// Токен подписывается напрямую пакетом jsonwebtoken (а не @nestjs/jwt) — так
// проще не зависеть от версии Nest в peerDependencies пакета: с NestJS 12
// уже был случай ERESOLVE-конфликта при апгрейде (см. историю чата), а
// jsonwebtoken/bcryptjs от версии Nest вообще не зависят.
const TOKEN_TTL = "30d";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  private get secret(): string {
    const secret = this.config.get<string>("JWT_SECRET");
    if (!secret) {
      throw new Error("JWT_SECRET не задан в .env бэкенда — вход и регистрация не будут работать");
    }
    return secret;
  }

  private sign(user: Pick<User, "id" | "role">): string {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return jwt.sign(payload, this.secret, { expiresIn: TOKEN_TTL });
  }

  verify(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.secret) as JwtPayload;
    } catch {
      return null;
    }
  }

  // Используется контроллером заказов: гостевой чекаут остаётся рабочим, но
  // если в заголовке пришёл валидный токен — заказ привязывается к аккаунту.
  // Никогда не бросает исключение — отсутствие/невалидность токена не должны
  // мешать оформить заказ как гость.
  async getUserFromAuthHeader(authHeader?: string): Promise<User | null> {
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
    if (!token) return null;
    const payload = this.verify(token);
    if (!payload) return null;
    return this.prisma.user.findUnique({ where: { id: payload.sub } });
  }

  async register(dto: RegisterDto): Promise<{ user: PublicUser; token: string }> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException("Укажите email или телефон");
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [dto.email ? { email: dto.email } : undefined, dto.phone ? { phone: dto.phone } : undefined].filter(
          (clause): clause is NonNullable<typeof clause> => Boolean(clause)
        ),
      },
    });
    if (existing) {
      throw new ConflictException("Пользователь с таким email или телефоном уже зарегистрирован");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, phone: dto.phone, name: dto.name, passwordHash },
    });

    return { user: toPublicUser(user), token: this.sign(user) };
  }

  async login(dto: LoginDto): Promise<{ user: PublicUser; token: string }> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.emailOrPhone }, { phone: dto.emailOrPhone }] },
    });
    if (!user) {
      throw new UnauthorizedException("Неверный логин или пароль");
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Неверный логин или пароль");
    }

    return { user: toPublicUser(user), token: this.sign(user) };
  }
}
