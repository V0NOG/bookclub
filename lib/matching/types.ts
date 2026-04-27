export type MatchOutput = {
  score: number;
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
