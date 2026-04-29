# Phase 10: Perceived Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make recommendations feel more intelligent via signal-based "Because you liked..." reasons and controlled adjacent-genre exploration.

**Architecture:** Two focused changes: (1) `generateBookMatchReasons` gains an optional `triggerBooks` param emitting a "Because you loved…" opener; `calculateUserToBookMatch` derives the trigger book from the user's rated books. (2) A new `lib/matching/exploration.ts` module encapsulates eligibility logic; `cache.ts` delegates to it with stricter rules (score ≥ 45, adjacent, not disliked, limit 1).

**Tech Stack:** TypeScript, Jest, no new dependencies.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `lib/matching/reasons.ts` | Add `triggerBooks?` param to `generateBookMatchReasons` |
| Modify | `lib/matching/user-to-book.ts` | Compute trigger book and pass to reasons generator |
| Modify | `__tests__/matching/user-to-book.test.ts` | Add trigger-book and reasons tests |
| Create | `lib/matching/exploration.ts` | `isExploratoryEligible` + `selectExploratory` |
| Create | `__tests__/matching/exploration.test.ts` | Adjacency, disliked-exclusion, dominance tests |
| Modify | `lib/matching/cache.ts` | Use `selectExploratory`, set score ≥ 45, limit 1 |

---

### Task 1: Signal-based book recommendation reasons

**Files:**
- Modify: `lib/matching/reasons.ts:56-86`
- Modify: `lib/matching/user-to-book.ts:55-63`
- Modify: `__tests__/matching/user-to-book.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `__tests__/matching/user-to-book.test.ts`:

```typescript
test("trigger book appears as first reason when user rated a book in the same genre highly", () => {
  const userWithHistory: UserTasteSnapshot = {
    ...fantasyUser,
    ratedBooks: [
      { bookId: "b1", title: "Six of Crows", rating: 5, genres: ["Fantasy"], authors: ["Leigh Bardugo"] },
    ],
  };
  const result = calculateUserToBookMatch(userWithHistory, fantasyBook);
  expect(result.matchReasons[0]).toMatch(/Because you loved Six of Crows/);
});

test("no trigger book reason when user has no high-rated books in shared genre", () => {
  const userNoHistory: UserTasteSnapshot = {
    ...fantasyUser,
    ratedBooks: [],
  };
  const result = calculateUserToBookMatch(userNoHistory, fantasyBook);
  expect(result.matchReasons[0]).not.toMatch(/Because you loved/);
});

