import { TasteDimensions } from "./types";

export type ExplorationContext = {
  topGenreSet: Set<string>;
  dislikedGenreSet: Set<string>;
  minScore: number;
};

export type ExplorationCandidate = {
  score: number;
  genres: string[];
  sharedGenres: string[];
  sharedDimensions: Array<keyof TasteDimensions>;
  sharedThemes: string[];
};

export function isExploratoryEligible(
  candidate: ExplorationCandidate,
  ctx: ExplorationContext
): boolean {
  if (candidate.score < ctx.minScore) return false;

  const hasDislikedGenre = candidate.genres.some((g) => ctx.dislikedGenreSet.has(g));
  if (hasDislikedGenre) return false;

  const isOutsideTopGenres =
    candidate.genres.length === 0
      ? true
      : candidate.genres.every((g) => !ctx.topGenreSet.has(g)) &&
        candidate.sharedGenres.length === 0;
  if (!isOutsideTopGenres) return false;

  const isAdjacent =
    candidate.sharedDimensions.length > 0 ||
    candidate.sharedThemes.length > 0;
  return isAdjacent;
}

export function selectExploratory<T>(
  items: T[],
  toCandidate: (item: T) => ExplorationCandidate,
  ctx: ExplorationContext,
  limit: number
): T[] {
  const results: T[] = [];
  for (const item of items) {
    if (results.length >= limit) break;
    if (isExploratoryEligible(toCandidate(item), ctx)) {
      results.push(item);
    }
  }
  return results;
}
