import { join } from "path";

// process.cwd() — а не __dirname — чтобы путь совпадал и при `npm run start:dev`
// (ts-node, корень проекта), и при `node dist/src/main` (см. Dockerfile CMD):
// в обоих случаях процесс запускается из корня backend/.
// С переездом на Timeweb S3 (см. src/s3.service.ts) новые фото товаров сюда
// больше не пишутся — AdminCatalogService.addProductImage заливает их в
// бакет. UPLOADS_DIR остаётся только как запасной путь удаления файлов,
// сохранённых по старой схеме (локальный диск, до подключения S3) — сам
// диск контейнера на Timeweb App Platform всё так же не переживает
// передеплой, поэтому для новых файлов на него больше не рассчитываем.
export const UPLOADS_DIR = join(process.cwd(), "uploads");
export const PRODUCT_IMAGES_DIR = join(UPLOADS_DIR, "products");
