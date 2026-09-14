-- CreateTable
CREATE TABLE "compatibility_models" (
    "slug" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "series" TEXT,
    "model" TEXT NOT NULL,

    CONSTRAINT "compatibility_models_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "product_compatibility" (
    "productSlug" TEXT NOT NULL,
    "compatibilityModelSlug" TEXT NOT NULL,

    CONSTRAINT "product_compatibility_pkey" PRIMARY KEY ("productSlug","compatibilityModelSlug")
);

-- CreateIndex
CREATE INDEX "compatibility_models_brand_idx" ON "compatibility_models"("brand");

-- CreateIndex
CREATE INDEX "product_compatibility_compatibilityModelSlug_idx" ON "product_compatibility"("compatibilityModelSlug");

-- AddForeignKey
ALTER TABLE "product_compatibility" ADD CONSTRAINT "product_compatibility_productSlug_fkey" FOREIGN KEY ("productSlug") REFERENCES "products"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_compatibility" ADD CONSTRAINT "product_compatibility_compatibilityModelSlug_fkey" FOREIGN KEY ("compatibilityModelSlug") REFERENCES "compatibility_models"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
