import type { User } from "@prisma/client";

// То, что можно отдавать наружу (без passwordHash). Используется и в
// src/auth (ответ на регистрацию/вход), и в src/admin (проверка сессии).
export interface PublicUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role: string;
  createdAt: Date;
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}
