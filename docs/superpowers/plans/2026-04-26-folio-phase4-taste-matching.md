# Folio Phase 4: Taste Matching Engine & Taste Profile UI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core taste matching engine (4 match types), the taste profile calculator, and the taste profile UI page visible on user profiles.

**Architecture:** All matching logic lives in `lib/matching/`. Pure functions — no side effects. Each function returns a `MatchOutput` object with score, confidence, reasons, and signals. Taste profile is calculated from UserBook history + onboarding data.

**Tech Stack:** TypeScript pure functions, Prisma for data access, Next.js server components for display, no external ML libraries.

**Prerequisite:** Phase 1–3 complete.

---

## File Map

| File | Purpose |
|------|---------|
| `lib/matching/types.ts` | Shared types for all matching functions |
| `lib/matching/dimensions.ts` | Dimension comparison helpers |
| `lib/matching/reasons.ts` | Human-readable reason generators |
| `lib/matching/user-to-user.ts` | User ↔ User match algorithm |
| `lib/matching/user-to-book.ts` | User ↔ Book match algorithm |
| `lib/matching/user-to-club.ts` | User ↔ Club match algorithm |
| `lib/matching/club-to-book.ts` | Club ↔ Book match algorithm |
| `lib/taste/profile.ts` | Calculate/update a user's taste profile |
| `lib/taste/clusters.ts` | Assign users to taste clusters |
| `app/api/match/users/route.ts` | GET user-to-user matches |
| `app/api/match/books/route.ts` | GET user-to-book matches |
| `app/api/match/clubs/route.ts` | GET user-to-club matches |
| `app/(app)/profile/[id]/page.tsx` | User profile with taste profile |
| `components/taste/taste-profile-card.tsx` | Taste dimensions visualisation |
| `components/taste/match-badge.tsx` | Compact match score badge |
| `components/taste/match-card.tsx` | User/club match card with reasons |
| `components/taste/dimension-bar.tsx` | Single dimension progress bar |

---

### Task 1: Matching types and dimension helpers

**Files:**
- Create: `lib/matching/types.ts`
- Create: `lib/matching/dimensions.ts`

- [ ] **Step 1: Create `lib/matching/types.ts`**

```typescript
export type MatchOutput = {
  score: number;               // 0-100
  confidence: "low" | "medium" | "high";
  matchReasons: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  sharedBooks: string[];
  sharedGenres: string[];
  sharedAuthors: string[];
  sharedThemes: string[];
  sharedTasteDimensions: string[];
};

export type TasteDimensions = {
  pace: number;
  tone: number;
  focus: number;
  emotionalIntensity: number;
  romanceLevel: number;
  complexity: number;
  worldbuildingDepth: number;
  discussionPotential: number;
};

export type UserTasteSnapshot = {
  userId: string;
  topGenres: string[];
  topAuthors: string[];
  topThemes: string[];
  dimensions: Partial<TasteDimensions>;
  dislikedGenres: string[];
  dislikedAuthors: string[];
  ratedBooks: Array<{ bookId: string; title: string; rating: number; genres: string[]; authors: string[] }>;
  confidence: "low" | "medium" | "high";
};

export const EMPTY_MATCH: MatchOutput = {
  score: 0,
  confidence: "low",
  matchReasons: [],
  positiveSignals: [],
  negativeSignals: [],
  sharedBooks: [],
  sharedGenres: [],
  sharedAuthors: [],
  sharedThemes: [],
  sharedTasteDimensions: [],
};

export const DIMENSION_NAMES: Record<keyof TasteDimensions, string> = {
  pace: "pace",
  tone: "tone",
  focus: "narrative focus",
  emotionalIntensity: "emotional intensity",
  romanceLevel: "romance",
  complexity: "complexity",
  worldbuildingDepth: "world-building",
  discussionPotential: "discussion potential",
};

export const DIMENSION_LABELS: Record<keyof TasteDimensions, [string, string]> = {
  pace: ["Slow-paced", "Fast-paced"],
  tone: ["Light-hearted", "Dark"],
  focus: ["Character-driven", "Plot-driven"],
  emotionalIntensity: ["Low intensity", "High intensity"],
  romanceLevel: ["No romance", "Romance-heavy"],
  complexity: ["Simple reads", "Complex reads"],
  worldbuildingDepth: ["Minimal world-building", "Deep world-building"],
  discussionPotential: ["Light read", "Great for discussion"],
};
```

- [ ] **Step 2: Create `lib/matching/dimensions.ts`**

```typescript
import { TasteDimensions } from "./types";

/** Similarity of two dimension values (0–1 scale). Returns 0–1. */
export function dimensionSimilarity(a: number, b: number): number {
  return 1 - Math.abs(a - b);
}

/** Average dimension similarity across all shared dimensions. Returns 0–1. */
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

/** Return dimension keys where both users are closely aligned (within 0.2). */
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

/** Determine confidence level based on data richness. */
export function computeConfidence(
  ratedBooksCount: number,
  sharedSignalsCount: number
): "low" | "medium" | "high" {
  if (ratedBooksCount >= 5 && sharedSignalsCount >= 3) return "high";
  if (ratedBooksCount >= 2 || sharedSignalsCount >= 2) return "medium";
  return "low";
}

/** Apply recency weighting. Recent items (within 90 days) get a 1.0–1.3x boost. */
export function recencyWeight(date: Date): number {
  const daysAgo = (Date.now() - date.getTime()) / 86400000;
  if (daysAgo < 30) return 1.3;
  if (daysAgo < 90) return 1.15;
  return 1.0;
}

/** Map a raw score (0–1 float) to a 0–100 integer with clamping. */
export function toScore(raw: number): number {
  return Math.round(Math.min(100, Math.max(0, raw * 100)));
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/matching/types.ts lib/matching/dimensions.ts
git commit -m "feat: taste matching types and dimension helpers"
```

---

### Task 2: Match reason generator

**Files:**
- Create: `lib/matching/reasons.ts`

- [ ] **Step 1: Create `lib/matching/reasons.ts`**

