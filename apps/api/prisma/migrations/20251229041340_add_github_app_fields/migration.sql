/*
  Warnings:

  - A unique constraint covering the columns `[installationId]` on the table `GitAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "GitAccount" ADD COLUMN     "installationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GitAccount_installationId_key" ON "GitAccount"("installationId");
