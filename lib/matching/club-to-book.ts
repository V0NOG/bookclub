import { MatchOutput, TasteDimensions, UserTasteSnapshot } from "./types";
import { overallDimensionSimilarity, sharedDimensions, toScore, computeConfidence } from "./dimensions";
import { calculateUserToBookMatch, BookSnapshot } from "./user-to-book";

type ClubSnapshot = {
  clubId: string;
  genres: string[];
  themes: string[];
  dimensions: Partial<TasteDimensions>;
  memberSnapshots: UserTasteSnapshot[];
};

export function calculateClubToBookMatch(
  club: ClubSnapshot,
  book: BookSnapshot
): MatchOutput & { memberLikelyToEnjoyPercent: number } {
  const memberCount = club.memberSnapshots.length;

  const memberBookMatches = club.memberSnapshots.map((m) => calculateUserToBookMatch(m, book));
  const avgMemberBookScore =
    memberCount > 0
      ? memberBookMatches.reduce((s, m) => s + m.score, 0) / memberCount
      : 50;
  const likelyToEnjoyCount = memberBookMatches.filter((m) => m.score >= 65).length;
  const likelyToEnjoyPercent =
    memberCount > 0 ? Math.round((likelyToEnjoyCount / memberCount) * 100) : 0;

  const sharedGenres = book.genres.filter((g) => club.genres.includes(g));
  const genreScore = sharedGenres.length / Math.max(1, club.genres.length);

  const dimSimilarity = overallDimensionSimilarity(club.dimensions, book.dimensions);
  const alignedDims = sharedDimensions(club.dimensions, book.dimensions, 0.2);

  // 50% member avg, 30% genre, 20% dimensions
  const rawScore =
    (avgMemberBookScore / 100) * 0.50 +
    genreScore * 0.30 +
    dimSimilarity * 0.20;

  const score = toScore(rawScore);
  const confidence = computeConfidence(memberCount, sharedGenres.length + alignedDims.length);

  const reasons: string[] = [];
  if (likelyToEnjoyPercent >= 70)
    reasons.push(`${likelyToEnjoyPercent}% of members would enjoy this book.`);
  if (sharedGenres.length > 0)
    reasons.push(`Matches club's ${sharedGenres.join(" and ")} taste.`);
  if (alignedDims.length > 0)
    reasons.push(`Fits the club's preferred reading style.`);

  return {
    score,
    confidence,
    matchReasons: reasons.slice(0, 3),
    positiveSignals: [
      `${likelyToEnjoyCount} / ${memberCount} members likely to enjoy`,
      ...sharedGenres.map((g) => `Club reads ${g}`),
    ],
    negativeSignals: [],
    sharedBooks: [],
    sharedGenres,
    sharedAuthors: [],
    sharedThemes: book.tags.filter((t) => club.themes.includes(t)),
    sharedTasteDimensions: alignedDims,
    memberLikelyToEnjoyPercent: likelyToEnjoyPercent,
  };
}
