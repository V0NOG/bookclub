-- AlterTable
ALTER TABLE "Book" ADD COLUMN "externalSource" TEXT;
ALTER TABLE "Book" ADD COLUMN "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Book_externalSource_externalId_key" ON "Book"("externalSource", "externalId");
