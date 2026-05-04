"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { invalidateUserMatchCache } from "@/lib/matching/cache";
import { FeedbackTargetType, FeedbackAction } from "@/lib/generated/prisma/client";

export async function upsertFeedback(params: {
  targetType: FeedbackTargetType;
  targetId: string;
  action: FeedbackAction;
}): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthenticated" };
  }
  const userId = session.user.id;

  try {
    await db.recommendationFeedback.upsert({
      where: { userId_targetType_targetId: { userId, targetType: params.targetType, targetId: params.targetId } },
      update: { action: params.action },
      create: { userId, targetType: params.targetType, targetId: params.targetId, action: params.action },
    });
    invalidateUserMatchCache(userId);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to save feedback" };
  }
}
