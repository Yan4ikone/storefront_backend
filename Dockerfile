# Собственный Dockerfile для деплоя backend на Timeweb Cloud App Platform.
# Используется вместо автоматического (buildpack) режима — тот жёстко запускает
# на шаге установки зависимостей либо `npm ci`, либо `npm install` без флагов,
# без какой-либо возможности передать `--legacy-peer-deps` (см. лог сборки:
# конфликт peer-зависимостей @nestjs/schematics@12 <-> typescript@5.x). Здесь
# мы полностью сами описываем шаги сборки, поэтому флаг применяется гарантированно.
#
# node:22, а не 20 — часть зависимостей (@angular-devkit/schematics,
# @angular-devkit/core, commander и т.п., подтягиваются через Nest CLI)
# требует Node >=22.12.0 (engines), на 20-й версии npm install выдавал
# предупреждения EBADENGINE.

FROM node:22-slim

WORKDIR /app

# Prisma-движок на этапе выполнения ищет системный libssl/OpenSSL — в базовом
# образе node:20-slim (Debian) он не установлен по умолчанию, из-за чего
# Prisma не может определить версию OpenSSL и падает/ругается в логах.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Копируем всё сразу — проект небольшой, дополнительное кэширование слоёв
# по package.json отдельно не даёт ощутимого выигрыша, а усложняет Dockerfile.
COPY . .

# "Взрыватель" кэша: у Timeweb App Platform этот шаг иногда брался из кэша
# предыдущей сборки даже после изменений в package.json (см. историю чата —
# из-за этого однажды задеплоилась версия @aws-sdk/client-s3 с багом
# ETARGET, хотя в коммите она уже была исправлена). echo с меняющейся
# строкой перед npm install гарантированно делает этот RUN-слой новым для
# Docker, независимо от того, как именно платформа кэширует предыдущие шаги.
# Если нужно принудительно сбросить кэш установки зависимостей — просто
# поменяйте строку после "cache-bust:" на любую другую.
RUN echo "cache-bust: 2026-10-29-01" && npm install --legacy-peer-deps

# Генерирует Prisma Client (типы для @prisma/client) — без этого `nest build`
# не скомпилируется, т.к. код импортирует сгенерированные типы.
RUN npx prisma generate

RUN npm run build

# Порт совпадает с PORT из .env.example / переменных окружения приложения.
EXPOSE 3001

# migrate deploy безопасно выполнять при каждом запуске контейнера — он только
# накатывает ещё не применённые миграции и ничего не удаляет (см. README).
# Точка входа — dist/src/main.js, а не dist/main.js: в tsconfig.json не задан
# rootDir, поэтому tsc/nest build сохраняет структуру папок и кладёт всё под
# dist/<sourceRoot> (sourceRoot = "src" в nest-cli.json).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
