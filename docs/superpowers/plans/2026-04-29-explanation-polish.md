# Phase 11: Explanation Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make recommendation explanations feel more natural, less repetitive, and more trustworthy through confidence-aware phrasing, max-2 reason discipline, and `isExploratory` flagging with differentiated copy.

**Architecture:** Three changes: (1) refactor all three reason generators in `lib/matching/reasons.ts` — add `score: number` param, apply phrasing bands, enforce max 2 reasons with priority order; (2) wire `score` from each match calculator into its reason generator; (3) add `isExploratory?: true` to cache types, tag exploratory items in `cache.ts`, and generate adjacency-grounded exploratory reasons.

**Tech Stack:** TypeScript, Jest, no new dependencies.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `lib/matching/reasons.ts` | Add score-based phrasing, max 2, priority, `generateExploratoryReason` |
| Modify | `lib/matching/user-to-book.ts` | Pass `score` to `generateBookMatchReasons` |
| Modify | `lib/matching/user-to-user.ts` | Pass `score` to `generateUserMatchReasons` |
| Modify | `lib/matching/user-to-club.ts` | Pass `score` to `generateClubMatchReasons` |
| Modify | `lib/matching/cache.ts` | Add `isExploratory?: true` to types, tag + rephrase exploratory items |
| Create | `__tests__/matching/reasons.test.ts` | Max-2, priority, score-band phrasing, exploratory reason tests |

---

### Task 1: Confidence-aware reasons, max 2, and exploratory phrasing

**Files:**
- Modify: `lib/matching/reasons.ts`
- Modify: `lib/matching/user-to-book.ts:55-63`
- Modify: `lib/matching/user-to-user.ts:91-99`
- Modify: `lib/matching/user-to-club.ts:63-70`

- [ ] **Step 1: Write failing tests first** (in `__tests__/matching/reasons.test.ts`)

Create this file:

```typescript
import { generateBookMatchReasons, generateExploratoryReason } from "@/lib/matching/reasons";

test("book reasons: max 2 reasons returned even with all signals present", () => {
  const reasons = generateBookMatchReasons({
    sharedGenres: ["Fantasy"],
    authorLiked: true,
    authorName: "Patrick Rothfuss",
    dimensionSimilarity: 0.8,
    sharedDimensions: ["tone", "complexity"],
    bookDimensions: { tone: 0.8, complexity: 0.9 },
    userDimensions: { tone: 0.75, complexity: 0.85 },
    triggerBooks: ["Six of Crows"],
    score: 85,
  });
  expect(reasons.length).toBeLessThanOrEqual(2);
});

test("book reasons: trigger book is first even when genre is present", () => {
  const reasons = generateBookMatchReasons({
    sharedGenres: ["Fantasy"],
    authorLiked: false,
    authorName: "Unknown",
    dimensionSimilarity: 0.7,
    sharedDimensions: ["tone"],
    bookDimensions: { tone: 0.8 },
    userDimensions: { tone: 0.75 },
    triggerBooks: ["The Name of the Wind"],
    score: 80,
  });
  expect(reasons[0]).toMatch(/Because you loved The Name of the Wind/);
});

test("book reasons: genre fills slot 2 when trigger book fills slot 1", () => {
  const reasons = generateBookMatchReasons({
    sharedGenres: ["Fantasy"],
    authorLiked: false,
    authorName: "Unknown",
    dimensionSimilarity: 0.7,
    sharedDimensions: [],
    bookDimensions: {},
    userDimensions: {},
    triggerBooks: ["Six of Crows"],
    score: 75,
  });
  expect(reasons).toHaveLength(2);
  expect(reasons[0]).toMatch(/Because you loved/);
  expect(reasons[1]).toMatch(/You tend to enjoy Fantasy/);
});

test("book reasons: high score (≥85) uses strong genre phrasing", () => {
  const reasons = generateBookMatchReasons({
    sharedGenres: ["Fantasy"],
    authorLiked: false,
    authorName: "Unknown",
    dimensionSimilarity: 0.7,
    sharedDimensions: [],
    bookDimensions: {},
    userDimensions: {},
    score: 90,
  });
  expect(reasons[0]).toMatch(/Strongly matches your taste for Fantasy/);
});

test("book reasons: medium score (60–84) uses softer genre phrasing", () => {
  const reasons = generateBookMatchReasons({
    sharedGenres: ["Fantasy"],
    authorLiked: false,
    authorName: "Unknown",
    dimensionSimilarity: 0.7,
    sharedDimensions: [],
    bookDimensions: {},
    userDimensions: {},
    score: 70,
  });
  expect(reasons[0]).toMatch(/You tend to enjoy Fantasy/);
});

test("book reasons: low score (<60) uses exploratory genre phrasing", () => {
  const reasons = generateBookMatchReasons({
    sharedGenres: ["Fantasy"],
    authorLiked: false,
    authorName: "Unknown",
    dimensionSimilarity: 0.7,
    sharedDimensions: [],
    bookDimensions: {},
    userDimensions: {},
    score: 50,
  });
  expect(reasons[0]).toMatch(/Might match your interest in Fantasy/);
});

test("book reasons: no reasons when no signals", () => {
  const reasons = generateBookMatchReasons({
    sharedGenres: [],
    authorLiked: false,
    authorName: "Unknown",
    dimensionSimilarity: 0.3,
    sharedDimensions: [],
    bookDimensions: {},
    userDimensions: {},
    score: 30,
  });
  expect(reasons.length).toBe(0);
});

test("exploratory reason with shared dimension uses adjacency phrasing", () => {
  const reason = generateExploratoryReason(["tone"], []);
  expect(reason).toMatch(/A different direction/);
});

test("exploratory reason with shared theme uses interest-expansion phrasing", () => {
  const reason = generateExploratoryReason([], ["mythology"]);
  expect(reason).toMatch(/Expands on your interest in mythology/);
});

test("exploratory reason: dimension takes priority over theme", () => {
  const reason = generateExploratoryReason(["complexity"], ["magic"]);
  expect(reason).toMatch(/A different direction/);
});

test("exploratory reason: fallback when no signals", () => {
  const reason = generateExploratoryReason([], []);
  expect(reason).toMatch(/Might interest you/);
});
```

