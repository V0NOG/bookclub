# Feedback Taste Learning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compute an in-memory feedback adjustment layer from stored `RecommendationFeedback` records and blend it (15%) into `buildUserTasteSnapshot` without touching the base `TasteProfile`.

**Architecture:** A new pure module `lib/taste/feedback-adjustments.ts` exposes testable pure functions (`aggregateFeedbackSignals`, `blendDimensions`, `applyGenreAdjustments`) plus one DB-dependent entry point (`computeFeedbackAdjustments`). `buildUserTasteSnapshot` in `lib/taste/profile.ts` calls `computeFeedbackAdjustments` and applies the blend as the final step before returning the snapshot. No schema changes. No writes to `TasteProfile`.

**Tech Stack:** TypeScript, Prisma (read-only queries), Jest

---

## File structure

| File | Change | Responsibility |
|------|--------|----------------|
| `lib/taste/feedback-adjustments.ts` | **Create** | All feedback-to-taste math: signal types, aggregation, blending, genre adjustments, DB fetch |
| `__tests__/taste/feedback-adjustments.test.ts` | **Create** | Unit tests for pure functions only (no DB) |
| `lib/taste/profile.ts` | **Modify** | Call `computeFeedbackAdjustments` and blend inside `buildUserTasteSnapshot` |

---

## Task 1: `lib/taste/feedback-adjustments.ts` — core module

**Files:**
- Create: `lib/taste/feedback-adjustments.ts`
- Test: `__tests__/taste/feedback-adjustments.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/taste/feedback-adjustments.test.ts`:

```typescript
import {
  aggregateFeedbackSignals,
  blendDimensions,
  applyGenreAdjustments,
} from "@/lib/taste/feedback-adjustments";

// ── Spec requirement: 1 dislike does NOT drastically change results ────────────

test("single DISLIKE gives genre weight of -0.15 only", () => {
  const result = aggregateFeedbackSignals([{
    action: "DISLIKE",
    signals: { genres: ["Fantasy"], dimensions: {} },
  }]);
  expect(result.genreWeights.get("Fantasy")).toBeCloseTo(-0.15, 5);
});

test("single DISLIKE does not reach genre dislike threshold (-0.20)", () => {
  const result = aggregateFeedbackSignals([{
    action: "DISLIKE",
    signals: { genres: ["Fantasy"], dimensions: {} },
  }]);
  const { dislikedGenres } = applyGenreAdjustments(["Fantasy"], [], result.genreWeights);
  expect(dislikedGenres).not.toContain("Fantasy");
});

test("single DISLIKE on dimension shifts base by at most 2%", () => {
  const result = aggregateFeedbackSignals([{
    action: "DISLIKE",
    signals: { genres: [], dimensions: { pace: 0.9 } },
  }]);
  const blended = blendDimensions({ pace: 0.5 }, result.dimensionNudge);
  // base 0.5, nudge toward (1-0.9)=0.1, result: 0.85*0.5 + 0.15*0.1 = 0.4250 + 0.015 = 0.44
  expect(blended.pace).toBeCloseTo(0.44, 2);
  expect(Math.abs((blended.pace ?? 0) - 0.5)).toBeLessThan(0.07);
});

// ── Spec requirement: repeated dislikes gradually shift recommendations ────────

test("two dislikes bring genre weight below threshold", () => {
  const entries = Array(2).fill({
    action: "DISLIKE" as const,
    signals: { genres: ["Fantasy"], dimensions: {} },
  });
  const result = aggregateFeedbackSignals(entries);
  expect(result.genreWeights.get("Fantasy")).toBeCloseTo(-0.30, 5);
  const { dislikedGenres } = applyGenreAdjustments([], [], result.genreWeights);
  expect(dislikedGenres).toContain("Fantasy");
});

test("four dislikes on dimension create a meaningful cumulative shift", () => {
  const entries = Array(4).fill({
    action: "DISLIKE" as const,
    signals: { genres: [], dimensions: { pace: 0.9 } },
  });
  const result = aggregateFeedbackSignals(entries);
  const blended = blendDimensions({ pace: 0.7 }, result.dimensionNudge);
  // nudge is still (1-0.9)=0.1, blended: 0.85*0.7 + 0.15*0.1 = 0.595+0.015 = 0.61
  expect((blended.pace ?? 0)).toBeLessThan(0.7);
});

// ── Spec requirement: likes reinforce but don't dominate ──────────────────────

test("three likes on dimension nudge without dominating", () => {
  // nudge target is 0.9; 3 signals does NOT override base of 0.3
  const entries = Array(3).fill({
    action: "LIKE" as const,
    signals: { genres: [], dimensions: { pace: 0.9 } },
  });
  const result = aggregateFeedbackSignals(entries);
  const blended = blendDimensions({ pace: 0.3 }, result.dimensionNudge);
  // nudge = 0.9 regardless of count (weighted avg of same value)
  // blended: 0.85*0.3 + 0.15*0.9 = 0.255 + 0.135 = 0.39
  expect(blended.pace).toBeCloseTo(0.39, 2);
  expect((blended.pace ?? 0)).toBeLessThan(0.5);  // base still dominates
});

test("two likes bring genre over threshold and add to topGenres", () => {
  const entries = Array(2).fill({
    action: "LIKE" as const,
    signals: { genres: ["Sci-Fi"], dimensions: {} },
  });
  const result = aggregateFeedbackSignals(entries);
  const { topGenres } = applyGenreAdjustments(["Fantasy"], [], result.genreWeights);
  expect(topGenres).toContain("Sci-Fi");
  expect(topGenres[0]).toBe("Fantasy");  // base is not reordered
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
  expect(topGenres.length).toBeLessThanOrEqual(3);  // 1 base + max 2
});

test("no feedback returns empty adjustments", () => {
  const result = aggregateFeedbackSignals([]);
  expect(result.genreWeights.size).toBe(0);
  expect(Object.keys(result.dimensionNudge).length).toBe(0);
});

test("blendDimensions skips dimensions not present in nudge", () => {
  const base = { pace: 0.5, tone: 0.7 };
  const nudge = { pace: 0.9 };  // tone not in nudge
  const blended = blendDimensions(base, nudge);
  expect(blended.pace).toBeCloseTo(0.85 * 0.5 + 0.15 * 0.9, 5);
  expect(blended.tone).toBe(0.7);  // unchanged
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
```

