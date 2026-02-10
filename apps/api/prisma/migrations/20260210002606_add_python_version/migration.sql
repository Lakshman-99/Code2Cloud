-- AlterTable
ALTER TABLE "Deployment" ALTER COLUMN "deploymentRegion" SET DEFAULT 'us-ashburn-1';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "pythonVersion" TEXT;

-- AlterTable
ALTER TABLE "SystemConfig" ALTER COLUMN "defaultRegion" SET DEFAULT 'us-ashburn-1';
