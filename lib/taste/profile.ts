import { db } from "@/lib/db";
import { UserTasteSnapshot, TasteDimensions } from "@/lib/matching/types";
import { computeFeedbackAdjustments, blendDimensions, applyGenreAdjustments } from "@/lib/taste/feedback-adjustments";

export async function buildUserTasteSnapshot(userId: string): Promise<UserTasteSnapshot> {
  const [userBooks, tasteProfile, onboardingData] = await Promise.all([
    db.userBook.findMany({
      where: { userId, NOT: { rating: null } },
      include: { book: { include: { tasteDimensions: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.tasteProfile.findUnique({ where: { userId } }),
    db.onboardingData.findUnique({ where: { userId } }),
  ]);

  const ratedBooks = userBooks
    .filter((ub) => ub.rating !== null)
    .map((ub) => ({
      bookId: ub.bookId,
      title: ub.book.title,
      rating: ub.rating!,
      genres: ub.book.genres,
      authors: ub.book.authors,
    }));

  const genreWeights = new Map<string, number>();
  const authorWeights = new Map<string, number>();

  for (const ub of userBooks) {
    if (!ub.rating) continue;
    const weight = ub.rating >= 4 ? ub.rating : ub.rating <= 2 ? -1 : 0;

    for (const genre of ub.book.genres) {
      genreWeights.set(genre, (genreWeights.get(genre) ?? 0) + weight);
    }
    for (const author of ub.book.authors) {
      authorWeights.set(author, (authorWeights.get(author) ?? 0) + weight);
    }
  }

  const topGenres = Array.from(genreWeights.entries())
    .filter(([, w]) => w > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([g]) => g);

  const dislikedGenres = Array.from(genreWeights.entries())
    .filter(([, w]) => w < 0)
    .map(([g]) => g);

  const topAuthors = Array.from(authorWeights.entries())
    .filter(([, w]) => w > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([a]) => a);

  const dimSums: Record<keyof TasteDimensions, number> = {
    pace: 0, tone: 0, focus: 0, emotionalIntensity: 0,
    romanceLevel: 0, complexity: 0, worldbuildingDepth: 0, discussionPotential: 0,
  };
  const dimCounts: Record<keyof TasteDimensions, number> = { ...dimSums };

  for (const ub of userBooks) {
    if (!ub.rating || !ub.book.tasteDimensions) continue;
    if (ub.rating < 3) continue;
    const dims = ub.book.tasteDimensions;
    const weight = ub.rating >= 4 ? 2 : 1;

    for (const key of Object.keys(dimSums) as Array<keyof TasteDimensions>) {
      const val = dims[key as keyof typeof dims];
      if (val !== null && val !== undefined) {
        dimSums[key] += (val as number) * weight;
        dimCounts[key] += weight;
      }
    }
  }

  const computedDimensions: Partial<TasteDimensions> = {};
  for (const key of Object.keys(dimSums) as Array<keyof TasteDimensions>) {
    if (dimCounts[key] > 0) {
      computedDimensions[key] = dimSums[key] / dimCounts[key];
    }
  }

  const mergedDimensions: Partial<TasteDimensions> = {
    ...computedDimensions,
    ...(tasteProfile
      ? {
          pace: tasteProfile.pace ?? computedDimensions.pace,
          tone: tasteProfile.tone ?? computedDimensions.tone,
          focus: tasteProfile.focus ?? computedDimensions.focus,
          emotionalIntensity: tasteProfile.emotionalIntensity ?? computedDimensions.emotionalIntensity,
          romanceLevel: tasteProfile.romanceLevel ?? computedDimensions.romanceLevel,
          complexity: tasteProfile.complexity ?? computedDimensions.complexity,
          worldbuildingDepth: tasteProfile.worldbuildingDepth ?? computedDimensions.worldbuildingDepth,
          discussionPotential: tasteProfile.discussionPotential ?? computedDimensions.discussionPotential,
        }
      : {}),
  };

  // Remove undefined values from mergedDimensions
  for (const key of Object.keys(mergedDimensions) as Array<keyof TasteDimensions>) {
    if (mergedDimensions[key] === undefined || mergedDimensions[key] === null) {
      delete mergedDimensions[key];
    }
  }

  const finalGenres =
    topGenres.length > 0
      ? topGenres
      : (onboardingData?.favoriteGenres ?? tasteProfile?.topGenres ?? []);

  const finalAuthors =
    topAuthors.length > 0
      ? topAuthors
      : (onboardingData?.favoriteAuthors ?? tasteProfile?.topAuthors ?? []);

  const finalDisliked =
    dislikedGenres.length > 0 ? dislikedGenres : (tasteProfile?.dislikedGenres ?? []);

  const confidence: "low" | "medium" | "high" =
    ratedBooks.length >= 5 ? "high" : ratedBooks.length >= 2 ? "medium" : "low";

  // Blend feedback adjustments at 15% weight — base TasteProfile is not mutated.
  const feedbackAdj = await computeFeedbackAdjustments(userId);
  const blendedDimensions = blendDimensions(mergedDimensions, feedbackAdj.dimensionNudge);
  const { topGenres: blendedGenres, dislikedGenres: blendedDisliked } = applyGenreAdjustments(
    finalGenres,
    finalDisliked,
    feedbackAdj.genreWeights
  );

  return {
    userId,
    topGenres: blendedGenres,
    topAuthors: finalAuthors,
    topThemes: tasteProfile?.topThemes ?? onboardingData?.preferredThemes ?? [],
    dimensions: blendedDimensions,
    dislikedGenres: blendedDisliked,
    dislikedAuthors: tasteProfile?.dislikedAuthors ?? [],
    ratedBooks,
    confidence,
  };
}

export async function saveTasteProfile(snapshot: UserTasteSnapshot): Promise<void> {
  const confidenceEnum =
    snapshot.confidence === "high" ? "HIGH" : snapshot.confidence === "medium" ? "MEDIUM" : "LOW";

  await db.tasteProfile.upsert({
    where: { userId: snapshot.userId },
    update: {
      topGenres: snapshot.topGenres,
      topAuthors: snapshot.topAuthors,
      dislikedGenres: snapshot.dislikedGenres,
      dislikedAuthors: snapshot.dislikedAuthors,
      pace: snapshot.dimensions.pace,
      tone: snapshot.dimensions.tone,
      focus: snapshot.dimensions.focus,
      emotionalIntensity: snapshot.dimensions.emotionalIntensity,
      romanceLevel: snapshot.dimensions.romanceLevel,
      complexity: snapshot.dimensions.complexity,
      worldbuildingDepth: snapshot.dimensions.worldbuildingDepth,
      discussionPotential: snapshot.dimensions.discussionPotential,
      confidence: confidenceEnum,
      lastCalculated: new Date(),
    },
    create: {
      userId: snapshot.userId,
      topGenres: snapshot.topGenres,
      topAuthors: snapshot.topAuthors,
      topThemes: snapshot.topThemes,
      topMoods: [],
      dislikedGenres: snapshot.dislikedGenres,
      dislikedThemes: [],
      dislikedAuthors: snapshot.dislikedAuthors,
      pace: snapshot.dimensions.pace,
      tone: snapshot.dimensions.tone,
      focus: snapshot.dimensions.focus,
      emotionalIntensity: snapshot.dimensions.emotionalIntensity,
      romanceLevel: snapshot.dimensions.romanceLevel,
      complexity: snapshot.dimensions.complexity,
      worldbuildingDepth: snapshot.dimensions.worldbuildingDepth,
      discussionPotential: snapshot.dimensions.discussionPotential,
      confidence: confidenceEnum,
      lastCalculated: new Date(),
    },
  });
}