test("trigger book uses highest-rated shared-genre book, not just first", () => {
  const userWithHistory: UserTasteSnapshot = {
    ...fantasyUser,
    ratedBooks: [
      { bookId: "b10", title: "A Lesser Book", rating: 4, genres: ["Fantasy"], authors: ["Someone"] },
      { bookId: "b11", title: "The Kingkiller Chronicle", rating: 5, genres: ["Fantasy"], authors: ["Rothfuss"] },
    ],
  };
  const result = calculateUserToBookMatch(userWithHistory, fantasyBook);
  expect(result.matchReasons[0]).toMatch(/The Kingkiller Chronicle/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/matching/user-to-book.test.ts --no-coverage
```

Expected: 2–3 failures with "expected '...' to match /Because you loved .../"

- [ ] **Step 3: Add `triggerBooks?` param to `generateBookMatchReasons`**

In `lib/matching/reasons.ts`, replace the `generateBookMatchReasons` function signature and body:

```typescript
export function generateBookMatchReasons(params: {
  sharedGenres: string[];
  authorLiked: boolean;
  authorName: string;
  dimensionSimilarity: number;
  sharedDimensions: Array<keyof TasteDimensions>;
  bookDimensions: Partial<TasteDimensions>;
  userDimensions: Partial<TasteDimensions>;
  triggerBooks?: string[];
}): string[] {
  const reasons: string[] = [];

  if (params.triggerBooks && params.triggerBooks.length > 0) {
    reasons.push(`Because you loved ${params.triggerBooks[0]}.`);
  }

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
```

- [ ] **Step 4: Compute trigger book in `calculateUserToBookMatch`**

In `lib/matching/user-to-book.ts`, after the `sharedGenres` computation (line 32), add:

```typescript
const triggerBooks = user.ratedBooks
  .filter((rb) => rb.rating >= 4 && rb.genres.some((g) => sharedGenres.includes(g)))
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 1)
  .map((rb) => rb.title);
```

Then pass it into the `generateBookMatchReasons` call:

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
});
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest __tests__/matching/user-to-book.test.ts --no-coverage
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add lib/matching/reasons.ts lib/matching/user-to-book.ts __tests__/matching/user-to-book.test.ts
git commit -m "feat: add signal-based 'Because you loved...' book recommendation reasons"
```

---

### Task 2: Controlled adjacent-genre exploration module

**Files:**
- Create: `lib/matching/exploration.ts`
- Create: `__tests__/matching/exploration.test.ts`
- Modify: `lib/matching/cache.ts:204-229`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/matching/exploration.test.ts`:

```typescript
import { isExploratoryEligible, selectExploratory, ExplorationContext, ExplorationCandidate } from "@/lib/matching/exploration";

const ctx: ExplorationContext = {
  topGenreSet: new Set(["Fantasy", "Dark Academia"]),
  dislikedGenreSet: new Set(["Romance"]),
  minScore: 45,
};

const adjacentCandidate: ExplorationCandidate = {
  score: 50,
  genres: ["Science Fiction"],
  sharedGenres: [],
  sharedDimensions: ["tone"],
  sharedThemes: [],
};

const belowScoreCandidate: ExplorationCandidate = {
  score: 44,
  genres: ["Science Fiction"],
  sharedGenres: [],
  sharedDimensions: ["tone"],
  sharedThemes: [],
};

const dislikedGenreCandidate: ExplorationCandidate = {
  score: 70,
  genres: ["Romance"],
  sharedGenres: [],
  sharedDimensions: ["tone"],
  sharedThemes: [],
};

const notAdjacentCandidate: ExplorationCandidate = {
  score: 60,
  genres: ["Science Fiction"],
  sharedGenres: [],
  sharedDimensions: [],
  sharedThemes: [],
};

const inTopGenresCandidate: ExplorationCandidate = {
  score: 60,
  genres: ["Fantasy"],
  sharedGenres: ["Fantasy"],
  sharedDimensions: ["tone"],
  sharedThemes: [],
};

test("eligible: outside top genres, above minScore, adjacent by dimension", () => {
  expect(isExploratoryEligible(adjacentCandidate, ctx)).toBe(true);
});

test("ineligible: score below minScore", () => {
  expect(isExploratoryEligible(belowScoreCandidate, ctx)).toBe(false);
});

test("ineligible: genre is in dislikedGenreSet", () => {
  expect(isExploratoryEligible(dislikedGenreCandidate, ctx)).toBe(false);
});

test("ineligible: outside top genres but no adjacency signal", () => {
  expect(isExploratoryEligible(notAdjacentCandidate, ctx)).toBe(false);
});

test("ineligible: genre is in topGenreSet (not exploratory)", () => {
  expect(isExploratoryEligible(inTopGenresCandidate, ctx)).toBe(false);
});

test("eligible: adjacent by shared theme", () => {
  const themeAdjacent: ExplorationCandidate = {
    score: 55,
    genres: ["Historical Fiction"],
    sharedGenres: [],
    sharedDimensions: [],
    sharedThemes: ["magic"],
  };
  expect(isExploratoryEligible(themeAdjacent, ctx)).toBe(true);
});

test("selectExploratory returns at most `limit` items", () => {
  type Item = { score: number; genres: string[]; dims: string[] };
  const items: Item[] = [
    { score: 55, genres: ["Sci-Fi"], dims: ["tone"] },
    { score: 60, genres: ["Horror"], dims: ["tone"] },
    { score: 70, genres: ["Mystery"], dims: ["tone"] },
  ];
  const results = selectExploratory(
    items,
    (item) => ({
      score: item.score,
      genres: item.genres,
      sharedGenres: [],
      sharedDimensions: item.dims as Array<"tone">,
      sharedThemes: [],
    }),
    ctx,
    1
  );
  expect(results.length).toBe(1);
});

test("selectExploratory excludes ineligible items", () => {
  type Item = { score: number; genres: string[]; dims: string[] };
  const items: Item[] = [
    { score: 30, genres: ["Sci-Fi"], dims: ["tone"] },       // below minScore
    { score: 60, genres: ["Romance"], dims: ["tone"] },      // disliked
    { score: 50, genres: ["Horror"], dims: [] },             // no adjacency
  ];
  const results = selectExploratory(
    items,
    (item) => ({
      score: item.score,
      genres: item.genres,
      sharedGenres: [],
      sharedDimensions: item.dims as Array<"tone">,
      sharedThemes: [],
    }),
    ctx,
    2
  );
  expect(results.length).toBe(0);
});

test("normal items dominate: exploratory never exceeds limit per section", () => {
  type Item = { score: number; genres: string[]; dims: string[] };
  const manyEligible: Item[] = Array.from({ length: 10 }, (_, i) => ({
    score: 50 + i,
    genres: ["Sci-Fi"],
    dims: ["tone"],
  }));
  const results = selectExploratory(
    manyEligible,
    (item) => ({
      score: item.score,
      genres: item.genres,
      sharedGenres: [],
      sharedDimensions: item.dims as Array<"tone">,
      sharedThemes: [],
    }),
    ctx,
    1
  );
  expect(results.length).toBe(1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/matching/exploration.test.ts --no-coverage
```

Expected: module-not-found errors for `@/lib/matching/exploration`

- [ ] **Step 3: Create `lib/matching/exploration.ts`**

```typescript
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

  const isOutsideTopGenres = candidate.genres.length > 0 &&
    candidate.genres.every((g) => !ctx.topGenreSet.has(g)) &&
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/matching/exploration.test.ts --no-coverage
```

Expected: all tests pass

- [ ] **Step 5: Update `lib/matching/cache.ts` to use `selectExploratory`**

Add the import at the top of `lib/matching/cache.ts` (after existing imports):

```typescript
import { selectExploratory, ExplorationContext } from "./exploration";
```

Replace the three exploratory blocks (lines ~204–229) with:

```typescript
  const explorationCtx: ExplorationContext = {
    topGenreSet,
    dislikedGenreSet: new Set(mySnapshot.dislikedGenres),
    minScore: 45,
  };

  const exploratoryUsers = topGenreSet.size > 0
    ? selectExploratory(
        adjustedUserScores,
        (r) => ({
          score: r.match.score,
          genres: [],
          sharedGenres: r.match.sharedGenres,
          sharedDimensions: r.match.sharedTasteDimensions as Array<keyof import("./types").TasteDimensions>,
          sharedThemes: r.match.sharedThemes,
        }),
        explorationCtx,
        1
      )
    : [];

  const exploratoryBooks = topGenreSet.size > 0
    ? selectExploratory(
        adjustedBookScores,
        (r) => ({
          score: r.match.score,
          genres: r.book.genres,
          sharedGenres: r.match.sharedGenres,
          sharedDimensions: r.match.sharedTasteDimensions as Array<keyof import("./types").TasteDimensions>,
          sharedThemes: r.match.sharedThemes,
        }),
        explorationCtx,
        1
      )
    : [];

  const exploratoryClubs = topGenreSet.size > 0
    ? selectExploratory(
        adjustedClubScores,
        (r) => ({
          score: r.match.score,
          genres: r.club.genres,
          sharedGenres: r.match.sharedGenres,
          sharedDimensions: r.match.sharedTasteDimensions as Array<keyof import("./types").TasteDimensions>,
          sharedThemes: r.match.sharedThemes,
        }),
        explorationCtx,
        1
      )
    : [];
```

> **Note on user exploration:** Users don't have genres directly. Pass `genres: []` and rely on adjacency via `sharedDimensions`/`sharedThemes`. `isOutsideTopGenres` short-circuits to `true` when `genres` is empty (no genres to be inside top genres), so adjacency alone determines eligibility. This is correct for person-to-person exploration.

Actually the above note reveals a bug — `genres.length > 0` check would make users with `genres: []` ineligible. Fix `isExploratoryEligible` to handle the user case by allowing an empty genres array to pass the "outside top genres" check:

```typescript
  const isOutsideTopGenres =
    candidate.genres.length === 0
      ? true  // no genre info — rely on adjacency only
      : candidate.genres.every((g) => !ctx.topGenreSet.has(g)) &&
        candidate.sharedGenres.length === 0;
```

Update the full `isExploratoryEligible` function in `lib/matching/exploration.ts`:

```typescript
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
```

- [ ] **Step 6: Run all matching tests**

```bash
npx jest __tests__/matching/ --no-coverage
```

Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add lib/matching/exploration.ts __tests__/matching/exploration.test.ts lib/matching/cache.ts
git commit -m "feat: add controlled adjacent-genre exploration (score ≥ 45, adjacency-gated, limit 1)"
```

---

### Task 3: Validate and final commit

**Files:** No new files — validation only.

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors (pre-existing warnings about implicit-any in scoring lambdas are acceptable if they were pre-existing before this phase)

- [ ] **Step 2: Full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: build completes without errors

- [ ] **Step 4: Final commit**

```bash
git add -p  # stage any final fixups
git commit -m "feat: add intelligent exploration and signal-based recommendation reasons"
```

If there are no uncommitted changes after Task 1 and Task 2 commits, skip this step.
