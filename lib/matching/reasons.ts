import { DIMENSION_LABELS, TasteDimensions } from "./types";

export function generateUserMatchReasons(params: {
  sharedBooks: string[];
  sharedGenres: string[];
  sharedAuthors: string[];
  sharedDimensions: Array<keyof TasteDimensions>;
  negativeGenreOverlap: string[];
  dimensionsA: Partial<TasteDimensions>;
  dimensionsB: Partial<TasteDimensions>;
  score: number;
}): { reasons: string[]; positiveSignals: string[]; negativeSignals: string[] } {
  const reasons: string[] = [];
  const positiveSignals: string[] = [];
  const negativeSignals: string[] = [];

  // Priority 1: shared books
  if (params.sharedBooks.length >= 2) {
    reasons.push(`You both rated ${params.sharedBooks.slice(0, 2).join(" and ")} highly.`);
    positiveSignals.push(...params.sharedBooks.slice(0, 3).map((b) => `Both loved: ${b}`));
  } else if (params.sharedBooks.length === 1) {
    reasons.push(`You both rated ${params.sharedBooks[0]} highly.`);
    positiveSignals.push(`Both loved: ${params.sharedBooks[0]}`);
  }

  // Priority 2: genre — score-banded
  if (reasons.length < 2 && params.sharedGenres.length > 0) {
    const label =
      params.sharedGenres.length >= 2
        ? params.sharedGenres.slice(0, 2).join(" and ")
        : params.sharedGenres[0];
    if (params.score >= 85) {
      reasons.push(`You both enjoy ${label}.`);
    } else if (params.score >= 60) {
      reasons.push(`You tend to read similar ${label} books.`);
    } else {
      reasons.push(`Some overlap in ${label} preferences.`);
    }
    positiveSignals.push(...params.sharedGenres.map((g) => `Shared genre: ${g}`));
  }

  // Priority 3: dimensions (only if 2+ labels can be formed)
  if (reasons.length < 2 && params.sharedDimensions.length >= 2) {
    const dimReasonParts: string[] = [];
    for (const dim of params.sharedDimensions) {
      const [low, high] = DIMENSION_LABELS[dim];
      const val = ((params.dimensionsA[dim] ?? 0) + (params.dimensionsB[dim] ?? 0)) / 2;
      dimReasonParts.push(val < 0.4 ? low.toLowerCase() : high.toLowerCase());
    }
    const uniqueDimParts = Array.from(new Set(dimReasonParts));
    if (uniqueDimParts.length >= 2) {
      const label = uniqueDimParts.slice(0, 2).join(" and ");
      if (params.score >= 85) {
        reasons.push(`You both prefer ${label} stories.`);
      } else if (params.score >= 60) {
        reasons.push(`Your reading styles often align in ${label}.`);
      } else {
        reasons.push(`Some shared preference for ${label} stories.`);
      }
    }
  }

  if (params.negativeGenreOverlap.length > 0) {
    negativeSignals.push(...params.negativeGenreOverlap.map((g) => `Both avoid: ${g}`));
  }

  return { reasons: reasons.slice(0, 2), positiveSignals, negativeSignals };
}

