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
