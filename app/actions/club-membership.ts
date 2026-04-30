"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { logActivity } from "@/lib/activity";

type Result = { success: true; joined: boolean } | { success: false; error: string };

export async function toggleClubMembership(clubId: string): Promise<Result> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Unauthenticated" };
  const userId = session.user.id;

  try {
    const existing = await db.clubMember.findUnique({
      where: { clubId_userId: { clubId, userId } },
      include: { club: { select: { ownerId: true } } },
    });

    if (existing) {
      if (existing.club.ownerId === userId) {
        return { success: false, error: "Owners cannot leave their own club here" };
      }
      await db.clubMember.delete({ where: { clubId_userId: { clubId, userId } } });
      revalidatePath("/clubs");
      revalidatePath(`/clubs/${clubId}`);
      revalidatePath("/discover");
      return { success: true, joined: false };
    }

    const club = await db.club.findUnique({
      where: { id: clubId },
      select: { membershipType: true, visibility: true, maxMembers: true, _count: { select: { members: true } } },
    });
    if (!club) return { success: false, error: "Club not found" };
    if (club.visibility !== "PUBLIC" || club.membershipType !== "OPEN") {
      return { success: false, error: "This club is not open to join directly" };
    }
    if (club.maxMembers && club._count.members >= club.maxMembers) {
      return { success: false, error: "This club is full" };
    }

    await db.clubMember.create({ data: { clubId, userId } });
    await logActivity({ userId, type: "joined_club", clubId });
    revalidatePath("/clubs");
    revalidatePath(`/clubs/${clubId}`);
    revalidatePath("/discover");
    revalidatePath("/feed");
    return { success: true, joined: true };
  } catch {
    return { success: false, error: "Failed to update club membership" };
  }
}
