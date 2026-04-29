"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";

export async function toggleActivityLike(
  activityId: string
): Promise<{ success: true; liked: boolean; count: number } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Unauthenticated" };
  const userId = session.user.id;

  try {
    const existing = await db.activityLike.findUnique({
      where: { userId_activityId: { userId, activityId } },
    });

    if (existing) {
      await db.activityLike.delete({
        where: { userId_activityId: { userId, activityId } },
      });
    } else {
      await db.activityLike.create({ data: { userId, activityId } });
    }

    const count = await db.activityLike.count({ where: { activityId } });
    return { success: true, liked: !existing, count };
  } catch {
    return { success: false, error: "Failed to update like" };
  }
}