```typescript
import { DIMENSION_LABELS, TasteDimensions } from "./types";

/** Generate human-readable match reasons for user-to-user matches. */
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

  // Shared highly-rated books
  if (params.sharedBooks.length >= 2) {
    reasons.push(`You both rated ${params.sharedBooks.slice(0, 2).join(" and ")} highly.`);
    positiveSignals.push(...params.sharedBooks.slice(0, 3).map((b) => `Both loved: ${b}`));
  } else if (params.sharedBooks.length === 1) {
    reasons.push(`You both rated ${params.sharedBooks[0]} highly.`);
    positiveSignals.push(`Both loved: ${params.sharedBooks[0]}`);
  }

  // Shared genres
  if (params.sharedGenres.length >= 2) {
    reasons.push(`You both enjoy ${params.sharedGenres.slice(0, 2).join(" and ")}.`);
    positiveSignals.push(...params.sharedGenres.map((g) => `Shared genre: ${g}`));
  } else if (params.sharedGenres.length === 1) {
    reasons.push(`You share a love of ${params.sharedGenres[0]}.`);
  }

  // Shared authors
  if (params.sharedAuthors.length >= 2) {
    reasons.push(`You both love ${params.sharedAuthors.slice(0, 2).join(" and ")}'s writing.`);
    positiveSignals.push(...params.sharedAuthors.map((a) => `Shared author: ${a}`));
  } else if (params.sharedAuthors.length === 1) {
    reasons.push(`You both love ${params.sharedAuthors[0]}'s writing.`);
  }

  // Taste dimensions — generate natural language
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

  // Negative signals — shared genre avoidances can slightly bond readers
  if (params.negativeGenreOverlap.length > 0) {
    negativeSignals.push(...params.negativeGenreOverlap.map((g) => `Both avoid: ${g}`));
  }

  return { reasons: reasons.slice(0, 4), positiveSignals, negativeSignals };
}

/** Generate reasons for user-to-book matches. */
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

/** Generate reasons for user-to-club matches. */
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/matching/reasons.ts
git commit -m "feat: human-readable match reason generators"
```

---

### Task 3: User-to-user matching

**Files:**
- Create: `lib/matching/user-to-user.ts`

- [ ] **Step 1: Write a failing test for `calculateUserToUserMatch`**

Create `__tests__/matching/user-to-user.test.ts`:

```typescript
import { calculateUserToUserMatch } from "@/lib/matching/user-to-user";
import { UserTasteSnapshot } from "@/lib/matching/types";

const userA: UserTasteSnapshot = {
  userId: "a",
  topGenres: ["Fantasy", "Dark Academia"],
  topAuthors: ["Leigh Bardugo", "Olivie Blake"],
  topThemes: ["magic", "academia"],
  dimensions: { pace: 0.55, tone: 0.72, focus: 0.72, complexity: 0.78 },
  dislikedGenres: ["Romance"],
  dislikedAuthors: [],
  ratedBooks: [
    { bookId: "b1", title: "Six of Crows", rating: 5, genres: ["Fantasy"], authors: ["Leigh Bardugo"] },
    { bookId: "b2", title: "The Atlas Six", rating: 5, genres: ["Dark Academia"], authors: ["Olivie Blake"] },
  ],
  confidence: "high",
};

const userB: UserTasteSnapshot = {
  userId: "b",
  topGenres: ["Dark Academia", "Mystery"],
  topAuthors: ["Olivie Blake", "Susanna Clarke"],
  topThemes: ["academia", "secrets"],
  dimensions: { pace: 0.46, tone: 0.82, focus: 0.72, complexity: 0.78 },
  dislikedGenres: ["Romance"],
  dislikedAuthors: [],
  ratedBooks: [
    { bookId: "b2", title: "The Atlas Six", rating: 5, genres: ["Dark Academia"], authors: ["Olivie Blake"] },
    { bookId: "b3", title: "Mexican Gothic", rating: 5, genres: ["Gothic Horror"], authors: ["Silvia Moreno-Garcia"] },
  ],
  confidence: "high",
};

test("high overlap produces a score above 70", () => {
  const result = calculateUserToUserMatch(userA, userB);
  expect(result.score).toBeGreaterThan(70);
  expect(result.confidence).toBe("high");
});

test("shared books are in the output", () => {
  const result = calculateUserToUserMatch(userA, userB);
  expect(result.sharedBooks).toContain("The Atlas Six");
});

test("shared genres are in the output", () => {
  const result = calculateUserToUserMatch(userA, userB);
  expect(result.sharedGenres).toContain("Dark Academia");
});

test("match reasons are non-empty strings", () => {
  const result = calculateUserToUserMatch(userA, userB);
  expect(result.matchReasons.length).toBeGreaterThan(0);
  result.matchReasons.forEach((r) => expect(typeof r).toBe("string"));
});

