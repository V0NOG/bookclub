"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";

type Result = { success: true; joined: boolean } | { success: false; error: string };

export async function toggleChallengeParticipation(challengeId: string): Promise<Result> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Unauthenticated" };
  const userId = session.user.id;

  try {
    const existing = await db.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });

    if (existing) {
      await db.challengeParticipant.delete({ where: { challengeId_userId: { challengeId, userId } } });
      revalidatePath("/challenges");
      revalidatePath("/home");
      return { success: true, joined: false };
    }

    const challenge = await db.readingChallenge.findUnique({
      where: { id: challengeId },
      select: { isPublic: true },
    });
    if (!challenge) return { success: false, error: "Challenge not found" };
    if (!challenge.isPublic) return { success: false, error: "This challenge is private" };

    await db.challengeParticipant.create({ data: { challengeId, userId } });
    revalidatePath("/challenges");
    revalidatePath("/home");
    return { success: true, joined: true };
  } catch {
    return { success: false, error: "Failed to update challenge" };
  }
}
