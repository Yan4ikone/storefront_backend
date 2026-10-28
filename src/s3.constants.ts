// Timeweb Cloud S3-совместимое объектное хранилище — сюда заливаются фото
// товаров (см. S3StorageService и AdminCatalogService.addProductImage), чтобы
// они переживали передеплой backend на Timeweb App Platform: локальный диск
// контейнера не сохраняется между деплоями (см. claude/arhitektura-i-plan.md,
// раздел 9/C1), а S3-хранилище — отдельный сервис, диск которого не трогается.
//
// Значения по умолчанию (endpoint/регион) — для самого Timeweb Cloud, см.
// https://timeweb.cloud/docs/s3-storage. Бакет и ключи доступа — свои,
// обязательно задаются переменными окружения.
export const S3_ENDPOINT = process.env.S3_ENDPOINT ?? "https://s3.twcstorage.ru";
export const S3_REGION = process.env.S3_REGION ?? "ru-1";
export const S3_BUCKET = process.env.S3_BUCKET ?? "";
export const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY ?? "";
export const S3_SECRET_KEY = process.env.S3_SECRET_KEY ?? "";

// Публичный адрес файла в бакете — path-style, как у Timeweb по умолчанию:
// https://s3.twcstorage.ru/<бакет>/<ключ> (см. документацию выше). Бакет
// должен быть публичным (тип "Публичный" в панели S3), иначе файл не
// откроется без подписанной ссылки. Если к бакету привязан свой домен —
// переопределите через S3_PUBLIC_URL (без слэша на конце).
export const S3_PUBLIC_URL = (process.env.S3_PUBLIC_URL ?? `${S3_ENDPOINT}/${S3_BUCKET}`).replace(/\/+$/, "");
