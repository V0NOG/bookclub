-- CreateEnum
CREATE TYPE "FeedbackTargetType" AS ENUM ('USER', 'BOOK', 'CLUB');

-- CreateEnum
CREATE TYPE "FeedbackAction" AS ENUM ('LIKE', 'DISLIKE');

-- CreateTable
CREATE TABLE "RecommendationFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" "FeedbackTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" "FeedbackAction" NOT NULL,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecommendationFeedback_userId_targetType_idx" ON "RecommendationFeedback"("userId", "targetType");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationFeedback_userId_targetId_key" ON "RecommendationFeedback"("userId", "targetId");

-- AddForeignKey
ALTER TABLE "RecommendationFeedback" ADD CONSTRAINT "RecommendationFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
