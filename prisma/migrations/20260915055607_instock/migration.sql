/*
  Warnings:

  - A unique constraint covering the columns `[article]` on the table `products` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "article" TEXT,
ADD COLUMN     "inStock" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "products_article_key" ON "products"("article");
