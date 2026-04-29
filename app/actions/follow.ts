"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";

export async function toggleFollow(
  targetUserId: string
): Promise<{ success: true; following: boolean } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Unauthenticated" };
  const userId = session.user.id;

  if (userId === targetUserId) return { success: false, error: "Cannot follow yourself" };

  try {
    const existing = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
    });

    if (existing) {
      await db.follow.delete({
        where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
      });
      return { success: true, following: false };
    } else {
      await db.follow.create({ data: { followerId: userId, followingId: targetUserId } });
      return { success: true, following: true };
    }
  } catch {
    return { success: false, error: "Failed to update follow" };
  }
}