test("mismatched users produce a low score", () => {
  const unrelated: UserTasteSnapshot = {
    userId: "c",
    topGenres: ["Romance"],
    topAuthors: ["Emily Henry"],
    topThemes: ["love"],
    dimensions: { pace: 0.6, tone: 0.2, romanceLevel: 0.9 },
    dislikedGenres: ["Dark Academia"],
    dislikedAuthors: [],
    ratedBooks: [{ bookId: "b4", title: "Beach Read", rating: 5, genres: ["Romance"], authors: ["Emily Henry"] }],
    confidence: "high",
  };
  const result = calculateUserToUserMatch(userA, unrelated);
  expect(result.score).toBeLessThan(50);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/matching/user-to-user.test.ts 2>&1 | head -20
```

Expected: FAIL — `Cannot find module '@/lib/matching/user-to-user'`

- [ ] **Step 3: Create `lib/matching/user-to-user.ts`**

```typescript
import { MatchOutput, UserTasteSnapshot, EMPTY_MATCH } from "./types";
import { overallDimensionSimilarity, sharedDimensions, computeConfidence, toScore } from "./dimensions";
import { generateUserMatchReasons } from "./reasons";

export function calculateUserToUserMatch(
  userA: UserTasteSnapshot,
  userB: UserTasteSnapshot
): MatchOutput {
  if (userA.userId === userB.userId) return EMPTY_MATCH;

  // ── Book overlap ──────────────────────────────────────────────────────────
  const aHighRated = new Map(userA.ratedBooks.filter((b) => b.rating >= 4).map((b) => [b.bookId, b]));
  const bHighRated = new Map(userB.ratedBooks.filter((b) => b.rating >= 4).map((b) => [b.bookId, b]));

  const sharedBookIds = [...aHighRated.keys()].filter((id) => bHighRated.has(id));
  const sharedBookTitles = sharedBookIds.map((id) => aHighRated.get(id)!.title);

  // ── Negative overlap (both gave 1-2 stars) ────────────────────────────────
  const aDisliked = new Set(userA.ratedBooks.filter((b) => b.rating <= 2).map((b) => b.bookId));
  const bDisliked = new Set(userB.ratedBooks.filter((b) => b.rating <= 2).map((b) => b.bookId));
  const sharedDislikes = [...aDisliked].filter((id) => bDisliked.has(id));

  // ── Genre overlap ─────────────────────────────────────────────────────────
  const aGenres = new Set(userA.topGenres);
  const bGenres = new Set(userB.topGenres);
  const sharedGenres = [...aGenres].filter((g) => bGenres.has(g));

  // Penalise: A likes genre B dislikes
  const aLikesWhatBDislikes = userA.topGenres.filter((g) => userB.dislikedGenres.includes(g)).length;
  const bLikesWhatADislikes = userB.topGenres.filter((g) => userA.dislikedGenres.includes(g)).length;
  const negativePenalty = (aLikesWhatBDislikes + bLikesWhatADislikes) * 0.05;

  // Shared genre avoidances (small positive signal)
  const sharedDislikedGenres = userA.dislikedGenres.filter((g) => userB.dislikedGenres.includes(g));

  // ── Author overlap ────────────────────────────────────────────────────────
  const aAuthors = new Set(userA.topAuthors);
  const bAuthors = new Set(userB.topAuthors);
  const sharedAuthors = [...aAuthors].filter((a) => bAuthors.has(a));

  // ── Taste dimension similarity ─────────────────────────────────────────────
  const dimSimilarity = overallDimensionSimilarity(userA.dimensions, userB.dimensions);
  const alignedDimensions = sharedDimensions(userA.dimensions, userB.dimensions, 0.2);

  // ── Score calculation ──────────────────────────────────────────────────────
  // Weights: books 35%, genres 25%, authors 15%, dimensions 25%
  const bookScore = Math.min(1, (sharedBookIds.length * 0.2) + (sharedDislikes.length * 0.05));
  const genreScore = sharedGenres.length / Math.max(1, Math.min(aGenres.size, bGenres.size));
  const authorScore = sharedAuthors.length / Math.max(1, Math.min(aAuthors.size, bAuthors.size));

  const rawScore =
    bookScore * 0.35 +
    genreScore * 0.25 +
    authorScore * 0.15 +
    dimSimilarity * 0.25 -
    negativePenalty +
    sharedDislikedGenres.length * 0.02;

  const score = toScore(rawScore);

  // ── Confidence ────────────────────────────────────────────────────────────
  const totalBooks = (userA.ratedBooks.length + userB.ratedBooks.length) / 2;
  const totalShared = sharedBookIds.length + sharedGenres.length + sharedAuthors.length;
  const confidence = computeConfidence(totalBooks, totalShared);

  // ── Reasons ───────────────────────────────────────────────────────────────
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
```

- [ ] **Step 4: Install Jest and configure it**

```bash
npm install -D jest @types/jest ts-jest
```

Add to `package.json`:
```json
"jest": {
  "preset": "ts-jest",
  "testEnvironment": "node",
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/$1"
  }
}
```

- [ ] **Step 5: Run tests**

```bash
npx jest __tests__/matching/user-to-user.test.ts
```

Expected: PASS — all 5 tests green.

- [ ] **Step 6: Commit**

```bash
git add lib/matching/user-to-user.ts __tests__/matching/user-to-user.test.ts package.json
git commit -m "feat: user-to-user taste matching algorithm with tests"
```

---

### Task 4: User-to-book matching

**Files:**
- Create: `lib/matching/user-to-book.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/matching/user-to-book.test.ts`:

```typescript
import { calculateUserToBookMatch } from "@/lib/matching/user-to-book";
import { UserTasteSnapshot } from "@/lib/matching/types";

const fantasyUser: UserTasteSnapshot = {
  userId: "u1",
  topGenres: ["Fantasy", "Dark Academia"],
  topAuthors: ["Leigh Bardugo"],
  topThemes: ["magic"],
  dimensions: { pace: 0.55, tone: 0.7, focus: 0.7, complexity: 0.8, worldbuildingDepth: 0.8 },
  dislikedGenres: ["Romance"],
  dislikedAuthors: [],
  ratedBooks: [
    { bookId: "b1", title: "Six of Crows", rating: 5, genres: ["Fantasy"], authors: ["Leigh Bardugo"] },
  ],
  confidence: "high",
};

const fantasyBook = {
  bookId: "b2",
  title: "The Name of the Wind",
  author: "Patrick Rothfuss",
  genres: ["Fantasy", "Epic Fantasy"],
  tags: ["magic"],
  dimensions: { pace: 0.3, tone: 0.5, focus: 0.85, complexity: 0.85, worldbuildingDepth: 0.9 },
};

const romanceBook = {
  bookId: "b3",
  title: "Beach Read",
  author: "Emily Henry",
  genres: ["Romance", "Contemporary Romance"],
  tags: ["romance"],
  dimensions: { pace: 0.6, tone: 0.2, focus: 0.85, romanceLevel: 0.9, complexity: 0.2 },
};

test("fantasy user matches fantasy book well", () => {
  const result = calculateUserToBookMatch(fantasyUser, fantasyBook);
  expect(result.score).toBeGreaterThan(60);
});

test("fantasy user does not match disliked genre book", () => {
  const result = calculateUserToBookMatch(fantasyUser, romanceBook);
  expect(result.score).toBeLessThan(50);
});

test("match has reasons", () => {
  const result = calculateUserToBookMatch(fantasyUser, fantasyBook);
  expect(result.matchReasons.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npx jest __tests__/matching/user-to-book.test.ts 2>&1 | head -5
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `lib/matching/user-to-book.ts`**

```typescript
import { MatchOutput, UserTasteSnapshot, TasteDimensions, EMPTY_MATCH } from "./types";
import { overallDimensionSimilarity, sharedDimensions, computeConfidence, toScore } from "./dimensions";
import { generateBookMatchReasons } from "./reasons";

type BookSnapshot = {
  bookId: string;
  title: string;
  author: string;
  genres: string[];
  tags: string[];
  dimensions: Partial<TasteDimensions>;
};

export function calculateUserToBookMatch(
  user: UserTasteSnapshot,
  book: BookSnapshot
): MatchOutput {
  // ── Dislike penalty ────────────────────────────────────────────────────────
  const dislikedGenreHit = book.genres.some((g) => user.dislikedGenres.includes(g));
  const dislikedAuthorHit = user.dislikedAuthors.includes(book.author);
  const dislikePenalty = (dislikedGenreHit ? 0.25 : 0) + (dislikedAuthorHit ? 0.2 : 0);

  // ── Already read? ─────────────────────────────────────────────────────────
  const alreadyRead = user.ratedBooks.find((b) => b.bookId === book.bookId);
  if (alreadyRead) {
    // Score based on their actual rating
    return {
      ...EMPTY_MATCH,
      score: alreadyRead.rating * 20,
      confidence: "high",
      matchReasons: [`You rated this book ${alreadyRead.rating} stars.`],
    };
  }

  // ── Genre match ────────────────────────────────────────────────────────────
  const sharedGenres = book.genres.filter((g) => user.topGenres.includes(g));
  const genreScore = sharedGenres.length / Math.max(1, user.topGenres.length);

  // ── Author affinity ────────────────────────────────────────────────────────
  const authorLiked = user.topAuthors.includes(book.author);
  const authorScore = authorLiked ? 0.8 : 0.3;

  // ── Dimension similarity ───────────────────────────────────────────────────
  const dimSimilarity = overallDimensionSimilarity(user.dimensions, book.dimensions);
  const alignedDims = sharedDimensions(user.dimensions, book.dimensions, 0.2);

  // ── Final score ────────────────────────────────────────────────────────────
  // Genres 35%, dimensions 40%, author 25%
  const rawScore =
    genreScore * 0.35 +
    dimSimilarity * 0.40 +
    authorScore * 0.25 -
    dislikePenalty;

  const score = toScore(rawScore);

  const confidence = computeConfidence(
    user.ratedBooks.length,
    sharedGenres.length + alignedDims.length
  );

  const reasons = generateBookMatchReasons({
    sharedGenres,
    authorLiked,
    authorName: book.author,
    dimensionSimilarity: dimSimilarity,
    sharedDimensions: alignedDims,
    bookDimensions: book.dimensions,
    userDimensions: user.dimensions,
  });

  return {
    score,
    confidence,
    matchReasons: reasons,
    positiveSignals: [
      ...sharedGenres.map((g) => `Matches genre: ${g}`),
      ...(authorLiked ? [`You enjoy ${book.author}'s writing`] : []),
    ],
    negativeSignals: [
      ...(dislikedGenreHit ? book.genres.filter((g) => user.dislikedGenres.includes(g)).map((g) => `You dislike: ${g}`) : []),
    ],
    sharedBooks: [],
    sharedGenres,
    sharedAuthors: authorLiked ? [book.author] : [],
    sharedThemes: book.tags.filter((t) => user.topThemes.includes(t)),
    sharedTasteDimensions: alignedDims,
  };
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest __tests__/matching/user-to-book.test.ts
```

Expected: PASS — 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/matching/user-to-book.ts __tests__/matching/user-to-book.test.ts
git commit -m "feat: user-to-book taste matching with dislike penalties"
```

---

### Task 5: User-to-club and club-to-book matching

**Files:**
- Create: `lib/matching/user-to-club.ts`
- Create: `lib/matching/club-to-book.ts`

- [ ] **Step 1: Create `lib/matching/user-to-club.ts`**

```typescript
import { MatchOutput, UserTasteSnapshot, TasteDimensions } from "./types";
import { overallDimensionSimilarity, sharedDimensions, toScore, computeConfidence } from "./dimensions";
import { calculateUserToUserMatch } from "./user-to-user";
import { generateClubMatchReasons } from "./reasons";

type ClubSnapshot = {
  clubId: string;
  genres: string[];
  themes: string[];
  dimensions: Partial<TasteDimensions>;
  memberSnapshots: UserTasteSnapshot[];
};

export function calculateUserToClubMatch(
  user: UserTasteSnapshot,
  club: ClubSnapshot
): MatchOutput {
  const memberCount = club.memberSnapshots.length;
  if (memberCount === 0) {
    // Fall back to genre/theme matching only
    const sharedGenres = club.genres.filter((g) => user.topGenres.includes(g));
    const genreScore = sharedGenres.length / Math.max(1, club.genres.length);
    return {
      score: toScore(genreScore * 0.7),
      confidence: "low",
      matchReasons: sharedGenres.length > 0
        ? [`The club reads ${sharedGenres.join(", ")}, which matches your taste.`]
        : ["Limited data — explore more to see match reasons."],
      positiveSignals: [],
      negativeSignals: [],
      sharedBooks: [],
      sharedGenres,
      sharedAuthors: [],
      sharedThemes: [],
      sharedTasteDimensions: [],
    };
  }

  // ── Member-to-member matches ───────────────────────────────────────────────
  const memberMatches = club.memberSnapshots.map((member) =>
    calculateUserToUserMatch(user, member)
  );

  const avgMemberScore = memberMatches.reduce((s, m) => s + m.score, 0) / memberCount;
  const strongMatchCount = memberMatches.filter((m) => m.score >= 70).length;

  // Shared genres with club
  const sharedGenres = club.genres.filter((g) => user.topGenres.includes(g));

  // Dimension similarity with club's aggregate
  const dimSimilarity = overallDimensionSimilarity(user.dimensions, club.dimensions);
  const alignedDims = sharedDimensions(user.dimensions, club.dimensions, 0.25);

  // Score: 50% avg member match, 30% genre, 20% dimensions
  const rawScore = (avgMemberScore / 100) * 0.50 + (sharedGenres.length / Math.max(1, club.genres.length)) * 0.30 + dimSimilarity * 0.20;
  const score = toScore(rawScore);

  const confidence = computeConfidence(
    memberCount,
    sharedGenres.length + alignedDims.length + strongMatchCount
  );

  const reasons = generateClubMatchReasons({
    sharedGenres,
    memberCompatibilityAvg: avgMemberScore / 100,
    strongMatchCount,
    clubDimensions: club.dimensions,
    sharedDimensions: alignedDims,
    memberCount,
  });

  // Aggregate shared signals from member matches
  const allSharedBooks = [...new Set(memberMatches.flatMap((m) => m.sharedBooks))];
  const allSharedAuthors = [...new Set(memberMatches.flatMap((m) => m.sharedAuthors))];

  return {
    score,
    confidence,
    matchReasons: reasons,
    positiveSignals: [
      `${strongMatchCount} strong member matches`,
      ...sharedGenres.map((g) => `Club reads: ${g}`),
    ],
    negativeSignals: [],
    sharedBooks: allSharedBooks,
    sharedGenres,
    sharedAuthors: allSharedAuthors,
    sharedThemes: club.themes.filter((t) => user.topThemes.includes(t)),
    sharedTasteDimensions: alignedDims,
  };
}
```

- [ ] **Step 2: Create `lib/matching/club-to-book.ts`**

```typescript
import { MatchOutput, TasteDimensions } from "./types";
import { overallDimensionSimilarity, sharedDimensions, toScore, computeConfidence } from "./dimensions";
import { UserTasteSnapshot } from "./types";
import { calculateUserToBookMatch } from "./user-to-book";

type BookSnapshot = {
  bookId: string;
  title: string;
  author: string;
  genres: string[];
  tags: string[];
  dimensions: Partial<TasteDimensions>;
};

type ClubSnapshot = {
  clubId: string;
  genres: string[];
  themes: string[];
  dimensions: Partial<TasteDimensions>;
  memberSnapshots: UserTasteSnapshot[];
};

export function calculateClubToBookMatch(
  club: ClubSnapshot,
  book: BookSnapshot
): MatchOutput & { memberLikelyToEnjoyPercent: number } {
  const memberCount = club.memberSnapshots.length;

  // How many members would enjoy this book?
  const memberBookMatches = club.memberSnapshots.map((m) => calculateUserToBookMatch(m, book));
  const avgMemberBookScore = memberCount > 0
    ? memberBookMatches.reduce((s, m) => s + m.score, 0) / memberCount
    : 50;
  const likelyToEnjoyCount = memberBookMatches.filter((m) => m.score >= 65).length;
  const likelyToEnjoyPercent = memberCount > 0 ? Math.round((likelyToEnjoyCount / memberCount) * 100) : 0;

  // Club genre vs book genre
  const sharedGenres = book.genres.filter((g) => club.genres.includes(g));
  const genreScore = sharedGenres.length / Math.max(1, club.genres.length);

  // Dimension alignment between club taste and book
  const dimSimilarity = overallDimensionSimilarity(club.dimensions, book.dimensions);
  const alignedDims = sharedDimensions(club.dimensions, book.dimensions, 0.2);

  // Score: 50% member avg, 30% genre, 20% dimensions
  const rawScore = (avgMemberBookScore / 100) * 0.50 + genreScore * 0.30 + dimSimilarity * 0.20;
  const score = toScore(rawScore);

  const confidence = computeConfidence(memberCount, sharedGenres.length + alignedDims.length);

  const reasons: string[] = [];
  if (likelyToEnjoyPercent >= 70) reasons.push(`${likelyToEnjoyPercent}% of members would enjoy this book.`);
  if (sharedGenres.length > 0) reasons.push(`Matches club's ${sharedGenres.join(" and ")} taste.`);
  if (alignedDims.length > 0) reasons.push(`Fits the club's preferred reading style.`);

  return {
    score,
    confidence,
    matchReasons: reasons.slice(0, 3),
    positiveSignals: [
      `${likelyToEnjoyCount} / ${memberCount} members likely to enjoy`,
      ...sharedGenres.map((g) => `Club reads ${g}`),
    ],
    negativeSignals: [],
    sharedBooks: [],
    sharedGenres,
    sharedAuthors: [],
    sharedThemes: book.tags.filter((t) => club.themes.includes(t)),
    sharedTasteDimensions: alignedDims,
    memberLikelyToEnjoyPercent: likelyToEnjoyPercent,
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/matching/user-to-club.ts lib/matching/club-to-book.ts
git commit -m "feat: user-to-club and club-to-book matching algorithms"
```

---

### Task 6: Taste profile calculator

**Files:**
- Create: `lib/taste/profile.ts`

- [ ] **Step 1: Create `lib/taste/profile.ts`**

```typescript
import { db } from "@/lib/db";
import { UserTasteSnapshot, TasteDimensions } from "@/lib/matching/types";

/** Build a UserTasteSnapshot from the database for a given userId. */
export async function buildUserTasteSnapshot(userId: string): Promise<UserTasteSnapshot> {
  const [userBooks, tasteProfile, onboardingData] = await Promise.all([
    db.userBook.findMany({
      where: { userId, NOT: { rating: null } },
      include: { book: { include: { tasteDimensions: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.tasteProfile.findUnique({ where: { userId } }),
    db.onboardingData.findUnique({ where: { userId } }),
  ]);

  // Build rated books list
  const ratedBooks = userBooks
    .filter((ub) => ub.rating !== null)
    .map((ub) => ({
      bookId: ub.bookId,
      title: ub.book.title,
      rating: ub.rating!,
      genres: ub.book.genres,
      authors: ub.book.authors,
    }));

  // Derive top genres from rated books (weight by rating)
  const genreWeights = new Map<string, number>();
  const authorWeights = new Map<string, number>();

  for (const ub of userBooks) {
    if (!ub.rating) continue;
    const weight = ub.rating >= 4 ? ub.rating : ub.rating <= 2 ? -1 : 0;

    for (const genre of ub.book.genres) {
      genreWeights.set(genre, (genreWeights.get(genre) ?? 0) + weight);
    }
    for (const author of ub.book.authors) {
      authorWeights.set(author, (authorWeights.get(author) ?? 0) + weight);
    }
  }

  const topGenres = [...genreWeights.entries()]
    .filter(([, w]) => w > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([g]) => g);

  const dislikedGenres = [...genreWeights.entries()]
    .filter(([, w]) => w < 0)
    .map(([g]) => g);

  const topAuthors = [...authorWeights.entries()]
    .filter(([, w]) => w > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([a]) => a);

  // Compute aggregate taste dimensions from rated books (weight by rating)
  const dimSums: Record<keyof TasteDimensions, number> = {
    pace: 0, tone: 0, focus: 0, emotionalIntensity: 0,
    romanceLevel: 0, complexity: 0, worldbuildingDepth: 0, discussionPotential: 0,
  };
  const dimCounts: Record<keyof TasteDimensions, number> = { ...dimSums };

  for (const ub of userBooks) {
    if (!ub.rating || !ub.book.tasteDimensions) continue;
    if (ub.rating < 3) continue; // only use 3+ star books for dimension profiling
    const dims = ub.book.tasteDimensions;
    const weight = ub.rating >= 4 ? 2 : 1;

    for (const key of Object.keys(dimSums) as Array<keyof TasteDimensions>) {
      const val = dims[key];
      if (val !== null && val !== undefined) {
        dimSums[key] += val * weight;
        dimCounts[key] += weight;
      }
    }
  }

  const computedDimensions: Partial<TasteDimensions> = {};
  for (const key of Object.keys(dimSums) as Array<keyof TasteDimensions>) {
    if (dimCounts[key] > 0) {
      computedDimensions[key] = dimSums[key] / dimCounts[key];
    }
  }

  // Merge with taste profile (DB) and onboarding data for cold-start users
  const mergedDimensions = {
    ...computedDimensions,
    ...(tasteProfile ? {
      pace: tasteProfile.pace ?? computedDimensions.pace,
      tone: tasteProfile.tone ?? computedDimensions.tone,
      focus: tasteProfile.focus ?? computedDimensions.focus,
      emotionalIntensity: tasteProfile.emotionalIntensity ?? computedDimensions.emotionalIntensity,
      romanceLevel: tasteProfile.romanceLevel ?? computedDimensions.romanceLevel,
      complexity: tasteProfile.complexity ?? computedDimensions.complexity,
      worldbuildingDepth: tasteProfile.worldbuildingDepth ?? computedDimensions.worldbuildingDepth,
      discussionPotential: tasteProfile.discussionPotential ?? computedDimensions.discussionPotential,
    } : {}),
  };

  // Cold start: use onboarding genres/authors if no history
  const finalGenres = topGenres.length > 0 ? topGenres : (onboardingData?.favoriteGenres ?? tasteProfile?.topGenres ?? []);
  const finalAuthors = topAuthors.length > 0 ? topAuthors : (onboardingData?.favoriteAuthors ?? tasteProfile?.topAuthors ?? []);
  const finalDisliked = dislikedGenres.length > 0 ? dislikedGenres : (tasteProfile?.dislikedGenres ?? []);

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
}

/** Persist the latest taste snapshot back to TasteProfile table. */
export async function saveTasteProfile(snapshot: UserTasteSnapshot): Promise<void> {
  await db.tasteProfile.upsert({
    where: { userId: snapshot.userId },
    update: {
      topGenres: snapshot.topGenres,
      topAuthors: snapshot.topAuthors,
      dislikedGenres: snapshot.dislikedGenres,
      dislikedAuthors: snapshot.dislikedAuthors,
      pace: snapshot.dimensions.pace,
      tone: snapshot.dimensions.tone,
      focus: snapshot.dimensions.focus,
      emotionalIntensity: snapshot.dimensions.emotionalIntensity,
      romanceLevel: snapshot.dimensions.romanceLevel,
      complexity: snapshot.dimensions.complexity,
      worldbuildingDepth: snapshot.dimensions.worldbuildingDepth,
      discussionPotential: snapshot.dimensions.discussionPotential,
      confidence: snapshot.confidence === "high" ? "HIGH" : snapshot.confidence === "medium" ? "MEDIUM" : "LOW",
      lastCalculated: new Date(),
    },
    create: {
      userId: snapshot.userId,
      topGenres: snapshot.topGenres,
      topAuthors: snapshot.topAuthors,
      topThemes: snapshot.topThemes,
      topMoods: [],
      dislikedGenres: snapshot.dislikedGenres,
      dislikedThemes: [],
      dislikedAuthors: snapshot.dislikedAuthors,
      pace: snapshot.dimensions.pace,
      tone: snapshot.dimensions.tone,
      focus: snapshot.dimensions.focus,
      emotionalIntensity: snapshot.dimensions.emotionalIntensity,
      romanceLevel: snapshot.dimensions.romanceLevel,
      complexity: snapshot.dimensions.complexity,
      worldbuildingDepth: snapshot.dimensions.worldbuildingDepth,
      discussionPotential: snapshot.dimensions.discussionPotential,
      confidence: snapshot.confidence === "high" ? "HIGH" : snapshot.confidence === "medium" ? "MEDIUM" : "LOW",
      lastCalculated: new Date(),
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/taste/profile.ts
git commit -m "feat: taste profile calculator from UserBook history"
```

---

### Task 7: Match API routes

**Files:**
- Create: `app/api/match/users/route.ts`
- Create: `app/api/match/books/route.ts`
- Create: `app/api/match/clubs/route.ts`

- [ ] **Step 1: Create `app/api/match/users/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { buildUserTasteSnapshot } from "@/lib/taste/profile";
import { calculateUserToUserMatch } from "@/lib/matching/user-to-user";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUserSnapshot = await buildUserTasteSnapshot(session.user.id);

  const otherUsers = await db.user.findMany({
    where: { id: { not: session.user.id }, onboarded: true },
    take: 20,
  });

  const matches = await Promise.all(
    otherUsers.map(async (u) => {
      const snapshot = await buildUserTasteSnapshot(u.id);
      const match = calculateUserToUserMatch(currentUserSnapshot, snapshot);
      return {
        user: { id: u.id, name: u.name, username: u.username, avatar: u.avatar, bio: u.bio },
        match,
      };
    })
  );

  const sorted = matches.sort((a, b) => b.match.score - a.match.score).slice(0, 10);
  return NextResponse.json(sorted);
}
```

- [ ] **Step 2: Create `app/api/match/books/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { buildUserTasteSnapshot } from "@/lib/taste/profile";
import { calculateUserToBookMatch } from "@/lib/matching/user-to-book";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userSnapshot = await buildUserTasteSnapshot(session.user.id);
  const readBookIds = new Set(userSnapshot.ratedBooks.map((b) => b.bookId));

  const allBooks = await db.book.findMany({
    where: { id: { notIn: [...readBookIds] } },
    include: { tasteDimensions: true },
  });

  const matches = allBooks.map((book) => ({
    book: { id: book.id, title: book.title, author: book.author, cover: book.cover, genres: book.genres, avgRating: book.avgRating },
    match: calculateUserToBookMatch(userSnapshot, {
      bookId: book.id,
      title: book.title,
      author: book.author,
      genres: book.genres,
      tags: book.tags,
      dimensions: book.tasteDimensions ?? {},
    }),
  }));

  const sorted = matches.sort((a, b) => b.match.score - a.match.score);
  return NextResponse.json(sorted);
}
```

- [ ] **Step 3: Create `app/api/match/clubs/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { buildUserTasteSnapshot } from "@/lib/taste/profile";
import { calculateUserToClubMatch } from "@/lib/matching/user-to-club";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userSnapshot = await buildUserTasteSnapshot(session.user.id);

  const clubs = await db.club.findMany({
    where: { visibility: "PUBLIC" },
    include: {
      members: { include: { user: true } },
      currentBook: true,
      _count: { select: { members: true } },
    },
    take: 20,
  });

  const matches = await Promise.all(
    clubs.map(async (club) => {
      const memberSnapshots = await Promise.all(
        club.members.slice(0, 10).map((m) => buildUserTasteSnapshot(m.userId))
      );

      const clubProfile = await db.tasteProfile.findFirst({
        where: { userId: { in: club.members.map((m) => m.userId) } },
      });

      const clubSnapshot = {
        clubId: club.id,
        genres: club.genres,
        themes: club.themes,
        dimensions: clubProfile ? {
          pace: clubProfile.pace ?? undefined,
          tone: clubProfile.tone ?? undefined,
          focus: clubProfile.focus ?? undefined,
          complexity: clubProfile.complexity ?? undefined,
          worldbuildingDepth: clubProfile.worldbuildingDepth ?? undefined,
          discussionPotential: clubProfile.discussionPotential ?? undefined,
        } : {},
        memberSnapshots,
      };

      const match = calculateUserToClubMatch(userSnapshot, clubSnapshot);

      return {
        club: {
          id: club.id,
          name: club.name,
          description: club.description,
          avatar: club.avatar,
          genres: club.genres,
          isOnline: club.isOnline,
          location: club.location,
          membershipType: club.membershipType,
          memberCount: club._count.members,
          currentBook: club.currentBook,
        },
        match,
      };
    })
  );

  const sorted = matches.sort((a, b) => b.match.score - a.match.score);
  return NextResponse.json(sorted);
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/match/
git commit -m "feat: match API routes for users, books, and clubs"
```

---

### Task 8: Taste profile UI components and profile page

**Files:**
- Create: `components/taste/match-badge.tsx`
- Create: `components/taste/dimension-bar.tsx`
- Create: `components/taste/taste-profile-card.tsx`
- Create: `app/(app)/profile/[id]/page.tsx`

- [ ] **Step 1: Create `components/taste/match-badge.tsx`**

```typescript
import { cn } from "@/lib/utils";

type Props = {
  score: number;
  confidence: "low" | "medium" | "high";
  size?: "sm" | "md" | "lg";
};

export function MatchBadge({ score, confidence, size = "md" }: Props) {
  const color =
    score >= 80 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
    score >= 60 ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
    score >= 40 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
    "bg-muted text-muted-foreground border-border";

  const sizeClass =
    size === "sm" ? "text-xs px-2 py-0.5" :
    size === "lg" ? "text-base px-4 py-1.5 font-bold" :
    "text-sm px-3 py-1 font-medium";

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border", sizeClass, color)}>
      {score}% match
      {confidence === "low" && <span className="opacity-60 text-xs">·</span>}
    </span>
  );
}
```

- [ ] **Step 2: Create `components/taste/dimension-bar.tsx`**

```typescript
import { DIMENSION_LABELS } from "@/lib/matching/types";
import type { TasteDimensions } from "@/lib/matching/types";

type Props = {
  dimension: keyof TasteDimensions;
  value: number;
};

export function DimensionBar({ dimension, value }: Props) {
  const [lowLabel, highLabel] = DIMENSION_LABELS[dimension];
  const percent = Math.round(value * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `components/taste/taste-profile-card.tsx`**

```typescript
import { TasteProfile } from "@prisma/client";
import { DimensionBar } from "./dimension-bar";
import { Badge } from "@/components/ui/badge";
import type { TasteDimensions } from "@/lib/matching/types";

type Props = { profile: TasteProfile };

const DIMENSIONS: Array<keyof TasteDimensions> = [
  "pace", "tone", "focus", "emotionalIntensity",
  "romanceLevel", "complexity", "worldbuildingDepth", "discussionPotential",
];

export function TasteProfileCard({ profile }: Props) {
  return (
    <div className="space-y-6">
      {/* Genres */}
      {profile.topGenres.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Top Genres</h3>
          <div className="flex flex-wrap gap-2">
            {profile.topGenres.map((g) => (
              <Badge key={g} variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                {g}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Authors */}
      {profile.topAuthors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Favourite Authors</h3>
          <div className="flex flex-wrap gap-2">
            {profile.topAuthors.map((a) => (
              <Badge key={a} variant="outline" className="border-border">{a}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Taste Dimensions */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Taste Dimensions</h3>
        <div className="space-y-3">
          {DIMENSIONS.map((dim) => {
            const val = profile[dim as keyof typeof profile] as number | null;
            if (val === null || val === undefined) return null;
            return <DimensionBar key={dim} dimension={dim} value={val} />;
          })}
        </div>
      </div>

      {/* Cluster */}
      {profile.cluster && (
        <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <span className="text-white font-medium">Taste cluster: </span>
          {profile.cluster.replace(/_/g, " ")}
        </div>
      )}

      {/* Dislikes */}
      {profile.dislikedGenres.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Genres they skip</h3>
          <div className="flex flex-wrap gap-2">
            {profile.dislikedGenres.map((g) => (
              <Badge key={g} variant="outline" className="border-red-500/20 text-red-400/70">{g}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `app/(app)/profile/[id]/page.tsx`**

```typescript
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { buildUserTasteSnapshot } from "@/lib/taste/profile";
import { calculateUserToUserMatch } from "@/lib/matching/user-to-user";
import { TasteProfileCard } from "@/components/taste/taste-profile-card";
import { MatchBadge } from "@/components/taste/match-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MapPin, Trophy } from "lucide-react";

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const session = await getSession();

  const [profileUser, tasteProfile, userScore, booksRead] = await Promise.all([
    db.user.findUnique({
      where: { id: params.id },
      include: {
        userAchievements: { include: { achievement: true }, take: 5 },
        _count: { select: { followers: true, following: true } },
      },
    }),
    db.tasteProfile.findUnique({ where: { userId: params.id } }),
    db.userScore.findUnique({ where: { userId: params.id } }),
    db.userBook.count({ where: { userId: params.id, status: "READ" } }),
  ]);

  if (!profileUser) notFound();

  const isOwnProfile = session?.user.id === params.id;

  // Calculate match if viewing someone else's profile
  let matchResult = null;
  if (!isOwnProfile && session) {
    const [viewerSnapshot, profileSnapshot] = await Promise.all([
      buildUserTasteSnapshot(session.user.id),
      buildUserTasteSnapshot(params.id),
    ]);
    matchResult = calculateUserToUserMatch(viewerSnapshot, profileSnapshot);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Profile header */}
      <div className="flex items-start gap-6 mb-8">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profileUser.avatar ?? undefined} />
          <AvatarFallback className="text-2xl bg-emerald-500/20 text-emerald-400">
            {profileUser.name?.[0] ?? "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{profileUser.name}</h1>
            {matchResult && (
              <MatchBadge score={matchResult.score} confidence={matchResult.confidence} size="md" />
            )}
          </div>
          {profileUser.username && (
            <p className="text-muted-foreground">@{profileUser.username}</p>
          )}
          {profileUser.bio && (
            <p className="text-sm text-muted-foreground mt-2 max-w-lg">{profileUser.bio}</p>
          )}
          {profileUser.location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5" />
              {profileUser.location}
            </div>
          )}

          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="text-center">
              <p className="font-bold text-white">{booksRead}</p>
              <p className="text-muted-foreground text-xs">Books read</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-white">{profileUser._count.followers}</p>
              <p className="text-muted-foreground text-xs">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-white">{userScore?.totalPoints ?? 0}</p>
              <p className="text-muted-foreground text-xs">Points</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-white">{userScore?.streakDays ?? 0}🔥</p>
              <p className="text-muted-foreground text-xs">Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Match reasons (if viewing another profile) */}
      {matchResult && matchResult.matchReasons.length > 0 && (
        <div className="mb-8 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <h2 className="font-semibold text-emerald-400 mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Why you match
          </h2>
          <ul className="space-y-1">
            {matchResult.matchReasons.map((reason, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">→</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Taste Profile */}
        {tasteProfile && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Taste Profile</h2>
            <TasteProfileCard profile={tasteProfile} />
          </div>
        )}

        {/* Achievements */}
        {profileUser.userAchievements.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Achievements</h2>
            <div className="space-y-2">
              {profileUser.userAchievements.map(({ achievement }) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <p className="font-medium text-sm text-white">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                  <span className="ml-auto text-xs text-yellow-400 font-medium">+{achievement.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify profile page**

```bash
open http://localhost:3000/profile/$(npx ts-node -e "const {db}=require('./lib/db'); db.user.findUnique({where:{email:'sarah@folio.dev'}}).then(u=>console.log(u.id))")
```

Or find the ID in Prisma Studio and visit `/profile/[sarah-id]`. Expected: profile with taste profile, dimensions bars, achievements.

- [ ] **Step 6: Add `/profile` redirect page (sidebar links here)**

Create `app/(app)/profile/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-helpers";

export default async function ProfileRedirectPage() {
  const session = await requireAuth();
  redirect(`/profile/${session.user.id}`);
}
```

- [ ] **Step 7: Commit**

```bash
git add components/taste/ app/\(app\)/profile/ lib/taste/ lib/matching/ app/api/match/
git commit -m "feat: complete taste matching engine, profile page, and match API routes"
```

---

## Phase 4 Complete

**What's working:**
- User-to-user match algorithm with tests (score, reasons, confidence)
- User-to-book match algorithm with dislike penalties and tests
- User-to-club match algorithm (member-based + genre + dimensions)
- Club-to-book match algorithm (member average approach)
- Taste profile calculator from UserBook history
- Match API routes for all 3 match types
- Profile page with taste dimensions, achievements, match badge, and match reasons
- Human-readable match reason generator

**Next:** Phase 5 — Home dashboard, book discovery, club discovery, club detail pages, and book voting.
