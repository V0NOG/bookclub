import { calculateClubToBookMatch } from "@/lib/matching/club-to-book";
import { UserTasteSnapshot } from "@/lib/matching/types";

const fantasyMember: UserTasteSnapshot = {
  userId: "m1",
  topGenres: ["Fantasy", "Dark Academia"],
  topAuthors: ["Leigh Bardugo"],
  topThemes: ["magic"],
  dimensions: { pace: 0.55, tone: 0.72, complexity: 0.78, worldbuildingDepth: 0.8 },
  dislikedGenres: ["Romance"],
  dislikedAuthors: [],
  ratedBooks: [
    { bookId: "b1", title: "Six of Crows", rating: 5, genres: ["Fantasy"], authors: ["Leigh Bardugo"] },
  ],
  confidence: "high",
};

const fantasyClub = {
  clubId: "c1",
  genres: ["Fantasy", "Dark Academia"],
  themes: ["magic", "academia"],
  dimensions: { tone: 0.72, complexity: 0.78, worldbuildingDepth: 0.8 },
  memberSnapshots: [fantasyMember],
};

const fantasyBook = {
  bookId: "b2",
  title: "The Name of the Wind",
  author: "Patrick Rothfuss",
  genres: ["Fantasy", "Epic Fantasy"],
  tags: ["magic"],
  dimensions: { tone: 0.5, complexity: 0.85, worldbuildingDepth: 0.9, pace: 0.3 },
};

const romanceBook = {
  bookId: "b3",
  title: "Beach Read",
  author: "Emily Henry",
  genres: ["Romance"],
  tags: ["love"],
  dimensions: { tone: 0.2, romanceLevel: 0.9, complexity: 0.2 },
};

test("fantasy club matches fantasy book well", () => {
  const result = calculateClubToBookMatch(fantasyClub, fantasyBook);
  expect(result.score).toBeGreaterThan(50);
});

test("fantasy club does not strongly match romance book", () => {
  const result = calculateClubToBookMatch(fantasyClub, romanceBook);
  expect(result.score).toBeLessThan(50);
});

test("memberLikelyToEnjoyPercent is present and in range", () => {
  const result = calculateClubToBookMatch(fantasyClub, fantasyBook);
  expect(result.memberLikelyToEnjoyPercent).toBeGreaterThanOrEqual(0);
  expect(result.memberLikelyToEnjoyPercent).toBeLessThanOrEqual(100);
});

test("shared genres appear in output", () => {
  const result = calculateClubToBookMatch(fantasyClub, fantasyBook);
  expect(result.sharedGenres).toContain("Fantasy");
});
