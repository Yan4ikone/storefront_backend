# Собственный Dockerfile для деплоя backend на Timeweb Cloud App Platform.
# Используется вместо автоматического (buildpack) режима — тот жёстко запускает
# на шаге установки зависимостей либо `npm ci`, либо `npm install` без флагов,
# без какой-либо возможности передать `--legacy-peer-deps` (см. лог сборки:
# конфликт peer-зависимостей @nestjs/schematics@12 <-> typescript@5.x). Здесь
# мы полностью сами описываем шаги сборки, поэтому флаг применяется гарантированно.

FROM node:20-slim

WORKDIR /app

# Копируем всё сразу — проект небольшой, дополнительное кэширование слоёв
# по package.json отдельно не даёт ощутимого выигрыша, а усложняет Dockerfile.
COPY . .

RUN npm install --legacy-peer-deps

# Генерирует Prisma Client (типы для @prisma/client) — без этого `nest build`
# не скомпилируется, т.к. код импортирует сгенерированные типы.
RUN npx prisma generate

RUN npm run build

# Порт совпадает с PORT из .env.example / переменных окружения приложения.
EXPOSE 3001

# migrate deploy безопасно выполнять при каждом запуске контейнера — он только
# накатывает ещё не применённые миграции и ничего не удаляет (см. README).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
