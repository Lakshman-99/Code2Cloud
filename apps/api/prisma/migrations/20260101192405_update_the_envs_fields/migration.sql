-- CreateEnum
CREATE TYPE "DomainDnsStatus" AS ENUM ('ACTIVE', 'PENDING', 'VERIFYING', 'ERROR');

-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "status" "DomainDnsStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "type" "EnvironmentType" NOT NULL DEFAULT 'PRODUCTION';
