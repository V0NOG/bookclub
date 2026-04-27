import { TasteDimensions } from "./types";

export function dimensionSimilarity(a: number, b: number): number {
  return 1 - Math.abs(a - b);
}

export function overallDimensionSimilarity(
  a: Partial<TasteDimensions>,
  b: Partial<TasteDimensions>
): number {
  const keys = Object.keys(a).filter((k) => k in a && k in b) as Array<keyof TasteDimensions>;
  if (keys.length === 0) return 0.5;

  const sum = keys.reduce((acc, key) => {
    return acc + dimensionSimilarity(a[key]!, b[key]!);
  }, 0);

  return sum / keys.length;
}

export function sharedDimensions(
  a: Partial<TasteDimensions>,
  b: Partial<TasteDimensions>,
  threshold = 0.2
): Array<keyof TasteDimensions> {
  return (Object.keys(a) as Array<keyof TasteDimensions>).filter((key) => {
    if (!(key in a) || !(key in b)) return false;
    return Math.abs(a[key]! - b[key]!) <= threshold;
  });
}

export function computeConfidence(
  ratedBooksCount: number,
  sharedSignalsCount: number
): "low" | "medium" | "high" {
  if (ratedBooksCount >= 5 && sharedSignalsCount >= 3) return "high";
  if (ratedBooksCount >= 2 || sharedSignalsCount >= 2) return "medium";
  return "low";
}

export function recencyWeight(date: Date): number {
  const daysAgo = (Date.now() - date.getTime()) / 86400000;
  if (daysAgo < 30) return 1.3;
  if (daysAgo < 90) return 1.15;
  return 1.0;
}

export function toScore(raw: number): number {
  return Math.round(Math.min(100, Math.max(0, raw * 100)));
}
