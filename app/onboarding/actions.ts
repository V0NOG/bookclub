"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

type OnboardingPayload = {
  favoriteGenres: string[];
  favoriteAuthors: string[];
  preferredMoods: string[];
  preferredThemes: string[];
  readingGoalBooksPerYear: number;
  clubPreference: string;
  interestedInClubs: boolean;
  interestedInChallenges: boolean;
  userType: "READER" | "ORGANISER" | "MEMBER" | "INFLUENCER";
};

export async function saveOnboardingAction(payload: OnboardingPayload) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const userId = session.user.id;
  const year = new Date().getFullYear();

  const tasteFields = {
    topGenres: payload.favoriteGenres,
    topAuthors: payload.favoriteAuthors,
    topThemes: payload.preferredThemes,
    topMoods: payload.preferredMoods,
    dislikedGenres: [] as string[],
    dislikedThemes: [] as string[],
    dislikedAuthors: [] as string[],
    confidence: "LOW" as const,
    lastCalculated: new Date(),
  };

  await db.$transaction(async (tx) => {
    await tx.onboardingData.upsert({
      where: { userId },
      update: { ...payload, completedAt: new Date() },
      create: { userId, ...payload, completedAt: new Date() },
    });

    await tx.tasteProfile.upsert({
      where: { userId },
      update: tasteFields,
      create: { userId, ...tasteFields },
    });

    await tx.readingGoal.upsert({
      where: { userId_type_year: { userId, type: "BOOKS_PER_YEAR", year } },
      update: { target: payload.readingGoalBooksPerYear },
      create: { userId, type: "BOOKS_PER_YEAR", target: payload.readingGoalBooksPerYear, year },
    });

    await tx.userScore.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    await tx.user.update({ where: { id: userId }, data: { onboarded: true, userType: payload.userType } });
  });

  redirect("/home");
}
