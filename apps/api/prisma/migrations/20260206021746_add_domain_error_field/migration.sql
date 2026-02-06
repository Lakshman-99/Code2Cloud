-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "error" TEXT;

-- CreateIndex
CREATE INDEX "Domain_status_idx" ON "Domain"("status");
