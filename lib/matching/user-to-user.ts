import { MatchOutput, UserTasteSnapshot, EMPTY_MATCH } from "./types";
import { overallDimensionSimilarity, sharedDimensions, computeConfidence, toScore } from "./dimensions";
import { generateUserMatchReasons } from "./reasons";

export function calculateUserToUserMatch(
  userA: UserTasteSnapshot,
  userB: UserTasteSnapshot
): MatchOutput {
  if (userA.userId === userB.userId) return EMPTY_MATCH;

  const aHighRated = new Map(userA.ratedBooks.filter((b) => b.rating >= 4).map((b) => [b.bookId, b]));
  const bHighRated = new Map(userB.ratedBooks.filter((b) => b.rating >= 4).map((b) => [b.bookId, b]));

  const sharedBookIds = Array.from(aHighRated.keys()).filter((id) => bHighRated.has(id));
  const sharedBookTitles = sharedBookIds.map((id) => aHighRated.get(id)!.title);

  const aDislikedSet = new Set(userA.ratedBooks.filter((b) => b.rating <= 2).map((b) => b.bookId));
  const bDislikedSet = new Set(userB.ratedBooks.filter((b) => b.rating <= 2).map((b) => b.bookId));
  const sharedDislikes = Array.from(aDislikedSet).filter((id) => bDislikedSet.has(id));

  const aGenresSet = new Set(userA.topGenres);
  const bGenresSet = new Set(userB.topGenres);
  const sharedGenres = Array.from(aGenresSet).filter((g) => bGenresSet.has(g));

  const aLikesWhatBDislikes = userA.topGenres.filter((g) => userB.dislikedGenres.includes(g)).length;
  const bLikesWhatADislikes = userB.topGenres.filter((g) => userA.dislikedGenres.includes(g)).length;
  const negativePenalty = (aLikesWhatBDislikes + bLikesWhatADislikes) * 0.05;

  const sharedDislikedGenres = userA.dislikedGenres.filter((g) => userB.dislikedGenres.includes(g));

  const aAuthorsSet = new Set(userA.topAuthors);
  const bAuthorsSet = new Set(userB.topAuthors);
  const sharedAuthors = Array.from(aAuthorsSet).filter((a) => bAuthorsSet.has(a));

  const dimSimilarity = overallDimensionSimilarity(userA.dimensions, userB.dimensions);
  const alignedDimensions = sharedDimensions(userA.dimensions, userB.dimensions, 0.2);

  // Ratio-based book score handles small libraries correctly
  const bookScore = sharedBookIds.length / Math.max(1, Math.min(aHighRated.size, bHighRated.size));
  const genreScore = sharedGenres.length / Math.max(1, Math.min(aGenresSet.size, bGenresSet.size));
  const authorScore = sharedAuthors.length / Math.max(1, Math.min(aAuthorsSet.size, bAuthorsSet.size));

  // Dimensions weighted most heavily — deepest taste signal
  const rawScore =
    bookScore * 0.25 +
    genreScore * 0.20 +
    authorScore * 0.10 +
    dimSimilarity * 0.45 -
    negativePenalty +
    sharedDislikedGenres.length * 0.02;

  const score = toScore(rawScore);

  const totalBooks = (userA.ratedBooks.length + userB.ratedBooks.length) / 2;
  const totalShared = sharedBookIds.length + sharedGenres.length + sharedAuthors.length;
  // Boost to "high" when both users have trusted data and 3+ signals agree
  const confidence: "low" | "medium" | "high" =
    userA.confidence !== "low" && userB.confidence !== "low" && totalShared >= 3
      ? "high"
      : computeConfidence(totalBooks, totalShared);

  const { reasons, positiveSignals, negativeSignals } = generateUserMatchReasons({
    sharedBooks: sharedBookTitles,
    sharedGenres,
    sharedAuthors,
    sharedDimensions: alignedDimensions,
    negativeGenreOverlap: sharedDislikedGenres,
    dimensionsA: userA.dimensions,
    dimensionsB: userB.dimensions,
  });

  return {
    score,
    confidence,
    matchReasons: reasons,
    positiveSignals,
    negativeSignals,
    sharedBooks: sharedBookTitles,
    sharedGenres,
    sharedAuthors,
    sharedThemes: userA.topThemes.filter((t) => userB.topThemes.includes(t)),
    sharedTasteDimensions: alignedDimensions,
  };
}
