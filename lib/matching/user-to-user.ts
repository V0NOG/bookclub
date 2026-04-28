import { MatchOutput, UserTasteSnapshot, EMPTY_MATCH } from "./types";
import { overallDimensionSimilarity, sharedDimensions, toScore } from "./dimensions";
import { generateUserMatchReasons } from "./reasons";

export function calculateUserToUserMatch(
  userA: UserTasteSnapshot,
  userB: UserTasteSnapshot
): MatchOutput {
  if (userA.userId === userB.userId) return EMPTY_MATCH;

  // ── Book overlap ──────────────────────────────────────────────────────────
  const aHighRated = new Map(userA.ratedBooks.filter((b) => b.rating >= 4).map((b) => [b.bookId, b]));
  const bHighRated = new Map(userB.ratedBooks.filter((b) => b.rating >= 4).map((b) => [b.bookId, b]));

  const sharedBookIds = Array.from(aHighRated.keys()).filter((id) => bHighRated.has(id));
  const sharedBookTitles = sharedBookIds.map((id) => aHighRated.get(id)!.title);

  const aDislikedSet = new Set(userA.ratedBooks.filter((b) => b.rating <= 2).map((b) => b.bookId));
  const bDislikedSet = new Set(userB.ratedBooks.filter((b) => b.rating <= 2).map((b) => b.bookId));
  const sharedDislikes = Array.from(aDislikedSet).filter((id) => bDislikedSet.has(id));

  // ── Genre overlap ─────────────────────────────────────────────────────────
  const aGenresSet = new Set(userA.topGenres);
  const bGenresSet = new Set(userB.topGenres);
  const sharedGenres = Array.from(aGenresSet).filter((g) => bGenresSet.has(g));

  const aLikesWhatBDislikes = userA.topGenres.filter((g) => userB.dislikedGenres.includes(g)).length;
  const bLikesWhatADislikes = userB.topGenres.filter((g) => userA.dislikedGenres.includes(g)).length;
  const negativePenalty = (aLikesWhatBDislikes + bLikesWhatADislikes) * 0.05;

  const sharedDislikedGenres = userA.dislikedGenres.filter((g) => userB.dislikedGenres.includes(g));

  // ── Author overlap ────────────────────────────────────────────────────────
  const aAuthorsSet = new Set(userA.topAuthors);
  const bAuthorsSet = new Set(userB.topAuthors);
  const sharedAuthors = Array.from(aAuthorsSet).filter((a) => bAuthorsSet.has(a));

  // ── Dimension similarity ──────────────────────────────────────────────────
  const dimSimilarity = overallDimensionSimilarity(userA.dimensions, userB.dimensions);
  const alignedDimensions = sharedDimensions(userA.dimensions, userB.dimensions, 0.2);

  // ── Score calculation ─────────────────────────────────────────────────────
  // Book score: ratio-based with count discount to prevent small libraries inflating scores.
  // 1 shared book = 50% of ratio value; 2 = 80%; 3+ = full.
  const rawBookRatio = sharedBookIds.length / Math.max(1, Math.min(aHighRated.size, bHighRated.size));
  const bookCountFactor = sharedBookIds.length >= 3 ? 1.0 : sharedBookIds.length === 2 ? 0.8 : sharedBookIds.length === 1 ? 0.5 : 0;
  const bookScore = rawBookRatio * bookCountFactor;

  const genreScore = sharedGenres.length / Math.max(1, Math.min(aGenresSet.size, bGenresSet.size));
  const authorScore = sharedAuthors.length / Math.max(1, Math.min(aAuthorsSet.size, bAuthorsSet.size));

  // Weights: books 35%, genres 30%, authors 10%, dimensions 25%.
  // Dimensions supplement explicit signals — they don't dominate.
  const contentOverlap = bookScore + genreScore;

  // Penalise false positives: high dimension similarity with no shared explicit content
  // signals coincidental style overlap, not genuine taste compatibility.
  const falsePositivePenalty = dimSimilarity > 0.75 && contentOverlap < 0.25 ? 0.15 : 0;

  const rawScore =
    bookScore * 0.35 +
    genreScore * 0.30 +
    authorScore * 0.10 +
    dimSimilarity * 0.25 -
    negativePenalty -
    falsePositivePenalty +
    sharedDislikedGenres.length * 0.02 +
    sharedDislikes.length * 0.01;

  const score = toScore(rawScore);

  // ── Confidence ────────────────────────────────────────────────────────────
  // Requires: rich data (both rated 5+ books), diverse signals, and cross-signal
  // agreement (books AND genres overlap, not just one axis). Medium when reasonable
  // data exists with at least one explicit signal.
  const minRatedBooks = Math.min(userA.ratedBooks.length, userB.ratedBooks.length);
  const signalDiversity =
    (sharedBookIds.length > 0 ? 1 : 0) +
    (sharedGenres.length > 0 ? 1 : 0) +
    (sharedAuthors.length > 0 ? 1 : 0);
  const crossSignalAgreement = sharedBookIds.length > 0 && sharedGenres.length > 0;

  const confidence: "low" | "medium" | "high" =
    minRatedBooks >= 5 && signalDiversity >= 2 && crossSignalAgreement
      ? "high"
      : minRatedBooks >= 2 && signalDiversity >= 1 && (sharedBookIds.length > 0 || sharedGenres.length > 0)
        ? "medium"
        : "low";

  // ── Reasons ───────────────────────────────────────────────────────────────
  const { reasons, positiveSignals, negativeSignals } = generateUserMatchReasons({
    sharedBooks: sharedBookTitles,
    sharedGenres,
    sharedAuthors,
    sharedDimensions: alignedDimensions,
    negativeGenreOverlap: sharedDislikedGenres,
    dimensionsA: userA.dimensions,
    dimensionsB: userB.dimensions,
    score,
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
