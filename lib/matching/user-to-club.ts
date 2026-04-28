import { MatchOutput, UserTasteSnapshot, TasteDimensions } from "./types";
import { overallDimensionSimilarity, sharedDimensions, toScore, computeConfidence } from "./dimensions";
import { calculateUserToUserMatch } from "./user-to-user";
import { generateClubMatchReasons } from "./reasons";

export type ClubSnapshot = {
  clubId: string;
  genres: string[];
  themes: string[];
  dimensions: Partial<TasteDimensions>;
  memberSnapshots: UserTasteSnapshot[];
};

export function calculateUserToClubMatch(
  user: UserTasteSnapshot,
  club: ClubSnapshot
): MatchOutput {
  const memberCount = club.memberSnapshots.length;
  if (memberCount === 0) {
    const sharedGenres = club.genres.filter((g) => user.topGenres.includes(g));
    const genreScore = sharedGenres.length / Math.max(1, club.genres.length);
    return {
      score: toScore(genreScore * 0.7),
      confidence: "low",
      matchReasons: sharedGenres.length > 0
        ? [`The club reads ${sharedGenres.join(", ")}, which matches your taste.`]
        : ["Limited data — explore more to see match reasons."],
      positiveSignals: [],
      negativeSignals: [],
      sharedBooks: [],
      sharedGenres,
      sharedAuthors: [],
      sharedThemes: [],
      sharedTasteDimensions: [],
    };
  }

  const memberMatches = club.memberSnapshots.map((member) =>
    calculateUserToUserMatch(user, member)
  );

  const avgMemberScore = memberMatches.reduce((s, m) => s + m.score, 0) / memberCount;
  const strongMatchCount = memberMatches.filter((m) => m.score >= 70).length;

  const sharedGenres = club.genres.filter((g) => user.topGenres.includes(g));

  const dimSimilarity = overallDimensionSimilarity(user.dimensions, club.dimensions);
  const alignedDims = sharedDimensions(user.dimensions, club.dimensions, 0.25);

  // 50% avg member match, 30% genre, 20% dimensions
  const rawScore =
    (avgMemberScore / 100) * 0.50 +
    (sharedGenres.length / Math.max(1, club.genres.length)) * 0.30 +
    dimSimilarity * 0.20;

  const score = toScore(rawScore);

  const confidence = computeConfidence(
    memberCount,
    sharedGenres.length + alignedDims.length + strongMatchCount
  );

  const reasons = generateClubMatchReasons({
    sharedGenres,
    memberCompatibilityAvg: avgMemberScore / 100,
    strongMatchCount,
    clubDimensions: club.dimensions,
    sharedDimensions: alignedDims,
    memberCount,
    score,
  });

  const allSharedBooks = Array.from(new Set(memberMatches.flatMap((m) => m.sharedBooks)));
  const allSharedAuthors = Array.from(new Set(memberMatches.flatMap((m) => m.sharedAuthors)));

  return {
    score,
    confidence,
    matchReasons: reasons,
    positiveSignals: [
      ...(strongMatchCount > 0 ? [`${strongMatchCount} strong member matches`] : []),
      ...sharedGenres.map((g) => `Club reads: ${g}`),
    ],
    negativeSignals: [],
    sharedBooks: allSharedBooks,
    sharedGenres,
    sharedAuthors: allSharedAuthors,
    sharedThemes: club.themes.filter((t) => user.topThemes.includes(t)),
    sharedTasteDimensions: alignedDims,
  };
}
