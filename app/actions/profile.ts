"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { invalidateUserMatchCache } from "@/lib/matching/cache";
import { UserType } from "@/lib/generated/prisma/client";

type Result = { success: true } | { success: false; error: string };

function cleanText(value: unknown, max: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, max) : null;
}

export async function updateProfileAction(formData: FormData): Promise<Result> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Unauthenticated" };
  const userId = session.user.id;
  const username = cleanText(formData.get("username"), 32)?.replace(/^@/, "") ?? null;

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        name: cleanText(formData.get("name"), 80),
        username,
        bio: cleanText(formData.get("bio"), 280),
        location: cleanText(formData.get("location"), 80),
        avatar: cleanText(formData.get("avatar"), 500),
      },
    });
    revalidatePath("/profile");
    revalidatePath("/settings");
    revalidatePath("/feed");
    return { success: true };
  } catch {
    return { success: false, error: "Profile update failed. Username may already be taken." };
  }
}

export async function updatePreferencesAction(formData: FormData): Promise<Result> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Unauthenticated" };
  const userId = session.user.id;
  const rawType = formData.get("userType");
  const userType = Object.values(UserType).includes(rawType as UserType) ? rawType as UserType : UserType.READER;
  const goal = Number(formData.get("readingGoalBooksPerYear"));
  const clubPreference = cleanText(formData.get("clubPreference"), 20) ?? "online";

  try {
    await db.user.update({ where: { id: userId }, data: { userType } });
    await db.onboardingData.upsert({
      where: { userId },
      update: {
        userType,
        readingGoalBooksPerYear: Number.isFinite(goal) && goal > 0 ? Math.round(goal) : null,
        clubPreference,
        interestedInClubs: formData.get("interestedInClubs") === "on",
        interestedInChallenges: formData.get("interestedInChallenges") === "on",
      },
      create: {
        userId,
        userType,
        favoriteGenres: [],
        favoriteBookIds: [],
        dislikedBookIds: [],
        favoriteAuthors: [],
        preferredMoods: [],
        preferredThemes: [],
        readingGoalBooksPerYear: Number.isFinite(goal) && goal > 0 ? Math.round(goal) : null,
        clubPreference,
        interestedInClubs: formData.get("interestedInClubs") === "on",
        interestedInChallenges: formData.get("interestedInChallenges") === "on",
      },
    });
    if (Number.isFinite(goal) && goal > 0) {
      await db.readingGoal.upsert({
        where: { userId_type_year: { userId, type: "BOOKS_PER_YEAR", year: new Date().getFullYear() } },
        update: { target: Math.round(goal) },
        create: {
          userId,
          type: "BOOKS_PER_YEAR",
          year: new Date().getFullYear(),
          target: Math.round(goal),
        },
      });
    }
    invalidateUserMatchCache(userId);
    revalidatePath("/settings");
    revalidatePath("/profile");
    revalidatePath("/library");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update preferences" };
  }
}
