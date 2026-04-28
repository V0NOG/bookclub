import { db } from "@/lib/db";
import { TasteDimensions } from "@/lib/matching/types";

export type TargetSignals = {
  genres: string[];
  dimensions: Partial<TasteDimensions>;
};

export type FeedbackAdjustments = {
  genreWeights: Map<string, number>;
  dimensionNudge: Partial<TasteDimensions>;
};

export const EMPTY_FEEDBACK_ADJUSTMENTS: FeedbackAdjustments = {
  genreWeights: new Map(),
  dimensionNudge: {},
};

function toDimensions(src: {
  pace: number | null;
  tone: number | null;
  focus: number | null;
  emotionalIntensity: number | null;
  romanceLevel: number | null;
  complexity: number | null;
  worldbuildingDepth: number | null;
  discussionPotential: number | null;
} | null | undefined): Partial<TasteDimensions> {
  if (!src) return {};
  const d: Partial<TasteDimensions> = {};
  if (src.pace !== null) d.pace = src.pace!;
  if (src.tone !== null) d.tone = src.tone!;
  if (src.focus !== null) d.focus = src.focus!;
  if (src.emotionalIntensity !== null) d.emotionalIntensity = src.emotionalIntensity!;
  if (src.romanceLevel !== null) d.romanceLevel = src.romanceLevel!;
  if (src.complexity !== null) d.complexity = src.complexity!;
  if (src.worldbuildingDepth !== null) d.worldbuildingDepth = src.worldbuildingDepth!;
  if (src.discussionPotential !== null) d.discussionPotential = src.discussionPotential!;
  return d;
}

/**
 * Aggregates feedback+signal pairs into genre weights and a dimension nudge.
 *
 * Genre weights: LIKE=+0.08, DISLIKE=-0.15 per signal; clamped to [-1, +1].
 *
 * Dimension nudge: weighted average of "suggested" dimension values.
 *   LIKE on dim=v  → suggests preference of v    (weight 0.08)
 *   DISLIKE on dim=v → suggests preference of (1-v) (weight 0.15)
 */
export function aggregateFeedbackSignals(
  entries: Array<{ action: "LIKE" | "DISLIKE"; signals: TargetSignals }>
): FeedbackAdjustments {
  const genreWeights = new Map<string, number>();
  const dimNumerator: Partial<Record<keyof TasteDimensions, number>> = {};
  const dimDenominator: Partial<Record<keyof TasteDimensions, number>> = {};

  for (const { action, signals } of entries) {
    const genreDelta = action === "LIKE" ? 0.08 : -0.15;
    for (const genre of signals.genres) {
      const current = genreWeights.get(genre) ?? 0;
      genreWeights.set(genre, Math.max(-1, Math.min(1, current + genreDelta)));
    }

    const dimWeight = action === "LIKE" ? 0.08 : 0.15;
    for (const key of Object.keys(signals.dimensions) as Array<keyof TasteDimensions>) {
      const val = signals.dimensions[key];
      if (val === undefined || val === null) continue;
      const target = action === "LIKE" ? val : 1 - val;
      dimNumerator[key] = (dimNumerator[key] ?? 0) + target * dimWeight;
      dimDenominator[key] = (dimDenominator[key] ?? 0) + dimWeight;
    }
  }

  const dimensionNudge: Partial<TasteDimensions> = {};
  for (const key of Object.keys(dimNumerator) as Array<keyof TasteDimensions>) {
    const num = dimNumerator[key] ?? 0;
    const den = dimDenominator[key] ?? 0;
    if (den > 0) dimensionNudge[key] = num / den;
  }

  return { genreWeights, dimensionNudge };
}

/**
 * Blends base dimensions with a feedback nudge at 85/15.
 * Only dimensions present in both base and nudge are blended.
 * Clamped to [0.05, 0.95].
 */
export function blendDimensions(
  base: Partial<TasteDimensions>,
  nudge: Partial<TasteDimensions>
): Partial<TasteDimensions> {
  const result: Partial<TasteDimensions> = { ...base };
  for (const key of Object.keys(nudge) as Array<keyof TasteDimensions>) {
    const baseVal = base[key];
    const nudgeVal = nudge[key];
    if (baseVal === undefined || nudgeVal === undefined) continue;
    result[key] = Math.max(0.05, Math.min(0.95, 0.85 * baseVal + 0.15 * nudgeVal));
  }
  return result;
}

