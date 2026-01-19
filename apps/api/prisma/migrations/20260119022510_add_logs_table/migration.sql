/*
  Warnings:

  - You are about to drop the column `buildLogs` on the `Deployment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "LogSource" AS ENUM ('BUILD', 'RUNTIME', 'SYSTEM');

-- AlterTable
ALTER TABLE "Deployment" DROP COLUMN "buildLogs";

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "source" "LogSource" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,

    CONSTRAINT "LogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LogEntry_deploymentId_source_timestamp_idx" ON "LogEntry"("deploymentId", "source", "timestamp");

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "Deployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
