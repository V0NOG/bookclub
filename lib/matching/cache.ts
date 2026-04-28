import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { buildUserTasteSnapshot } from "@/lib/taste/profile";
import { calculateUserToUserMatch } from "./user-to-user";
import { calculateUserToBookMatch, BookSnapshot } from "./user-to-book";
import { calculateUserToClubMatch, ClubSnapshot } from "./user-to-club";
import { UserTasteSnapshot, TasteDimensions, MatchOutput } from "./types";

// ── Shared helpers ────────────────────────────────────────────────────────────

type DimSource = {
  pace: number | null; tone: number | null; focus: number | null;
  emotionalIntensity: number | null; romanceLevel: number | null;
  complexity: number | null; worldbuildingDepth: number | null;
  discussionPotential: number | null;
};

function buildDims(src: DimSource): Partial<TasteDimensions> {
  const d: Partial<TasteDimensions> = {};
  if (src.pace !== null) d.pace = src.pace;
  if (src.tone !== null) d.tone = src.tone;
  if (src.focus !== null) d.focus = src.focus;
  if (src.emotionalIntensity !== null) d.emotionalIntensity = src.emotionalIntensity;
  if (src.romanceLevel !== null) d.romanceLevel = src.romanceLevel;
  if (src.complexity !== null) d.complexity = src.complexity;
  if (src.worldbuildingDepth !== null) d.worldbuildingDepth = src.worldbuildingDepth;
  if (src.discussionPotential !== null) d.discussionPotential = src.discussionPotential;
  return d;
}

function toConfidence(c: "LOW" | "MEDIUM" | "HIGH"): "low" | "medium" | "high" {
  return c === "HIGH" ? "high" : c === "MEDIUM" ? "medium" : "low";
}

// ── Public types ──────────────────────────────────────────────────────────────

export type ScoredUser = {
  user: { id: string; name: string | null; username: string | null; avatar: string | null };
  match: MatchOutput;
};

export type ScoredBook = {
  book: { id: string; title: string; author: string; cover: string | null; genres: string[] };
  match: MatchOutput;
};

export type ScoredClub = {
  club: { id: string; name: string; avatar: string | null; genres: string[]; _count: { members: number } };
  match: MatchOutput;
};

export type MatchCacheResult = {
  userMatches: ScoredUser[];
  bookMatches: ScoredBook[];
  clubMatches: ScoredClub[];
  exploratoryUsers: ScoredUser[];
  exploratoryBooks: ScoredBook[];
  exploratoryClubs: ScoredClub[];
};

// ── Core computation ──────────────────────────────────────────────────────────

