-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultRegion" TEXT NOT NULL DEFAULT 'us-east-1',
    "maxConcurrentBuilds" INTEGER NOT NULL DEFAULT 1,
    "logRetentionDays" INTEGER NOT NULL DEFAULT 1,
    "turboMode" BOOLEAN NOT NULL DEFAULT false,
    "globalTTLMinutes" INTEGER NOT NULL DEFAULT 5,
    "autoDeploy" BOOLEAN NOT NULL DEFAULT true,
    "slackWebhook" TEXT,
    "emailDeployFailed" BOOLEAN NOT NULL DEFAULT true,
    "emailDeploySuccess" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_userId_key" ON "SystemConfig"("userId");

-- AddForeignKey
ALTER TABLE "SystemConfig" ADD CONSTRAINT "SystemConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
