-- CreateEnum
CREATE TYPE "DeploymentTrigger" AS ENUM ('MANUAL', 'WEBHOOK', 'ROLLBACK');

-- AlterEnum
ALTER TYPE "DeploymentStatus" ADD VALUE 'SUPERSEDED';

-- AlterTable
ALTER TABLE "Deployment" ADD COLUMN     "trigger" "DeploymentTrigger" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "gitRepoFullName" TEXT;
