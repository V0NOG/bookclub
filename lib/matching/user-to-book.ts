import { MatchOutput, UserTasteSnapshot, TasteDimensions, EMPTY_MATCH } from "./types";
import { overallDimensionSimilarity, sharedDimensions, computeConfidence, toScore } from "./dimensions";
import { generateBookMatchReasons } from "./reasons";

export type BookSnapshot = {
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
  const dislikedGenreHit = book.genres.some((g) => user.dislikedGenres.includes(g));
  const dislikedAuthorHit = user.dislikedAuthors.includes(book.author);
  const dislikePenalty = (dislikedGenreHit ? 0.25 : 0) + (dislikedAuthorHit ? 0.2 : 0);

  const alreadyRead = user.ratedBooks.find((b) => b.bookId === book.bookId);
  if (alreadyRead) {
    return {
      ...EMPTY_MATCH,
      score: alreadyRead.rating * 20,
      confidence: "high",
      matchReasons: [`You rated this book ${alreadyRead.rating} stars.`],
    };
  }

  const sharedGenres = book.genres.filter((g) => user.topGenres.includes(g));
  const genreScore = sharedGenres.length / Math.max(1, user.topGenres.length);

  const authorLiked = user.topAuthors.includes(book.author);
  const authorScore = authorLiked ? 0.8 : 0.4;

  const dimSimilarity = overallDimensionSimilarity(user.dimensions, book.dimensions);
  const alignedDims = sharedDimensions(user.dimensions, book.dimensions, 0.2);

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
