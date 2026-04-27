import { calculateUserToUserMatch } from "@/lib/matching/user-to-user";
import { UserTasteSnapshot } from "@/lib/matching/types";

// ── Core fixtures ─────────────────────────────────────────────────────────────

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

// ── Existing tests ────────────────────────────────────────────────────────────

test("aligned users produce a meaningful score", () => {
  const result = calculateUserToUserMatch(userA, userB);
  // userA/userB share 1 book, 1 genre, 1 author, near-identical dimensions, and 1 disliked genre.
  // With only 2 books each, "medium" confidence is correct — data is sparse.
  // Score of 50+ reflects real alignment without over-crediting thin evidence.
  expect(result.score).toBeGreaterThan(50);
  expect(result.confidence).toBe("medium");
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
  expect(result.score).toBeLessThan(40);
});

// ── Edge case: same dimensions, different genres ───────────────────────────────

test("same dimensions with no shared content scores low (false positive check)", () => {
  // Two users who happen to prefer the same reading pace/tone but read entirely
  // different genres. Dimension similarity alone should not inflate the score.
  const scifiReader: UserTasteSnapshot = {
    userId: "d",
    topGenres: ["Science Fiction", "Thriller"],
    topAuthors: ["Andy Weir"],
    topThemes: ["technology"],
    dimensions: { tone: 0.72, complexity: 0.78 }, // identical to userA's matching dims
    dislikedGenres: [],
    dislikedAuthors: [],
    ratedBooks: [],
    confidence: "low",
  };
  const result = calculateUserToUserMatch(userA, scifiReader);
  expect(result.score).toBeLessThan(30);
});

// ── Edge case: same books, different dimensions ───────────────────────────────

test("shared books with opposite dimensions scores in medium range", () => {
  // Both users loved the same two books, but their self-reported taste dimensions
  // are polar opposites. Books provide real signal; dimensions don't agree.
  const userE1: UserTasteSnapshot = {
    userId: "e1",
    topGenres: ["Science Fiction"],
    topAuthors: ["Author X"],
    topThemes: [],
    dimensions: { pace: 0.2, tone: 0.9 },
    dislikedGenres: [],
    dislikedAuthors: [],
    ratedBooks: [
      { bookId: "bx1", title: "Book A", rating: 5, genres: ["Science Fiction"], authors: ["Author X"] },
      { bookId: "bx2", title: "Book B", rating: 5, genres: ["Science Fiction"], authors: ["Author X"] },
    ],
    confidence: "medium",
  };
  const userE2: UserTasteSnapshot = {
    userId: "e2",
    topGenres: ["Romance"],
    topAuthors: ["Author Y"],
    topThemes: [],
    dimensions: { pace: 0.8, tone: 0.1 },
    dislikedGenres: [],
    dislikedAuthors: [],
    ratedBooks: [
      { bookId: "bx1", title: "Book A", rating: 5, genres: ["Science Fiction"], authors: ["Author X"] },
      { bookId: "bx2", title: "Book B", rating: 5, genres: ["Science Fiction"], authors: ["Author X"] },
    ],
    confidence: "medium",
  };
  const result = calculateUserToUserMatch(userE1, userE2);
  // Shared books give a real positive signal; divergent dimensions and genres
  // prevent an inflated high score.
  expect(result.score).toBeGreaterThan(25);
  expect(result.score).toBeLessThan(65);
});

// ── Edge case: small library with single shared book ─────────────────────────

test("single shared book from tiny libraries is not over-inflated", () => {
  // One shared 5-star book between users who have nothing else in common.
  // Should register as a weak positive, not a strong match.
  const sparseA: UserTasteSnapshot = {
    userId: "f1",
    topGenres: ["Fantasy"],
    topAuthors: ["Author Z"],
    topThemes: [],
    dimensions: {},
    dislikedGenres: [],
    dislikedAuthors: [],
    ratedBooks: [{ bookId: "bz1", title: "Book Z", rating: 5, genres: ["Fantasy"], authors: ["Author Z"] }],
    confidence: "low",
  };
  const sparseB: UserTasteSnapshot = {
    userId: "f2",
    topGenres: ["Romance"],
    topAuthors: ["Author W"],
    topThemes: [],
    dimensions: {},
    dislikedGenres: [],
    dislikedAuthors: [],
    ratedBooks: [{ bookId: "bz1", title: "Book Z", rating: 5, genres: ["Fantasy"], authors: ["Author Z"] }],
    confidence: "low",
  };
  const result = calculateUserToUserMatch(sparseA, sparseB);
  expect(result.score).toBeLessThan(50);
});
