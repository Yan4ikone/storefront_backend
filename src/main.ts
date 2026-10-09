import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { UPLOADS_DIR } from "./uploads.constants";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // /uploads (фото товаров, см. AdminCatalogService.addProductImage) отдаётся
  // как статика через Express напрямую — setGlobalPrefix ниже затрагивает
  // только маршруты @Controller, на express.static не влияет, поэтому
  // отдельно исключать "/uploads" из префикса не нужно.
  app.useStaticAssets(UPLOADS_DIR, { prefix: "/uploads" });
  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "http://localhost:3000",
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API запущен: http://localhost:${port}/api/v1`);
}

bootstrap();
