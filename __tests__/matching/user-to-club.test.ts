import { calculateUserToClubMatch } from "@/lib/matching/user-to-club";
import { UserTasteSnapshot } from "@/lib/matching/types";

const fantasyUser: UserTasteSnapshot = {
  userId: "u1",
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

const likelyMember: UserTasteSnapshot = {
  userId: "m1",
  topGenres: ["Dark Academia", "Fantasy"],
  topAuthors: ["Olivie Blake"],
  topThemes: ["academia"],
  dimensions: { pace: 0.5, tone: 0.75, focus: 0.65, complexity: 0.8 },
  dislikedGenres: ["Romance"],
  dislikedAuthors: [],
  ratedBooks: [
    { bookId: "b2", title: "The Atlas Six", rating: 5, genres: ["Dark Academia"], authors: ["Olivie Blake"] },
  ],
  confidence: "medium",
};

const romanceClub = {
  clubId: "c2",
  genres: ["Romance", "Contemporary Romance"],
  themes: ["love", "relationships"],
  dimensions: { tone: 0.2, romanceLevel: 0.9, pace: 0.6 },
  memberSnapshots: [] as UserTasteSnapshot[],
};

const darkAcademiaClub = {
  clubId: "c1",
  genres: ["Dark Academia", "Fantasy"],
  themes: ["academia", "magic"],
  dimensions: { tone: 0.72, complexity: 0.78, pace: 0.5 },
  memberSnapshots: [likelyMember],
};

test("user matches compatible club well", () => {
  const result = calculateUserToClubMatch(fantasyUser, darkAcademiaClub);
  expect(result.score).toBeGreaterThan(50);
});

test("user does not match incompatible club", () => {
  const result = calculateUserToClubMatch(fantasyUser, romanceClub);
  expect(result.score).toBeLessThan(50);
});

test("shared genres appear in output", () => {
  const result = calculateUserToClubMatch(fantasyUser, darkAcademiaClub);
  expect(result.sharedGenres).toContain("Dark Academia");
});

test("empty club falls back to genre-only matching", () => {
  const result = calculateUserToClubMatch(fantasyUser, romanceClub);
  expect(result.confidence).toBe("low");
});