- [ ] **Step 2: Run tests to confirm they all fail**

```bash
cd /Users/connor/Documents/bookclub && npx jest --testPathPatterns="__tests__/taste" 2>&1 | tail -10
```

Expected: FAIL — cannot find module `@/lib/taste/feedback-adjustments`

- [ ] **Step 3: Implement `lib/taste/feedback-adjustments.ts`**

Create the file with this exact content:

```typescript
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

// Converts nullable Prisma dimension fields to Partial<TasteDimensions>.
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
 * Aggregates a list of feedback+signal pairs into genre weights and a dimension nudge.
 *
 * Genre weights: LIKE=+0.08, DISLIKE=-0.15 per signal; clamped to [-1, +1].
 *
 * Dimension nudge: weighted average of "suggested" dimension values.
 *   LIKE on item with dim=v  → suggests preference of v    (weight 0.08)
 *   DISLIKE on item with dim=v → suggests preference of (1-v) (weight 0.15)
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
 * Clamped to [0.05, 0.95] to prevent extremes.
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
 * Applies genre weights to the ranked genre lists.
 *
 * LIKE threshold (>=0.16, i.e. 2+ likes):   append genre to topGenres (max 2 additions; skip if already present or disliked)
 * DISLIKE threshold (<=-0.20, i.e. 2+ dislikes): append genre to dislikedGenres (skip if already present)
 *
 * Base topGenres ordering is NEVER changed.
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
 * Fetches all stored feedback for a user, resolves target signals in 3 batched queries
 * (one per targetType), and returns aggregated adjustments.
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
      : ([] as Array<{ id: string; genres: string[]; tasteDimensions: { pace: number | null; tone: number | null; focus: number | null; emotionalIntensity: number | null; romanceLevel: number | null; complexity: number | null; worldbuildingDepth: number | null; discussionPotential: number | null } | null }>),
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
      : ([] as Array<{ id: string; tasteProfile: { topGenres: string[]; pace: number | null; tone: number | null; focus: number | null; emotionalIntensity: number | null; romanceLevel: number | null; complexity: number | null; worldbuildingDepth: number | null; discussionPotential: number | null } | null }>),
    clubIds.length > 0
      ? db.club.findMany({
          where: { id: { in: clubIds } },
          select: { id: true, genres: true },
        })
      : ([] as Array<{ id: string; genres: string[] }>),
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
        signals = {
          genres: user.tasteProfile.topGenres,
          dimensions: toDimensions(user.tasteProfile),
        };
      }
    } else if (record.targetType === "CLUB") {
      const club = clubMap.get(record.targetId);
      if (club) signals = { genres: club.genres, dimensions: {} };
    }

    if (signals) entries.push({ action, signals });
  }

  return aggregateFeedbackSignals(entries);
}
```

