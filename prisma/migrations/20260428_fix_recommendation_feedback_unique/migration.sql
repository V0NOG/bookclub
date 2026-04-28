-- DropIndex
DROP INDEX "RecommendationFeedback_userId_targetId_key";

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationFeedback_userId_targetType_targetId_key" ON "RecommendationFeedback"("userId", "targetType", "targetId");
