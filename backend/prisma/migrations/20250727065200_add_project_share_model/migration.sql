-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "SystemSetting" ALTER COLUMN "value" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "department" TEXT,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "ProjectShare" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sharedById" TEXT NOT NULL,
    "sharedWith" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectShare_projectId_idx" ON "ProjectShare"("projectId");

-- CreateIndex
CREATE INDEX "ProjectShare_sharedById_idx" ON "ProjectShare"("sharedById");

-- CreateIndex
CREATE INDEX "ProjectShare_sharedWith_idx" ON "ProjectShare"("sharedWith");

-- CreateIndex
CREATE INDEX "ProjectShare_status_idx" ON "ProjectShare"("status");

-- CreateIndex
CREATE INDEX "ProjectShare_createdAt_idx" ON "ProjectShare"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_projectId_idx" ON "Comment"("projectId");

-- CreateIndex
CREATE INDEX "Comment_projectId_createdAt_idx" ON "Comment"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectShare" ADD CONSTRAINT "ProjectShare_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectShare" ADD CONSTRAINT "ProjectShare_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
