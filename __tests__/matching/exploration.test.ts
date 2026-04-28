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

test("eligible: empty genres (user-to-user) relies on adjacency only, not genre gate", () => {
  const userCandidate: ExplorationCandidate = {
    score: 55,
    genres: [],
    sharedGenres: [],
    sharedDimensions: ["tone"],
    sharedThemes: [],
  };
  expect(isExploratoryEligible(userCandidate, ctx)).toBe(true);
});

test("ineligible: empty genres but no adjacency signal", () => {
  const userNoAdjacency: ExplorationCandidate = {
    score: 55,
    genres: [],
    sharedGenres: [],
    sharedDimensions: [],
    sharedThemes: [],
  };
  expect(isExploratoryEligible(userNoAdjacency, ctx)).toBe(false);
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
    { score: 30, genres: ["Sci-Fi"], dims: ["tone"] },
    { score: 60, genres: ["Romance"], dims: ["tone"] },
    { score: 50, genres: ["Horror"], dims: [] },
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