- [ ] **Step 4: Run tests to confirm they all pass**

```bash
cd /Users/connor/Documents/bookclub && npx jest --testPathPatterns="__tests__/taste" 2>&1 | tail -15
```

Expected: `Tests: 13 passed, 13 total`

- [ ] **Step 5: Commit**

```bash
cd /Users/connor/Documents/bookclub && git add lib/taste/feedback-adjustments.ts __tests__/taste/feedback-adjustments.test.ts && git commit -m "feat: feedback adjustment module — pure aggregation, blend, genre apply"
```

---

## Task 2: Update `buildUserTasteSnapshot` to apply feedback blend

**Files:**
- Modify: `lib/taste/profile.ts` (lines 1–10 for imports, lines 107–134 for blend injection)

The current `buildUserTasteSnapshot` returns at line 123. We inject the feedback blend between the final variable computations and the return.

- [ ] **Step 1: Read the current profile.ts to confirm line numbers**

Run:
```bash
cd /Users/connor/Documents/bookclub && grep -n "finalGenres\|finalDisliked\|return {" lib/taste/profile.ts
```

Expected output (current file):
```
107:  const finalGenres =
112:  const finalAuthors =
117:  const finalDisliked =
120:  const confidence: "low" | "medium" | "high" =
123:  return {
```

- [ ] **Step 2: Add import for feedback functions**

The current import block at the top of `lib/taste/profile.ts`:
```typescript
import { db } from "@/lib/db";
import { UserTasteSnapshot, TasteDimensions } from "@/lib/matching/types";
```

Change to:
```typescript
import { db } from "@/lib/db";
import { UserTasteSnapshot, TasteDimensions } from "@/lib/matching/types";
import { computeFeedbackAdjustments, blendDimensions, applyGenreAdjustments } from "@/lib/taste/feedback-adjustments";
```

- [ ] **Step 3: Inject feedback blend before the return statement**

Current code at lines 107–134:
```typescript
  const finalGenres =
    topGenres.length > 0
      ? topGenres
      : (onboardingData?.favoriteGenres ?? tasteProfile?.topGenres ?? []);

  const finalAuthors =
    topAuthors.length > 0
      ? topAuthors
      : (onboardingData?.favoriteAuthors ?? tasteProfile?.topAuthors ?? []);

  const finalDisliked =
    dislikedGenres.length > 0 ? dislikedGenres : (tasteProfile?.dislikedGenres ?? []);

  const confidence: "low" | "medium" | "high" =
    ratedBooks.length >= 5 ? "high" : ratedBooks.length >= 2 ? "medium" : "low";

  return {
    userId,
    topGenres: finalGenres,
    topAuthors: finalAuthors,
    topThemes: tasteProfile?.topThemes ?? onboardingData?.preferredThemes ?? [],
    dimensions: mergedDimensions,
    dislikedGenres: finalDisliked,
    dislikedAuthors: tasteProfile?.dislikedAuthors ?? [],
    ratedBooks,
    confidence,
  };
```

