/*
  Правки с этой миграцией (пользовательские правки по сайту, см. чат):
  - Статус заказа становится enum (новый набор: new/confirmed/assembled/shipped/delivered,
    плюс cancelled отдельно) вместо произвольной строки; старое значение "done"
    переносится в "delivered".
  - У заказа появляется короткий номер (Order.number), флаг запроса на отмену
    (cancellationRequested) и groupId — для заказов, разделённых на "в наличии"/
    "под заказ" при оформлении.
  - У позиции заказа (OrderItem) появляется снимок наличия на момент заказа.
  - У пользователя — баланс (пока только отображение/заглушка пополнения).
  - У товара — массив фото (images).
  - Новая таблица favorites (избранное).
*/

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('new', 'confirmed', 'assembled', 'shipped', 'delivered', 'cancelled');

-- нормализуем существующие данные под новый набор значений перед сменой типа столбца
UPDATE "orders" SET "status" = 'delivered' WHERE "status" = 'done';

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus" USING ("status"::"OrderStatus");
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'new';
ALTER TABLE "orders" ADD COLUMN "number" SERIAL;
ALTER TABLE "orders" ADD COLUMN "cancellationRequested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "groupId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "orders_number_key" ON "orders"("number");
CREATE INDEX "orders_groupId_idx" ON "orders"("groupId");

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN "inStock" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "balance" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "products" ADD COLUMN "images" TEXT[] NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_productSlug_key" ON "favorites"("userId", "productSlug");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_productSlug_fkey" FOREIGN KEY ("productSlug") REFERENCES "products"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
