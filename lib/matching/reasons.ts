import { DIMENSION_LABELS, TasteDimensions } from "./types";

export function generateUserMatchReasons(params: {
  sharedBooks: string[];
  sharedGenres: string[];
  sharedAuthors: string[];
  sharedDimensions: Array<keyof TasteDimensions>;
  negativeGenreOverlap: string[];
  dimensionsA: Partial<TasteDimensions>;
  dimensionsB: Partial<TasteDimensions>;
}): { reasons: string[]; positiveSignals: string[]; negativeSignals: string[] } {
  const reasons: string[] = [];
  const positiveSignals: string[] = [];
  const negativeSignals: string[] = [];

  if (params.sharedBooks.length >= 2) {
    reasons.push(`You both rated ${params.sharedBooks.slice(0, 2).join(" and ")} highly.`);
    positiveSignals.push(...params.sharedBooks.slice(0, 3).map((b) => `Both loved: ${b}`));
  } else if (params.sharedBooks.length === 1) {
    reasons.push(`You both rated ${params.sharedBooks[0]} highly.`);
    positiveSignals.push(`Both loved: ${params.sharedBooks[0]}`);
  }

  if (params.sharedGenres.length >= 2) {
    reasons.push(`You both enjoy ${params.sharedGenres.slice(0, 2).join(" and ")}.`);
    positiveSignals.push(...params.sharedGenres.map((g) => `Shared genre: ${g}`));
  } else if (params.sharedGenres.length === 1) {
    reasons.push(`You share a love of ${params.sharedGenres[0]}.`);
  }

  if (params.sharedAuthors.length >= 2) {
    reasons.push(`You both love ${params.sharedAuthors.slice(0, 2).join(" and ")}'s writing.`);
    positiveSignals.push(...params.sharedAuthors.map((a) => `Shared author: ${a}`));
  } else if (params.sharedAuthors.length === 1) {
    reasons.push(`You both love ${params.sharedAuthors[0]}'s writing.`);
  }

  const dimReasonParts: string[] = [];
  for (const dim of params.sharedDimensions) {
    const [low, high] = DIMENSION_LABELS[dim];
    const val = ((params.dimensionsA[dim] ?? 0) + (params.dimensionsB[dim] ?? 0)) / 2;
    if (val < 0.4) dimReasonParts.push(low.toLowerCase());
    else if (val > 0.6) dimReasonParts.push(high.toLowerCase());
  }
  if (dimReasonParts.length >= 2) {
    reasons.push(`You both prefer ${dimReasonParts.slice(0, 3).join(", ")} stories.`);
  }

  if (params.negativeGenreOverlap.length > 0) {
    negativeSignals.push(...params.negativeGenreOverlap.map((g) => `Both avoid: ${g}`));
  }

  return { reasons: reasons.slice(0, 4), positiveSignals, negativeSignals };
}

export function generateBookMatchReasons(params: {
  sharedGenres: string[];
  authorLiked: boolean;
  authorName: string;
  dimensionSimilarity: number;
  sharedDimensions: Array<keyof TasteDimensions>;
  bookDimensions: Partial<TasteDimensions>;
  userDimensions: Partial<TasteDimensions>;
}): string[] {
  const reasons: string[] = [];

  if (params.authorLiked) {
    reasons.push(`You've rated other books by ${params.authorName} highly.`);
  }

  if (params.sharedGenres.length > 0) {
    reasons.push(`Matches your taste for ${params.sharedGenres.slice(0, 2).join(" and ")}.`);
  }

  const dimParts: string[] = [];
  for (const dim of params.sharedDimensions.slice(0, 3)) {
    const [low, high] = DIMENSION_LABELS[dim];
    const val = params.bookDimensions[dim] ?? 0.5;
    dimParts.push(val < 0.4 ? low.toLowerCase() : high.toLowerCase());
  }
  if (dimParts.length > 0) {
    reasons.push(`Features ${dimParts.slice(0, 2).join(" and ")} storytelling you enjoy.`);
  }

  return reasons.slice(0, 3);
}

export function generateClubMatchReasons(params: {
  sharedGenres: string[];
  memberCompatibilityAvg: number;
  strongMatchCount: number;
  clubDimensions: Partial<TasteDimensions>;
  sharedDimensions: Array<keyof TasteDimensions>;
  memberCount: number;
}): string[] {
  const reasons: string[] = [];

  if (params.strongMatchCount > 0) {
    reasons.push(`You strongly match with ${params.strongMatchCount} of ${params.memberCount} members.`);
  }

  if (params.sharedGenres.length > 0) {
    reasons.push(`The club often reads ${params.sharedGenres.slice(0, 2).join(" and ")}.`);
  }

  if (params.memberCompatibilityAvg > 0.65) {
    reasons.push(`Your taste aligns closely with the club's reading history.`);
  }

  const dimParts: string[] = [];
  for (const dim of params.sharedDimensions.slice(0, 3)) {
    const [low, high] = DIMENSION_LABELS[dim];
    const val = params.clubDimensions[dim] ?? 0.5;
    dimParts.push(val < 0.4 ? low.toLowerCase() : high.toLowerCase());
  }
  if (dimParts.length > 0) {
    reasons.push(`Club prefers ${dimParts.slice(0, 2).join(" and ")} reads — like you.`);
  }

  return reasons.slice(0, 3);
}