/**
 * Applies genre weights to topGenres and dislikedGenres lists.
 *
 * LIKE threshold (>=0.16 = 2+ likes):   append to topGenres tail (max 2 additions)
 * DISLIKE threshold (<=-0.20 = 2+ dislikes): append to dislikedGenres
 *
 * Base topGenres ordering is never changed.
 */
export function applyGenreAdjustments(
  topGenres: string[],
  dislikedGenres: string[],
  genreWeights: Map<string, number>
): { topGenres: string[]; dislikedGenres: string[] } {
  const newTop = [...topGenres];
  const newDisliked = [...dislikedGenres];
  let additions = 0;

  for (const [genre, weight] of Array.from(genreWeights.entries())) {
    if (weight >= 0.16 && !newTop.includes(genre) && !newDisliked.includes(genre) && additions < 2) {
      newTop.push(genre);
      additions++;
    }
    if (weight <= -0.20 && !newDisliked.includes(genre)) {
      newDisliked.push(genre);
    }
  }

  return { topGenres: newTop, dislikedGenres: newDisliked };
}

/**
 * Fetches all stored feedback for a user, resolves target signals in 3 batched
 * queries (one per targetType), and returns aggregated adjustments.
 */
export async function computeFeedbackAdjustments(userId: string): Promise<FeedbackAdjustments> {
  const feedbackRecords = await db.recommendationFeedback.findMany({
    where: { userId },
    select: { targetType: true, targetId: true, action: true },
  });

  if (feedbackRecords.length === 0) return EMPTY_FEEDBACK_ADJUSTMENTS;

  const bookIds = feedbackRecords.filter((f) => f.targetType === "BOOK").map((f) => f.targetId);
  const userIds = feedbackRecords.filter((f) => f.targetType === "USER").map((f) => f.targetId);
  const clubIds = feedbackRecords.filter((f) => f.targetType === "CLUB").map((f) => f.targetId);

  const [books, users, clubs] = await Promise.all([
    bookIds.length > 0
      ? db.book.findMany({
          where: { id: { in: bookIds } },
          select: { id: true, genres: true, tasteDimensions: true },
        })
      : Promise.resolve([] as Array<{
          id: string;
          genres: string[];
          tasteDimensions: {
            pace: number | null; tone: number | null; focus: number | null;
            emotionalIntensity: number | null; romanceLevel: number | null;
            complexity: number | null; worldbuildingDepth: number | null;
            discussionPotential: number | null;
          } | null;
        }>),
    userIds.length > 0
      ? db.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            tasteProfile: {
              select: {
                topGenres: true,
                pace: true, tone: true, focus: true, emotionalIntensity: true,
                romanceLevel: true, complexity: true, worldbuildingDepth: true,
                discussionPotential: true,
              },
            },
          },
        })
      : Promise.resolve([] as Array<{
          id: string;
          tasteProfile: {
            topGenres: string[];
            pace: number | null; tone: number | null; focus: number | null;
            emotionalIntensity: number | null; romanceLevel: number | null;
            complexity: number | null; worldbuildingDepth: number | null;
            discussionPotential: number | null;
          } | null;
        }>),
    clubIds.length > 0
      ? db.club.findMany({
          where: { id: { in: clubIds } },
          select: { id: true, genres: true },
        })
      : Promise.resolve([] as Array<{ id: string; genres: string[] }>),
  ]);

  const bookMap = new Map(books.map((b) => [b.id, b]));
  const userMap = new Map(users.map((u) => [u.id, u]));
  const clubMap = new Map(clubs.map((c) => [c.id, c]));

  const entries: Array<{ action: "LIKE" | "DISLIKE"; signals: TargetSignals }> = [];

  for (const record of feedbackRecords) {
    const action = record.action as "LIKE" | "DISLIKE";
    let signals: TargetSignals | null = null;

    if (record.targetType === "BOOK") {
      const book = bookMap.get(record.targetId);
      if (book) signals = { genres: book.genres, dimensions: toDimensions(book.tasteDimensions) };
    } else if (record.targetType === "USER") {
      const user = userMap.get(record.targetId);
      if (user?.tasteProfile) {
        signals = { genres: user.tasteProfile.topGenres, dimensions: toDimensions(user.tasteProfile) };
      }
    } else if (record.targetType === "CLUB") {
      const club = clubMap.get(record.targetId);
      if (club) signals = { genres: club.genres, dimensions: {} };
    }

    if (signals) entries.push({ action, signals });
  }

  return aggregateFeedbackSignals(entries);
}
