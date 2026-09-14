-- CreateTable
CREATE TABLE "categories" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "items" TEXT[],

    CONSTRAINT "categories_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "products" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "compatibility" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "oldPrice" INTEGER,
    "badge" TEXT,
    "description" TEXT NOT NULL,
    "specs" JSONB NOT NULL,
    "categorySlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("slug")
);

-- CreateIndex
CREATE INDEX "products_categorySlug_idx" ON "products"("categorySlug");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categorySlug_fkey" FOREIGN KEY ("categorySlug") REFERENCES "categories"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
