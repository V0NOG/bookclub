import { db } from "@/lib/db";

export type ActivityType = "finished" | "started" | "rated" | "followed" | "joined_club";

export async function logActivity(params: {
  userId: string;
  type: ActivityType;
  bookId?: string;
  targetUserId?: string;
  clubId?: string;
}): Promise<void> {
  try {
    await db.activityEvent.create({ data: params });
  } catch {
    // Activity logging is non-critical — never surface to the user
  }
}
