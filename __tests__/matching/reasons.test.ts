import { generateBookMatchReasons, generateUserMatchReasons, generateClubMatchReasons, generateExploratoryReason } from "@/lib/matching/reasons";

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

test("book reasons: high score (>=85) uses strong genre phrasing", () => {
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

test("book reasons: medium score (60-84) uses softer genre phrasing", () => {
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

// ── generateUserMatchReasons ──────────────────────────────────────────────────

const baseUserParams = {
  sharedBooks: [],
  sharedGenres: ["Fantasy"],
  sharedAuthors: [],
  sharedDimensions: [] as Array<keyof import("@/lib/matching/types").TasteDimensions>,
  negativeGenreOverlap: [],
  dimensionsA: {},
  dimensionsB: {},
};

test("user reasons: high score (>=85) genre uses 'You both enjoy' phrasing", () => {
  const { reasons } = generateUserMatchReasons({ ...baseUserParams, score: 90 });
  expect(reasons[0]).toMatch(/You both enjoy Fantasy/);
});

test("user reasons: medium score (60-84) genre uses 'You tend to read similar' phrasing", () => {
  const { reasons } = generateUserMatchReasons({ ...baseUserParams, score: 70 });
  expect(reasons[0]).toMatch(/You tend to read similar Fantasy books/);
});

test("user reasons: low score (<60) genre uses 'Some overlap in' phrasing", () => {
  const { reasons } = generateUserMatchReasons({ ...baseUserParams, score: 50 });
  expect(reasons[0]).toMatch(/Some overlap in Fantasy preferences/);
});

test("user reasons: max 2 reasons returned even with many signals", () => {
  const { reasons } = generateUserMatchReasons({
    sharedBooks: ["Book A", "Book B"],
    sharedGenres: ["Fantasy", "Horror"],
    sharedAuthors: ["Author X"],
    sharedDimensions: ["tone", "complexity"],
    negativeGenreOverlap: [],
    dimensionsA: { tone: 0.8, complexity: 0.9 },
    dimensionsB: { tone: 0.75, complexity: 0.85 },
    score: 80,
  });
  expect(reasons.length).toBeLessThanOrEqual(2);
});

test("user reasons: no signals returns empty reasons", () => {
  const { reasons } = generateUserMatchReasons({
    sharedBooks: [],
    sharedGenres: [],
    sharedAuthors: [],
    sharedDimensions: [],
    negativeGenreOverlap: [],
    dimensionsA: {},
    dimensionsB: {},
    score: 30,
  });
  expect(reasons.length).toBe(0);
});

// ── generateClubMatchReasons ──────────────────────────────────────────────────

test("club reasons: high score genre uses 'which aligns with your taste' phrasing", () => {
  const reasons = generateClubMatchReasons({
    sharedGenres: ["Fantasy"],
    memberCompatibilityAvg: 0.5,
    strongMatchCount: 0,
    clubDimensions: {},
    sharedDimensions: [],
    memberCount: 3,
    score: 90,
  });
  expect(reasons[0]).toMatch(/aligns with your taste/);
});

test("club reasons: medium score genre uses 'You tend to enjoy' phrasing", () => {
  const reasons = generateClubMatchReasons({
    sharedGenres: ["Fantasy"],
    memberCompatibilityAvg: 0.5,
    strongMatchCount: 0,
    clubDimensions: {},
    sharedDimensions: [],
    memberCount: 3,
    score: 70,
  });
  expect(reasons[0]).toMatch(/You tend to enjoy Fantasy/);
});

test("club reasons: max 2 reasons returned even with many signals", () => {
  const reasons = generateClubMatchReasons({
    sharedGenres: ["Fantasy", "Horror"],
    memberCompatibilityAvg: 0.8,
    strongMatchCount: 2,
    clubDimensions: { tone: 0.8, complexity: 0.9 },
    sharedDimensions: ["tone", "complexity"],
    memberCount: 5,
    score: 85,
  });
  expect(reasons.length).toBeLessThanOrEqual(2);
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
