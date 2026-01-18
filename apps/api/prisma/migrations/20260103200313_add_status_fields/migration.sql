-- AlterEnum
ALTER TYPE "DomainDnsStatus" ADD VALUE 'INACTIVE';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "configChanged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onlineStatus" "DomainDnsStatus" NOT NULL DEFAULT 'PENDING';
