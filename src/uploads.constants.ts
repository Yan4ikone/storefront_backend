import { join } from "path";

// process.cwd() — а не __dirname — чтобы путь совпадал и при `npm run start:dev`
// (ts-node, корень проекта), и при `node dist/src/main` (см. Dockerfile CMD):
// в обоих случаях процесс запускается из корня backend/.
// ВАЖНО: диск контейнера на Timeweb Cloud App Platform не переживает
// передеплой (см. claude/arhitektura-i-plan.md, backlog) — загруженные сюда
// фото исчезнут при следующем деплое. Это сознательный временный компромисс,
// пока не подключено объектное хранилище (S3); до переезда на него не
// удаляйте и не пересобирайте контейнер без необходимости сразу после
// загрузки фото.
export const UPLOADS_DIR = join(process.cwd(), "uploads");
export const PRODUCT_IMAGES_DIR = join(UPLOADS_DIR, "products");
