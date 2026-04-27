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

export const DIMENSION_LABELS: Record<keyof TasteDimensions, [string, string]> = {
  pace: ["Slow-paced", "Fast-paced"],
  tone: ["Light-hearted", "Dark"],
  focus: ["Character-driven", "Plot-driven"],
  emotionalIntensity: ["Low emotional intensity", "High emotional intensity"],
  romanceLevel: ["No romance", "Romance-heavy"],
  complexity: ["Simple", "Complex"],
  worldbuildingDepth: ["Minimal world-building", "Deep world-building"],
  discussionPotential: ["Light read", "Great for discussion"],
};