async function computeMatchesForUser(userId: string): Promise<MatchCacheResult> {
  const [mySnapshot, otherUsers, candidateBooks, candidateClubs] = await Promise.all([
    buildUserTasteSnapshot(userId),
    db.user.findMany({
      where: { id: { not: userId }, tasteProfile: { isNot: null } },
      include: {
        tasteProfile: true,
        userBooks: {
          where: { rating: { not: null } },
          include: { book: { select: { title: true, genres: true, authors: true } } },
          orderBy: { updatedAt: "desc" },
          take: 10,
        },
      },
      take: 30,
    }),
    db.book.findMany({
      where: { userBooks: { none: { userId } }, tasteDimensions: { isNot: null } },
      include: { tasteDimensions: true },
      take: 30,
    }),
    db.club.findMany({
      where: { visibility: "PUBLIC", members: { none: { userId } } },
      include: {
        _count: { select: { members: true } },
        members: { take: 5, include: { user: { include: { tasteProfile: true } } } },
      },
      take: 20,
    }),
  ]);

  const topGenreSet = new Set(mySnapshot.topGenres);

  // ── Score all candidates ─────────────────────────────────────────────────
  const allUserScores: ScoredUser[] = otherUsers
    .map((u) => {
      if (!u.tasteProfile) return null;
      const tp = u.tasteProfile;
      const snapshot: UserTasteSnapshot = {
        userId: u.id,
        topGenres: tp.topGenres,
        topAuthors: tp.topAuthors,
        topThemes: tp.topThemes,
        dimensions: buildDims(tp),
        dislikedGenres: tp.dislikedGenres,
        dislikedAuthors: tp.dislikedAuthors,
        ratedBooks: u.userBooks
          .filter((ub) => ub.rating !== null)
          .map((ub) => ({
            bookId: ub.bookId,
            title: ub.book.title,
            rating: ub.rating!,
            genres: ub.book.genres,
            authors: ub.book.authors,
          })),
        confidence: toConfidence(tp.confidence),
      };
      const match = calculateUserToUserMatch(mySnapshot, snapshot);
      return { user: { id: u.id, name: u.name, username: u.username, avatar: u.avatar }, match };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.match.score - a.match.score);

  const allBookScores: ScoredBook[] = candidateBooks
    .map((b) => {
      if (!b.tasteDimensions) return null;
      const bookSnap: BookSnapshot = {
        bookId: b.id, title: b.title, author: b.author,
        genres: b.genres, tags: b.tags,
        dimensions: buildDims(b.tasteDimensions),
      };
      const match = calculateUserToBookMatch(mySnapshot, bookSnap);
      return { book: { id: b.id, title: b.title, author: b.author, cover: b.cover ?? null, genres: b.genres }, match };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.match.score - a.match.score);

  const allClubScores: ScoredClub[] = candidateClubs
    .map((c) => {
      const memberSnapshots: UserTasteSnapshot[] = c.members
        .filter((m) => m.user.tasteProfile !== null)
        .map((m) => {
          const tp = m.user.tasteProfile!;
          return {
            userId: m.userId,
            topGenres: tp.topGenres, topAuthors: tp.topAuthors, topThemes: tp.topThemes,
            dimensions: buildDims(tp),
            dislikedGenres: tp.dislikedGenres, dislikedAuthors: tp.dislikedAuthors,
            ratedBooks: [], confidence: toConfidence(tp.confidence),
          };
        });
      const clubSnap: ClubSnapshot = {
        clubId: c.id, genres: c.genres, themes: c.themes, dimensions: {}, memberSnapshots,
      };
      const match = calculateUserToClubMatch(mySnapshot, clubSnap);
      return { club: { id: c.id, name: c.name, avatar: c.avatar ?? null, genres: c.genres, _count: c._count }, match };
    })
    .sort((a, b) => b.match.score - a.match.score);

  // ── Exploration: good score, genres outside user's top ───────────────────
  const exploratoryUsers = topGenreSet.size > 0
    ? allUserScores
        .filter((r) => r.match.score >= 20 && r.match.sharedGenres.length === 0)
        .slice(0, 2)
    : [];

  const exploratoryBooks = topGenreSet.size > 0
    ? allBookScores
        .filter((r) =>
          r.match.score >= 20 &&
          r.book.genres.length > 0 &&
          r.book.genres.every((g) => !topGenreSet.has(g))
        )
        .slice(0, 2)
    : [];

  const exploratoryClubs = topGenreSet.size > 0
    ? allClubScores
        .filter((r) =>
          r.match.score >= 20 &&
          r.club.genres.length > 0 &&
          r.club.genres.every((g) => !topGenreSet.has(g))
        )
        .slice(0, 2)
    : [];

  return {
    userMatches: allUserScores,
    bookMatches: allBookScores,
    clubMatches: allClubScores,
    exploratoryUsers,
    exploratoryBooks,
    exploratoryClubs,
  };
}

// ── Cache layer ───────────────────────────────────────────────────────────────

const CACHE_TTL = 3600; // 1 hour

export function getMatchesForUser(userId: string): Promise<MatchCacheResult> {
  return unstable_cache(
    () => computeMatchesForUser(userId),
    [`user-matches-${userId}`],
    { revalidate: CACHE_TTL, tags: [`user-matches-${userId}`] }
  )();
}

// Call from server actions that mutate user taste (rating books, following).
export function invalidateUserMatchCache(userId: string) {
  revalidateTag(`user-matches-${userId}`);
}