Replace with:
```typescript
  const finalGenres =
    topGenres.length > 0
      ? topGenres
      : (onboardingData?.favoriteGenres ?? tasteProfile?.topGenres ?? []);

  const finalAuthors =
    topAuthors.length > 0
      ? topAuthors
      : (onboardingData?.favoriteAuthors ?? tasteProfile?.topAuthors ?? []);

  const finalDisliked =
    dislikedGenres.length > 0 ? dislikedGenres : (tasteProfile?.dislikedGenres ?? []);

  const confidence: "low" | "medium" | "high" =
    ratedBooks.length >= 5 ? "high" : ratedBooks.length >= 2 ? "medium" : "low";

  // Blend feedback adjustments at 15% weight — base profile unchanged in DB.
  const feedbackAdj = await computeFeedbackAdjustments(userId);
  const blendedDimensions = blendDimensions(mergedDimensions, feedbackAdj.dimensionNudge);
  const { topGenres: blendedGenres, dislikedGenres: blendedDisliked } = applyGenreAdjustments(
    finalGenres,
    finalDisliked,
    feedbackAdj.genreWeights
  );

  return {
    userId,
    topGenres: blendedGenres,
    topAuthors: finalAuthors,
    topThemes: tasteProfile?.topThemes ?? onboardingData?.preferredThemes ?? [],
    dimensions: blendedDimensions,
    dislikedGenres: blendedDisliked,
    dislikedAuthors: tasteProfile?.dislikedAuthors ?? [],
    ratedBooks,
    confidence,
  };
```

- [ ] **Step 4: Run all matching tests**

```bash
cd /Users/connor/Documents/bookclub && npx jest --testPathPatterns="__tests__" 2>&1 | tail -10
```

Expected: all 19 matching tests + 13 taste tests = `32 passed`

Note: matching tests do not call `buildUserTasteSnapshot`, so there are no DB dependencies to mock.

- [ ] **Step 5: Type-check**

```bash
cd /Users/connor/Documents/bookclub && npx tsc --noEmit 2>&1 | grep -E "feedback-adjustments|taste/profile" | head -20
```

Expected: no errors in either file.

- [ ] **Step 6: Commit**

```bash
cd /Users/connor/Documents/bookclub && git add lib/taste/profile.ts && git commit -m "feat: blend feedback adjustments into taste snapshot at 15% weight"
```

---

## Task 3: Validate and commit

**Files:** None (validation only)

- [ ] **Step 1: Full type-check**

```bash
cd /Users/connor/Documents/bookclub && npx tsc --noEmit 2>&1 | grep -v "node_modules" | grep -v "TS7006" | head -20
```

Expected: no new errors beyond the pre-existing `TS7006` implicit-any warnings in scoring lambdas.

- [ ] **Step 2: Full test suite**

```bash
cd /Users/connor/Documents/bookclub && npx jest 2>&1 | tail -10
```

Expected: `32 passed`

- [ ] **Step 3: Build**

```bash
cd /Users/connor/Documents/bookclub && npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 4: Final commit**

```bash
cd /Users/connor/Documents/bookclub && git add -A && git commit -m "feat: feedback taste learning — in-memory blend at 15% weight, no DB mutation"
```

---

## How feedback modifies taste (for reference)

### Before

`buildUserTasteSnapshot` returns dimensions purely from:
1. Weighted average of rated books' `BookTasteDimension` values
2. Overridden by stored `TasteProfile.{dim}` if non-null

### After

Same base, then blended with feedback adjustments:

```
baseDim = TasteProfile.{dim} ?? weightedAvg(ratedBooks.{dim})
nudge   = weightedAvg(feedback signals, where LIKE → toward target, DISLIKE → toward 1-target)
finalDim = clamp(0.85 * baseDim + 0.15 * nudge, 0.05, 0.95)
```

### Example before/after

User: reads Fantasy, prefers complex character-driven books. `complexity=0.8`, `pace=0.45`.

User gives feedback:
- DISLIKE on a fast thriller (`pace=0.9`) → nudge for pace = `1-0.9 = 0.1`, weight 0.15
- DISLIKE on another thriller (`pace=0.85`) → nudge for pace = `1-0.85 = 0.15`, weight 0.15

After aggregation:
```
dimensionNudge.pace = (0.1*0.15 + 0.15*0.15) / (0.15+0.15) = 0.015+0.0225 / 0.30 = 0.125
```

Blended pace:
```
before: 0.45
after:  0.85 * 0.45 + 0.15 * 0.125 = 0.3825 + 0.01875 = 0.40125
```

Shift: only -0.049. Base profile of `0.45` is strongly preserved. After 5+ dislikes of fast books, pace preference drifts meaningfully toward slow without being overridden.

If the user then rates 3 more slow books at 5★, `buildUserTasteSnapshot` computes a lower pace from those ratings — the two signals reinforce each other.
