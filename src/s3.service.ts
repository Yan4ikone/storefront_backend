import { Injectable } from "@nestjs/common";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { S3_ACCESS_KEY, S3_BUCKET, S3_ENDPOINT, S3_PUBLIC_URL, S3_REGION, S3_SECRET_KEY } from "./s3.constants";

// Тонкая обёртка над aws-sdk для Timeweb S3 (S3-совместимое API, см.
// s3.constants.ts) — используется для фото товаров (см. AdminCatalogService),
// чтобы детали протокола S3 (ключи, forcePathStyle и т.д.) не размазывались
// по сервисам каталога.
@Injectable()
export class S3StorageService {
  private readonly client = new S3Client({
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    credentials: { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY },
    // Timeweb (как и большинство S3-совместимых провайдеров, не-AWS) отдаёт
    // бакет по пути /<bucket>/<key>, а не через поддомен бакета — без этого
    // флага aws-sdk по умолчанию попробует virtual-hosted style и получит 404.
    forcePathStyle: true,
  });

  // ACL на уровне объекта здесь не используется: публичность у Timeweb
  // настраивается на уровне самого бакета (тип "Публичный" в панели S3), а
  // не через ACL каждого файла — так проще и не зависит от того, поддерживает
  // ли конкретный S3-совместимый провайдер заголовок x-amz-acl.
  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: body, ContentType: contentType })
    );
    return `${S3_PUBLIC_URL}/${key}`;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  }

  // Достаёт ключ объекта из публичного URL, который сами же выдали в upload()
  // и сохранили в Product.images — нужно для удаления (removeProductImage
  // получает от фронта полный URL, а не ключ).
  keyFromUrl(url: string): string | null {
    if (!url.startsWith(`${S3_PUBLIC_URL}/`)) return null;
    return url.slice(S3_PUBLIC_URL.length + 1);
  }
}
