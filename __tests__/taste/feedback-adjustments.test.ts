jest.mock("@/lib/db", () => ({ db: {} }));

import {
  aggregateFeedbackSignals,
  blendDimensions,
  applyGenreAdjustments,
} from "@/lib/taste/feedback-adjustments";

// ── Single DISLIKE is small ───────────────────────────────────────────────────

test("single DISLIKE gives genre weight of -0.15 only", () => {
  const result = aggregateFeedbackSignals([{
    action: "DISLIKE",
    signals: { genres: ["Fantasy"], dimensions: {} },
  }]);
  expect(result.genreWeights.get("Fantasy")).toBeCloseTo(-0.15, 5);
});

test("single DISLIKE does not reach genre dislike threshold", () => {
  const result = aggregateFeedbackSignals([{
    action: "DISLIKE",
    signals: { genres: ["Fantasy"], dimensions: {} },
  }]);
  const { dislikedGenres } = applyGenreAdjustments(["Fantasy"], [], result.genreWeights);
  expect(dislikedGenres).not.toContain("Fantasy");
});

test("single DISLIKE on dimension shifts base by less than 0.07", () => {
  const result = aggregateFeedbackSignals([{
    action: "DISLIKE",
    signals: { genres: [], dimensions: { pace: 0.9 } },
  }]);
  const blended = blendDimensions({ pace: 0.5 }, result.dimensionNudge);
  expect(Math.abs((blended.pace ?? 0) - 0.5)).toBeLessThan(0.07);
});

// ── Repeated dislikes gradually shift ────────────────────────────────────────

test("two dislikes bring genre weight to -0.30 and add to disliked", () => {
  const entries = Array(2).fill({
    action: "DISLIKE" as const,
    signals: { genres: ["Fantasy"], dimensions: {} },
  });
  const result = aggregateFeedbackSignals(entries);
  expect(result.genreWeights.get("Fantasy")).toBeCloseTo(-0.30, 5);
  const { dislikedGenres } = applyGenreAdjustments([], [], result.genreWeights);
  expect(dislikedGenres).toContain("Fantasy");
});

test("four dislikes on dimension create cumulative shift away from base", () => {
  const entries = Array(4).fill({
    action: "DISLIKE" as const,
    signals: { genres: [], dimensions: { pace: 0.9 } },
  });
  const result = aggregateFeedbackSignals(entries);
  const blended = blendDimensions({ pace: 0.7 }, result.dimensionNudge);
  expect((blended.pace ?? 0)).toBeLessThan(0.7);
});

// ── Likes reinforce without dominating ───────────────────────────────────────

test("three likes on dimension nudge base without dominating it", () => {
  const entries = Array(3).fill({
    action: "LIKE" as const,
    signals: { genres: [], dimensions: { pace: 0.9 } },
  });
  const result = aggregateFeedbackSignals(entries);
  const blended = blendDimensions({ pace: 0.3 }, result.dimensionNudge);
  // 0.85*0.3 + 0.15*0.9 = 0.255+0.135 = 0.39
  expect(blended.pace).toBeCloseTo(0.39, 2);
  expect((blended.pace ?? 0)).toBeLessThan(0.5);
});

test("two likes bring genre over threshold and append to topGenres", () => {
  const entries = Array(2).fill({
    action: "LIKE" as const,
    signals: { genres: ["Sci-Fi"], dimensions: {} },
  });
  const result = aggregateFeedbackSignals(entries);
  const { topGenres } = applyGenreAdjustments(["Fantasy"], [], result.genreWeights);
  expect(topGenres).toContain("Sci-Fi");
  expect(topGenres[0]).toBe("Fantasy");
});

// ── Safeguards ────────────────────────────────────────────────────────────────

test("genre weights are clamped to [-1, +1] under many signals", () => {
  const entries = Array(20).fill({
    action: "DISLIKE" as const,
    signals: { genres: ["Fantasy"], dimensions: {} },
  });
  const result = aggregateFeedbackSignals(entries);
  expect(result.genreWeights.get("Fantasy")).toBeGreaterThanOrEqual(-1);
});

test("blended dimensions are clamped to [0.05, 0.95]", () => {
  const entries = Array(20).fill({
    action: "LIKE" as const,
    signals: { genres: [], dimensions: { pace: 1.0 } },
  });
  const result = aggregateFeedbackSignals(entries);
  const blended = blendDimensions({ pace: 0.99 }, result.dimensionNudge);
  expect((blended.pace ?? 0)).toBeLessThanOrEqual(0.95);
  expect((blended.pace ?? 0)).toBeGreaterThanOrEqual(0.05);
});

test("at most 2 genre additions from feedback", () => {
  const genreWeights = new Map([["A", 0.2], ["B", 0.2], ["C", 0.2]]);
  const { topGenres } = applyGenreAdjustments(["Fantasy"], [], genreWeights);
  expect(topGenres.length).toBeLessThanOrEqual(3);
});

test("no feedback returns empty adjustments", () => {
  const result = aggregateFeedbackSignals([]);
  expect(result.genreWeights.size).toBe(0);
  expect(Object.keys(result.dimensionNudge).length).toBe(0);
});

test("blendDimensions skips dimensions not in nudge", () => {
  const blended = blendDimensions({ pace: 0.5, tone: 0.7 }, { pace: 0.9 });
  expect(blended.pace).toBeCloseTo(0.85 * 0.5 + 0.15 * 0.9, 5);
  expect(blended.tone).toBe(0.7);
});

test("liked genre already in topGenres is not duplicated", () => {
  const genreWeights = new Map([["Fantasy", 0.2]]);
  const { topGenres } = applyGenreAdjustments(["Fantasy"], [], genreWeights);
  expect(topGenres.filter((g) => g === "Fantasy").length).toBe(1);
});

test("liked genre already in dislikedGenres is not added to topGenres", () => {
  const genreWeights = new Map([["Horror", 0.3]]);
  const { topGenres } = applyGenreAdjustments(["Fantasy"], ["Horror"], genreWeights);
  expect(topGenres).not.toContain("Horror");
});
