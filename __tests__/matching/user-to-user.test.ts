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
