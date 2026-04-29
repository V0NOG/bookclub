import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { BookOpen, Star } from "lucide-react";
import Link from "next/link";
import { getMatchesForUser, ScoredUser, ScoredBook, ScoredClub } from "@/lib/matching/cache";
import { MatchCard } from "@/components/match/MatchCard";

// Suppress section when best match is weak; otherwise keep items >= 60% of top score.
function applyThreshold<T extends { match: { score: number } }>(items: T[]): T[] {
  if (items.length === 0) return [];
  const top = Math.max(...items.map((r) => r.match.score));
  if (top < 50) return [];
  const floor = Math.max(30, Math.round(top * 0.6));
  return items.filter((r) => r.match.score >= floor);
}

// Greedy genre diversity: max `limit` items per genre cluster, preserving score order.
function diversify<T>(items: T[], getGenre: (item: T) => string | undefined, limit = 2): T[] {
  const counts = new Map<string, number>();
  return items.filter((item) => {
    const genre = getGenre(item) ?? "\0";
    const n = counts.get(genre) ?? 0;
    if (n >= limit) return false;
    counts.set(genre, n + 1);
    return true;
  });
}

async function fetchColdStart(userId: string) {
  return Promise.all([
    db.book.findMany({
      where: { userBooks: { none: { userId } } },
      orderBy: [{ ratingsCount: "desc" }],
      take: 6,
      select: { id: true, title: true, author: true, cover: true, genres: true },
    }),
    db.user.findMany({
      where: { id: { not: userId }, tasteProfile: { isNot: null } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, name: true, username: true, avatar: true },
    }),
    db.club.findMany({
      where: { visibility: "PUBLIC", members: { none: { userId } } },
      include: { _count: { select: { members: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);
}

export default async function HomePage() {
  const session = await getSession();
  const userId = session!.user.id;
  const firstName = session?.user.name?.split(" ")[0] ?? "there";

  const [currentBook, recentBooks, goal, rawMatches, ratedCount] = await Promise.all([
    db.userBook.findFirst({
      where: { userId, status: "CURRENTLY_READING" },
      include: { book: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.userBook.findMany({
      where: { userId, status: "READ" },
      include: { book: true },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    db.readingGoal.findFirst({
      where: { userId, type: "BOOKS_PER_YEAR", year: new Date().getFullYear() },
    }),
    getMatchesForUser(userId),
    db.userBook.count({ where: { userId, rating: { not: null } } }),
  ]);

  const booksReadThisYear = goal
    ? await db.userBook.count({ where: { userId, status: "READ" } })
    : 0;

  const currentPercent = currentBook?.book.pageCount
    ? Math.round((currentBook.progress / currentBook.book.pageCount) * 100)
    : 0;

  // ── Apply display pipeline ───────────────────────────────────────────────────

  const userMatches: ScoredUser[] = diversify(
    applyThreshold(rawMatches.userMatches),
    (r) => Array.from(r.match.sharedGenres).sort().join("|")
  ).slice(0, 6);

  const bookMatches: ScoredBook[] = diversify(
    applyThreshold(rawMatches.bookMatches),
    (r) => Array.from(r.book.genres).sort().join("|")
  ).slice(0, 6);

  const clubMatches: ScoredClub[] = diversify(
    applyThreshold(rawMatches.clubMatches),
    (r) => Array.from(r.club.genres).sort().join("|")
  ).slice(0, 6);

  // ── Exploration injection ────────────────────────────────────────────────────

  const exploratoryUsers = rawMatches.exploratoryUsers.slice(0, 2);
  const exploratoryBooks = rawMatches.exploratoryBooks.slice(0, 2);
  const exploratoryClubs = rawMatches.exploratoryClubs.slice(0, 2);

  const displayUsers: Array<ScoredUser & { exploratory?: boolean }> = [
    ...userMatches,
    ...exploratoryUsers.map((u) => ({ ...u, exploratory: true })),
  ];
  const displayBooks: Array<ScoredBook & { exploratory?: boolean }> = [
    ...bookMatches,
    ...exploratoryBooks.map((b) => ({ ...b, exploratory: true })),
  ];
  const displayClubs: Array<ScoredClub & { exploratory?: boolean }> = [
    ...clubMatches,
    ...exploratoryClubs.map((c) => ({ ...c, exploratory: true })),
  ];

  // ── Cold start fallback ──────────────────────────────────────────────────────

  const needsColdStart =
    userMatches.length === 0 || bookMatches.length === 0 || clubMatches.length === 0;
  const [popularBooks, trendingUsers, activeClubs] = needsColdStart
    ? await fetchColdStart(userId)
    : [[], [], []];

  // ── Top match badge logic ────────────────────────────────────────────────────

  const userTopMatch =
    userMatches.length >= 2 && userMatches[0].match.score - userMatches[1].match.score >= 8;
  const bookTopMatch =
    bookMatches.length >= 2 && bookMatches[0].match.score - bookMatches[1].match.score >= 8;
  const clubTopMatch =
    clubMatches.length >= 2 && clubMatches[0].match.score - clubMatches[1].match.score >= 8;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-1">
        Good reading, {firstName}
      </h1>
      <div className="flex items-center justify-between mb-8">
        <p className="text-muted-foreground text-sm">
          {ratedCount > 0
            ? `Recommendations based on ${ratedCount} book${ratedCount === 1 ? "" : "s"} you've rated`
            : "Rate books to unlock personalised recommendations"}
        </p>
        <Link href="/how-it-works" className="text-xs text-emerald-400 hover:underline shrink-0 ml-4">
          How it works
        </Link>
      </div>

      {/* Currently reading */}
      {currentBook && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Currently reading</h2>
          <div className="bg-card border border-border rounded-xl p-4 flex gap-4 items-start max-w-lg">
            <div className="flex-shrink-0">
              {currentBook.book.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentBook.book.cover} alt="" className="h-20 w-14 object-cover rounded-md shadow" />
              ) : (
                <div className="h-20 w-14 bg-muted rounded-md flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{currentBook.book.title}</p>
              <p className="text-sm text-muted-foreground mb-3">{currentBook.book.author}</p>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${currentPercent}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{currentBook.progress} / {currentBook.book.pageCount ?? "?"} pages</span>
                <span>{currentPercent}%</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Reading goal */}
      {goal && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Reading goal {new Date().getFullYear()}</h2>
          <div className="bg-card border border-border rounded-xl p-4 max-w-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white font-medium">{booksReadThisYear} of {goal.target} books</span>
              <span className="text-xs text-emerald-400">{Math.round((booksReadThisYear / goal.target) * 100)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((booksReadThisYear / goal.target) * 100))}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {/* People you'll love */}
      <section className="mb-8">
        {displayUsers.length > 0 ? (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">People you&apos;ll love</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
              {displayUsers.map(({ user, match, exploratory }, i) => (
                <MatchCard
                  key={user.id}
                  variant="person"
                  title={user.name ?? user.username ?? "Reader"}
                  subtitle={match.sharedGenres[0]}
                  coverImage={user.avatar}
                  score={match.score}
                  confidence={match.confidence}
                  reasons={match.matchReasons}
                  meta={match.sharedGenres.slice(0, 2).join(" · ") || undefined}
                  featured={i === 0 && !exploratory}
                  topMatch={i === 0 && userTopMatch && !exploratory}
                  exploratory={exploratory}
                  targetId={user.id}
                />
              ))}
            </div>
          </>
        ) : trendingUsers.length > 0 ? (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Readers you might like</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
              {trendingUsers.map((u) => (
                <MatchCard
                  key={u.id}
                  variant="person"
                  title={u.name ?? u.username ?? "Reader"}
                  coverImage={u.avatar}
                  badge="Trending"
                  targetId={u.id}
                />
              ))}
            </div>
          </>
        ) : (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">People you&apos;ll love</h2>
            <p className="text-sm text-muted-foreground mb-1">Rate more books to find readers with similar taste.</p>
            <Link href="/library" className="text-xs text-emerald-400 hover:underline">Start rating books →</Link>
          </div>
        )}
      </section>

      {/* Books for you */}
      <section className="mb-8">
        {displayBooks.length > 0 ? (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Books for you</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
              {displayBooks.map(({ book, match, exploratory }, i) => (
                <MatchCard
                  key={book.id}
                  variant="book"
                  title={book.title}
                  subtitle={book.author}
                  coverImage={book.cover ?? null}
                  score={match.score}
                  confidence={match.confidence}
                  reasons={match.matchReasons}
                  meta={match.sharedGenres.slice(0, 2).join(" · ") || undefined}
                  featured={i === 0 && !exploratory}
                  topMatch={i === 0 && bookTopMatch && !exploratory}
                  exploratory={exploratory}
                  targetId={book.id}
                />
              ))}
            </div>
          </>
        ) : popularBooks.length > 0 ? (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Popular right now</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
              {popularBooks.map((b) => (
                <MatchCard
                  key={b.id}
                  variant="book"
                  title={b.title}
                  subtitle={b.author}
                  coverImage={b.cover ?? null}
                  badge="Popular"
                  targetId={b.id}
                />
              ))}
            </div>
          </>
        ) : (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Books for you</h2>
            <p className="text-sm text-muted-foreground mb-1">Rate a few books and we&apos;ll find titles you&apos;ll love.</p>
            <Link href="/library" className="text-xs text-emerald-400 hover:underline">Browse your library →</Link>
          </div>
        )}
      </section>

      {/* Clubs for you */}
      <section className="mb-8">
        {displayClubs.length > 0 ? (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Clubs for you</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
              {displayClubs.map(({ club, match, exploratory }, i) => (
                <MatchCard
                  key={club.id}
                  variant="club"
                  title={club.name}
                  subtitle={club.genres.slice(0, 2).join(", ")}
                  coverImage={club.avatar ?? null}
                  score={match.score}
                  confidence={match.confidence}
                  reasons={match.matchReasons}
                  meta={`${club._count.members} members`}
                  featured={i === 0 && !exploratory}
                  topMatch={i === 0 && clubTopMatch && !exploratory}
                  exploratory={exploratory}
                  targetId={club.id}
                />
              ))}
            </div>
          </>
        ) : activeClubs.length > 0 ? (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Active clubs</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
              {activeClubs.map((c) => (
                <MatchCard
                  key={c.id}
                  variant="club"
                  title={c.name}
                  subtitle={c.genres.slice(0, 2).join(", ")}
                  coverImage={c.avatar ?? null}
                  meta={`${c._count.members} members`}
                  badge="Active"
                  targetId={c.id}
                />
              ))}
            </div>
          </>
        ) : (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Clubs for you</h2>
            <p className="text-sm text-muted-foreground mb-1">Rate more books to see clubs that match your reading style.</p>
            <Link href="/clubs" className="text-xs text-emerald-400 hover:underline">Explore clubs →</Link>
          </div>
        )}
      </section>

      {/* Recently read */}
      {recentBooks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Recently read</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentBooks.map((ub) => (
              <div key={ub.id} className="group">
                <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden mb-2 shadow">
                  {ub.book.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ub.book.cover} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-white truncate">{ub.book.title}</p>
                <p className="text-xs text-muted-foreground truncate">{ub.book.author}</p>
                {ub.rating && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: ub.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-emerald-400 text-emerald-400" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state for new users */}
      {!currentBook && recentBooks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium mb-2 text-white">Your reading journey starts here</p>
          <p className="text-xs mb-1">Start by rating a few books you&apos;ve already read.</p>
          <p className="text-xs mb-5 opacity-70">Even 3–5 ratings unlock personalised recommendations.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/library" className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors">
              Rate books
            </Link>
            <Link href="/how-it-works" className="text-sm text-emerald-400 hover:underline py-2">
              How it works
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