export function generateBookMatchReasons(params: {
  sharedGenres: string[];
  authorLiked: boolean;
  authorName: string;
  dimensionSimilarity: number;
  sharedDimensions: Array<keyof TasteDimensions>;
  bookDimensions: Partial<TasteDimensions>;
  userDimensions: Partial<TasteDimensions>;
  triggerBooks?: string[];
  score: number;
}): string[] {
  const reasons: string[] = [];

  // Priority 1: trigger book
  if (params.triggerBooks && params.triggerBooks.length > 0) {
    reasons.push(`Because you loved ${params.triggerBooks[0]}.`);
  }

  // Priority 2: genre — score-banded
  if (reasons.length < 2 && params.sharedGenres.length > 0) {
    const label = params.sharedGenres.slice(0, 2).join(" and ");
    if (params.score >= 85) {
      reasons.push(`Strongly matches your taste for ${label}.`);
    } else if (params.score >= 60) {
      reasons.push(`You tend to enjoy ${label}.`);
    } else {
      reasons.push(`Might match your interest in ${label}.`);
    }
  }

  // Priority 3: dimension — score-banded
  if (reasons.length < 2 && params.sharedDimensions.length > 0) {
    const dimParts: string[] = [];
    for (const dim of params.sharedDimensions.slice(0, 3)) {
      const [low, high] = DIMENSION_LABELS[dim];
      const val = params.bookDimensions[dim] ?? 0.5;
      dimParts.push(val < 0.4 ? low.toLowerCase() : high.toLowerCase());
    }
    const uniqueDimParts = Array.from(new Set(dimParts));
    if (uniqueDimParts.length > 0) {
      const label = uniqueDimParts.slice(0, 2).join(" and ");
      if (params.score >= 85) {
        reasons.push(`Features ${label} storytelling you enjoy.`);
      } else if (params.score >= 60) {
        reasons.push(`Often aligns with your taste for ${label} reads.`);
      } else {
        reasons.push(`Shares some ${label} elements with your preferences.`);
      }
    }
  }

  // Priority 4: author (fallback only)
  if (reasons.length < 2 && params.authorLiked) {
    reasons.push(`You've rated other books by ${params.authorName} highly.`);
  }

  return reasons.slice(0, 2);
}

export function generateClubMatchReasons(params: {
  sharedGenres: string[];
  memberCompatibilityAvg: number;
  strongMatchCount: number;
  clubDimensions: Partial<TasteDimensions>;
  sharedDimensions: Array<keyof TasteDimensions>;
  memberCount: number;
  score: number;
}): string[] {
  const reasons: string[] = [];

  // Priority 1: strong member match count
  if (params.strongMatchCount > 0) {
    reasons.push(`You strongly match with ${params.strongMatchCount} of ${params.memberCount} members.`);
  }

  // Priority 2: genre — score-banded
  if (reasons.length < 2 && params.sharedGenres.length > 0) {
    const label = params.sharedGenres.slice(0, 2).join(" and ");
    if (params.score >= 85) {
      reasons.push(`The club reads ${label}, which aligns with your taste.`);
    } else if (params.score >= 60) {
      reasons.push(`You tend to enjoy ${label}, which the club often reads.`);
    } else {
      reasons.push(`Some overlap with the club's ${label} picks.`);
    }
  }

  // Priority 3: member avg (if > 0.65)
  if (reasons.length < 2 && params.memberCompatibilityAvg > 0.65) {
    const pct = Math.round(params.memberCompatibilityAvg * 100);
    reasons.push(`Your taste overlaps ~${pct}% with the club's typical reader.`);
  }

  // Priority 3 alt: dimension fallback
  if (reasons.length < 2 && params.sharedDimensions.length > 0) {
    const dimParts: string[] = [];
    for (const dim of params.sharedDimensions.slice(0, 3)) {
      const [low, high] = DIMENSION_LABELS[dim];
      const val = params.clubDimensions[dim] ?? 0.5;
      dimParts.push(val < 0.4 ? low.toLowerCase() : high.toLowerCase());
    }
    if (dimParts.length > 0) {
      reasons.push(`Club prefers ${dimParts.slice(0, 2).join(" and ")} reads — like you.`);
    }
  }

  return reasons.slice(0, 2);
}

export function generateExploratoryReason(
  sharedDimensions: Array<keyof TasteDimensions>,
  sharedThemes: string[]
): string {
  if (sharedDimensions.length > 0) {
    const [, high] = DIMENSION_LABELS[sharedDimensions[0]];
    return `A different direction that shares your preference for ${high.toLowerCase()} reads.`;
  }
  if (sharedThemes.length > 0) {
    return `Expands on your interest in ${sharedThemes[0]}.`;
  }
  return "Might interest you based on your reading patterns.";
}
