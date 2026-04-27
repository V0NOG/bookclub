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

  await db.onboardingData.upsert({
    where: { userId },
    update: { ...payload, completedAt: new Date() },
    create: { userId, ...payload, completedAt: new Date() },
  });

  // Create initial taste profile from onboarding data
  await db.tasteProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      topGenres: payload.favoriteGenres,
      topAuthors: payload.favoriteAuthors,
      topThemes: payload.preferredThemes,
      topMoods: payload.preferredMoods,
      dislikedGenres: [],
      dislikedThemes: [],
      dislikedAuthors: [],
      confidence: "LOW",
      lastCalculated: new Date(),
    },
  });

  // Create default reading goal
  await db.readingGoal.upsert({
    where: { userId_type_year: { userId, type: "BOOKS_PER_YEAR", year: new Date().getFullYear() } },
    update: {},
    create: { userId, type: "BOOKS_PER_YEAR", target: payload.readingGoalBooksPerYear, year: new Date().getFullYear() },
  });

  // Create user score record if it doesn't exist
  await db.userScore.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  // Mark user as onboarded
  await db.user.update({ where: { id: userId }, data: { onboarded: true, userType: payload.userType } });

  redirect("/home");
}