- [ ] **Step 2: Run to verify failures**

```bash
cd /Users/connor/Documents/bookclub && npx jest __tests__/matching/reasons.test.ts --no-coverage 2>&1
```

Expected: module-not-found or missing export errors for `generateExploratoryReason`, and failures for score-band phrasing tests.

- [ ] **Step 3: Rewrite `lib/matching/reasons.ts`**

Replace the entire file with:

```typescript
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
  const { score } = params;

  // Priority 1: shared books
  if (params.sharedBooks.length >= 2) {
    reasons.push(`You both rated ${params.sharedBooks.slice(0, 2).join(" and ")} highly.`);
    positiveSignals.push(...params.sharedBooks.slice(0, 3).map((b) => `Both loved: ${b}`));
  } else if (params.sharedBooks.length === 1) {
    reasons.push(`You both rated ${params.sharedBooks[0]} highly.`);
    positiveSignals.push(`Both loved: ${params.sharedBooks[0]}`);
  }

  // Priority 2: shared genres
  if (reasons.length < 2 && params.sharedGenres.length > 0) {
    const genre = params.sharedGenres[0];
    if (score >= 85) {
      reasons.push(`You both enjoy ${params.sharedGenres.slice(0, 2).join(" and ")}.`);
    } else if (score >= 60) {
      reasons.push(`You tend to read similar ${genre} books.`);
    } else {
      reasons.push(`Some overlap in ${genre} preferences.`);
    }
    positiveSignals.push(...params.sharedGenres.map((g) => `Shared genre: ${g}`));
  }

  // Priority 3: dimensions (only if 2+ aligned dims produce a label)
  if (reasons.length < 2) {
    const dimReasonParts: string[] = [];
    for (const dim of params.sharedDimensions) {
      const [low, high] = DIMENSION_LABELS[dim];
      const val = ((params.dimensionsA[dim] ?? 0) + (params.dimensionsB[dim] ?? 0)) / 2;
      if (val < 0.4) dimReasonParts.push(low.toLowerCase());
      else if (val > 0.6) dimReasonParts.push(high.toLowerCase());
    }
    if (dimReasonParts.length >= 2) {
      const label = dimReasonParts.slice(0, 2).join(" and ");
      if (score >= 85) {
        reasons.push(`You both prefer ${label} stories.`);
      } else if (score >= 60) {
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
  const { score } = params;

  // Priority 1: trigger book
  if (params.triggerBooks && params.triggerBooks.length > 0) {
    reasons.push(`Because you loved ${params.triggerBooks[0]}.`);
  }

  // Priority 2: genre match
  if (reasons.length < 2 && params.sharedGenres.length > 0) {
    const genre = params.sharedGenres[0];
    if (score >= 85) {
      reasons.push(`Strongly matches your taste for ${genre}.`);
    } else if (score >= 60) {
      reasons.push(`You tend to enjoy ${genre}.`);
    } else {
      reasons.push(`Might match your interest in ${genre}.`);
    }
  }

  // Priority 3: dimension match
  if (reasons.length < 2) {
    const dimParts: string[] = [];
    for (const dim of params.sharedDimensions.slice(0, 2)) {
      const [low, high] = DIMENSION_LABELS[dim];
      const val = params.bookDimensions[dim] ?? 0.5;
      dimParts.push(val < 0.4 ? low.toLowerCase() : high.toLowerCase());
    }
    if (dimParts.length > 0) {
      const label = dimParts.slice(0, 2).join(" and ");
      if (score >= 85) {
        reasons.push(`Features ${label} storytelling you enjoy.`);
      } else if (score >= 60) {
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
  const { score } = params;

  // Priority 1: member compatibility
  if (params.strongMatchCount > 0) {
    reasons.push(`You strongly match with ${params.strongMatchCount} of ${params.memberCount} members.`);
  }

  // Priority 2: shared genres
  if (reasons.length < 2 && params.sharedGenres.length > 0) {
    const genre = params.sharedGenres[0];
    if (score >= 85) {
      reasons.push(`The club reads ${params.sharedGenres.slice(0, 2).join(" and ")}, which aligns with your taste.`);
    } else if (score >= 60) {
      reasons.push(`You tend to enjoy ${genre}, which the club often reads.`);
    } else {
      reasons.push(`Some overlap with the club's ${genre} picks.`);
    }
  }

  // Priority 3: member avg or dimensions
  if (reasons.length < 2) {
    if (params.memberCompatibilityAvg > 0.65) {
      const pct = Math.round(params.memberCompatibilityAvg * 100);
      reasons.push(`Your taste overlaps ~${pct}% with the club's typical reader.`);
    } else {
      const dimParts: string[] = [];
      for (const dim of params.sharedDimensions.slice(0, 2)) {
        const [low, high] = DIMENSION_LABELS[dim];
        const val = params.clubDimensions[dim] ?? 0.5;
        dimParts.push(val < 0.4 ? low.toLowerCase() : high.toLowerCase());
      }
      if (dimParts.length > 0) {
        const label = dimParts.slice(0, 2).join(" and ");
        if (score >= 60) {
          reasons.push(`Club prefers ${label} reads — like you.`);
        } else {
          reasons.push(`Shares some ${label} reading preferences.`);
        }
      }
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
```

- [ ] **Step 4: Add `score` to `generateBookMatchReasons` call in `user-to-book.ts`**

In `lib/matching/user-to-book.ts`, update the `generateBookMatchReasons` call (currently lines 62–72) to add `score`:

```typescript
  const reasons = generateBookMatchReasons({
    sharedGenres,
    authorLiked,
    authorName: book.author,
    dimensionSimilarity: dimSimilarity,
    sharedDimensions: alignedDims,
    bookDimensions: book.dimensions,
    userDimensions: user.dimensions,
    triggerBooks,
    score,
  });
```

- [ ] **Step 5: Add `score` to `generateUserMatchReasons` call in `user-to-user.ts`**

In `lib/matching/user-to-user.ts`, update the `generateUserMatchReasons` call (currently lines 91–99) to add `score`:

```typescript
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
```

- [ ] **Step 6: Add `score` to `generateClubMatchReasons` call in `user-to-club.ts`**

In `lib/matching/user-to-club.ts`, update the `generateClubMatchReasons` call (currently lines 63–70) to add `score`:

```typescript
  const reasons = generateClubMatchReasons({
    sharedGenres,
    memberCompatibilityAvg: avgMemberScore / 100,
    strongMatchCount,
    clubDimensions: club.dimensions,
    sharedDimensions: alignedDims,
    memberCount,
    score,
  });
```

- [ ] **Step 7: Run all tests**

```bash
cd /Users/connor/Documents/bookclub && npx jest --no-coverage 2>&1
```

Expected: all tests pass. The new `reasons.test.ts` tests should now pass. The existing `user-to-book.test.ts` trigger-book tests still pass because priority order is preserved.

- [ ] **Step 8: Commit**

```bash
cd /Users/connor/Documents/bookclub && git add lib/matching/reasons.ts lib/matching/user-to-book.ts lib/matching/user-to-user.ts lib/matching/user-to-club.ts __tests__/matching/reasons.test.ts && git commit -m "feat: add confidence-aware phrasing and max-2 reason discipline"
```

---

### Task 2: `isExploratory` flag and exploratory explanation differentiation

**Files:**
- Modify: `lib/matching/cache.ts` (types + import + tagging)

- [ ] **Step 1: Add `isExploratory?: true` to `ScoredUser`, `ScoredBook`, `ScoredClub` in `cache.ts`**

In `lib/matching/cache.ts`, update the three exported types (currently lines 37–51):

```typescript
export type ScoredUser = {
  user: { id: string; name: string | null; username: string | null; avatar: string | null };
  match: MatchOutput;
  isExploratory?: true;
};

export type ScoredBook = {
  book: { id: string; title: string; author: string; cover: string | null; genres: string[] };
  match: MatchOutput;
  isExploratory?: true;
};

export type ScoredClub = {
  club: { id: string; name: string; avatar: string | null; genres: string[]; _count: { members: number } };
  match: MatchOutput;
  isExploratory?: true;
};
```

- [ ] **Step 2: Add `generateExploratoryReason` to the import from `./reasons`**

At the top of `lib/matching/cache.ts`, add a new import line after the existing imports:

```typescript
import { generateExploratoryReason } from "./reasons";
```

- [ ] **Step 3: Tag exploratory items and override their reasons**

In `lib/matching/cache.ts`, update each of the three `selectExploratory` blocks to add `.map()` tagging after the closing `)` of each `selectExploratory` call. Each final block should look like this:

**exploratoryUsers:**
```typescript
  const exploratoryUsers = topGenreSet.size > 0
    ? selectExploratory(
        adjustedUserScores,
        (r) => ({
          score: r.match.score,
          genres: [],
          sharedGenres: r.match.sharedGenres,
          sharedDimensions: r.match.sharedTasteDimensions,
          sharedThemes: r.match.sharedThemes,
        }),
        explorationCtx,
        1
      ).map((r) => ({
        ...r,
        isExploratory: true as const,
        match: {
          ...r.match,
          matchReasons: [generateExploratoryReason(r.match.sharedTasteDimensions, r.match.sharedThemes)],
        },
      }))
    : [];
```

**exploratoryBooks:**
```typescript
  const exploratoryBooks = topGenreSet.size > 0
    ? selectExploratory(
        adjustedBookScores,
        (r) => ({
          score: r.match.score,
          genres: r.book.genres,
          sharedGenres: r.match.sharedGenres,
          sharedDimensions: r.match.sharedTasteDimensions,
          sharedThemes: r.match.sharedThemes,
        }),
        explorationCtx,
        1
      ).map((r) => ({
        ...r,
        isExploratory: true as const,
        match: {
          ...r.match,
          matchReasons: [generateExploratoryReason(r.match.sharedTasteDimensions, r.match.sharedThemes)],
        },
      }))
    : [];
```

**exploratoryClubs:**
```typescript
  const exploratoryClubs = topGenreSet.size > 0
    ? selectExploratory(
        adjustedClubScores,
        (r) => ({
          score: r.match.score,
          genres: r.club.genres,
          sharedGenres: r.match.sharedGenres,
          sharedDimensions: r.match.sharedTasteDimensions,
          sharedThemes: r.match.sharedThemes,
        }),
        explorationCtx,
        1
      ).map((r) => ({
        ...r,
        isExploratory: true as const,
        match: {
          ...r.match,
          matchReasons: [generateExploratoryReason(r.match.sharedTasteDimensions, r.match.sharedThemes)],
        },
      }))
    : [];
```

- [ ] **Step 4: Run TypeScript check**

```bash
cd /Users/connor/Documents/bookclub && npx tsc --noEmit 2>&1
```

Expected: 0 errors.

- [ ] **Step 5: Run all tests**

```bash
cd /Users/connor/Documents/bookclub && npx jest --no-coverage 2>&1
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/connor/Documents/bookclub && git add lib/matching/cache.ts && git commit -m "feat: add isExploratory flag and differentiated exploratory explanations"
```

---

### Task 3: Validate and final commit

**Files:** No new files — validation only.

- [ ] **Step 1: TypeScript check**

```bash
cd /Users/connor/Documents/bookclub && npx tsc --noEmit 2>&1
```

Expected: 0 errors.

- [ ] **Step 2: Full test suite**

```bash
cd /Users/connor/Documents/bookclub && npx jest --no-coverage 2>&1
```

Expected: all tests pass (should be 58+ total with new reasons tests).

- [ ] **Step 3: Build**

```bash
cd /Users/connor/Documents/bookclub && npm run build 2>&1
```

Expected: clean build.

- [ ] **Step 4: Final commit**

Only needed if there are uncommitted changes. If Tasks 1 and 2 commits cover everything, skip:

```bash
git status
```

If nothing to commit, report done. If uncommitted fixups exist:

```bash
git add -p && git commit -m "feat: refine recommendation explanations and add confidence-aware phrasing"
```
