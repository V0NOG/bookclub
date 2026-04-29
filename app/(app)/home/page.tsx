import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { BookOpen, Star } from "lucide-react";
import Link from "next/link";
import { getMatchesForUser, ScoredBook, ScoredUser, ScoredClub } from "@/lib/matching/cache";
import { MatchCard } from "@/components/match/MatchCard";
import { SearchBar } from "@/components/feed/search-bar";
import { ActivityCard, ActivityItem } from "@/components/feed/activity-card";
import { PeopleSuggestion } from "@/components/feed/people-suggestion";
import { ClubSuggestionCard } from "@/components/clubs/club-suggestion-card";

// ── Display pipeline helpers ──────────────────────────────────────────────────

function applyThreshold<T extends { match: { score: number } }>(items: T[]): T[] {
  if (items.length === 0) return [];
  const top = Math.max(...items.map((r) => r.match.score));
  if (top < 50) return [];
  const floor = Math.max(30, Math.round(top * 0.6));
  return items.filter((r) => r.match.score >= floor);
}

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

function extractTriggerBook(reasons: string[]): string | null {
  const m = (reasons[0] ?? "").match(/^Because you loved (.+)\.$/);
  return m ? m[1] : null;
}

// ── Activity helpers ──────────────────────────────────────────────────────────

function formatTimestamp(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const m = Math.floor(diffMs / 60_000);
  const h = Math.floor(diffMs / 3_600_000);
  const d = Math.floor(diffMs / 86_400_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

type RawEvent = {
  id: string;
  type: string;
  createdAt: Date;
  user: { name: string | null; username: string | null; avatar: string | null };
  book: { title: string } | null;
  club: { name: string } | null;
};

function mapToActivityItem(event: RawEvent): ActivityItem | null {
  const actorName = event.user.name ?? event.user.username ?? "Someone";
  const timestamp = formatTimestamp(event.createdAt);
  const base = { id: event.id, actorName, actorAvatar: event.user.avatar, timestamp };

  switch (event.type) {
    case "finished":
    case "started":
      return event.book
        ? { ...base, action: event.type as "finished" | "started", bookTitle: event.book.title }
        : null;
    case "rated":
      return event.book ? { ...base, action: "rated" as const, bookTitle: event.book.title } : null;
    case "joined_club":
      return event.club ? { ...base, action: "joined_club" as const, clubName: event.club.name } : null;
    default:
      return null;
  }
}

// ── Cold-start book fallback ──────────────────────────────────────────────────

async function fetchPopularBooks(userId: string) {
  return db.book.findMany({
    where: { userBooks: { none: { userId } } },
    orderBy: [{ ratingsCount: "desc" }],
    take: 8,
    select: { id: true, title: true, author: true, cover: true, genres: true },
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const session = await getSession();
  const userId = session!.user.id;
  const firstName = session?.user.name?.split(" ")[0] ?? "there";

  const [currentBook, recentBooks, goal, rawMatches, ratedCount, followingData] =
    await Promise.all([
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
      db.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
    ]);

  const booksReadThisYear = goal
    ? await db.userBook.count({ where: { userId, status: "READ" } })
    : 0;

  const currentPercent = currentBook?.book.pageCount
    ? Math.round((currentBook.progress / currentBook.book.pageCount) * 100)
    : 0;

  const followingSet = new Set(followingData.map((f) => f.followingId));

  // ── Section A: Top Picks for You ─────────────────────────────────────────────
  const candidates = applyThreshold(rawMatches.bookMatches);
  const triggerGroupMap = new Map<string, ScoredBook[]>();
  const nonTriggerBooks: ScoredBook[] = [];

  for (const bm of candidates) {
    const trigger = extractTriggerBook(bm.match.matchReasons);
    if (trigger) {
      const arr = triggerGroupMap.get(trigger) ?? [];
      arr.push(bm);
      triggerGroupMap.set(trigger, arr);
    } else {
      nonTriggerBooks.push(bm);
    }
  }

  const topPicksSource = nonTriggerBooks.length >= 3 ? nonTriggerBooks : candidates;
  const topPicksDisplay: ScoredBook[] = diversify(
    topPicksSource,
    (r) => [...r.book.genres].sort().join("|")
  ).slice(0, 12);

  const bookTopMatch =
    topPicksDisplay.length >= 2 &&
    topPicksDisplay[0].match.score - topPicksDisplay[1].match.score >= 8;

  // ── Section B: Because You Liked [X] ────────────────────────────────────────
  const triggerEntries = Array.from(triggerGroupMap.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );
  const triggerTitle = triggerEntries[0]?.[0] ?? null;
  const triggerGroup: ScoredBook[] = triggerEntries[0]?.[1]?.slice(0, 8) ?? [];

  // ── Section C: Explore Something Different ────────────────────────────────────
  const exploratoryBooksDisplay: ScoredBook[] = rawMatches.exploratoryBooks.slice(0, 3);

  // ── People to Follow ──────────────────────────────────────────────────────────
  const peopleToFollow: ScoredUser[] = diversify(
    applyThreshold(rawMatches.userMatches),
    (r) => [...r.match.sharedGenres].sort().join("|")
  ).slice(0, 6);

  // ── Clubs You'd Love ─────────────────────────────────────────────────────────
  const clubsForDisplay: ScoredClub[] = diversify(
    applyThreshold(rawMatches.clubMatches),
    (r) => [...r.club.genres].sort().join("|")
  ).slice(0, 6);

  // Fetch cadences, popular books (cold start), and real activity in parallel
  const matchedClubIds = clubsForDisplay.map((c) => c.club.id);
  const actorIds = [userId, ...followingData.map((f) => f.followingId)];

  const [clubCadenceRows, popularBooks, rawActivityEvents] = await Promise.all([
    matchedClubIds.length > 0
      ? db.club.findMany({
          where: { id: { in: matchedClubIds } },
          select: { id: true, meetingCadence: true },
        })
      : Promise.resolve([]),
    topPicksDisplay.length === 0 ? fetchPopularBooks(userId) : Promise.resolve([]),
    db.activityEvent.findMany({
      where: { userId: { in: actorIds } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        book: { select: { id: true, title: true } },
        club: { select: { id: true, name: true } },
      },
    }),
  ]);

  const cadenceMap = new Map(clubCadenceRows.map((c) => [c.id, c.meetingCadence]));
  const activityItems: ActivityItem[] = rawActivityEvents
    .map(mapToActivityItem)
    .filter((item): item is ActivityItem => item !== null);

  return (
    <div className="p-6 max-w-4xl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Good reading, {firstName}</h1>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {ratedCount > 0
              ? `Recommendations based on ${ratedCount} book${ratedCount === 1 ? "" : "s"} you've rated`
              : "Rate books to unlock personalised recommendations"}
          </p>
          <Link
            href="/how-it-works"
            className="text-xs text-emerald-400 hover:underline shrink-0 ml-4"
          >
            How it works
          </Link>
        </div>
      </div>

      {/* Search */}
      <SearchBar />

      {/* Friend Activity */}
      {activityItems.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Friend Activity
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activityItems.map((item) => (
              <ActivityCard key={item.id} {...item} />
            ))}
          </div>
        </section>
      )}

      {/* Section A: Top Picks for You */}
      <section className="mb-8">
        {topPicksDisplay.length > 0 ? (
          <>
            <div className="mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Top Picks for You
              </h2>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Based on your reading taste</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
              {topPicksDisplay.map(({ book, match }, i) => (
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
                  featured={i === 0}
                  topMatch={i === 0 && bookTopMatch}
                  targetId={book.id}
                />
              ))}
            </div>
          </>
        ) : popularBooks.length > 0 ? (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Popular right now
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
              {(
                popularBooks as Array<{
                  id: string;
                  title: string;
                  author: string;
                  cover: string | null;
                }>
              ).map((b) => (
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
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Top Picks for You
            </h2>
            <p className="text-sm text-muted-foreground mb-1">
              Rate a few books and we&apos;ll find titles you&apos;ll love.
            </p>
            <Link href="/library" className="text-xs text-emerald-400 hover:underline">
              Browse your library →
            </Link>
          </div>
        )}
      </section>

      {/* Section B: Because You Liked [X] */}
      {triggerTitle && triggerGroup.length >= 2 && (
        <section className="mb-8">
          <div className="mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Because You Liked{" "}
              <span className="text-emerald-400 normal-case">{triggerTitle}</span>
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
            {triggerGroup.map(({ book, match }) => (
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
                targetId={book.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Section C: Explore Something Different */}
      {exploratoryBooksDisplay.length > 0 && (
        <section className="mb-10 bg-card/40 border border-border/60 rounded-xl p-4">
          <div className="mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Explore Something Different
            </h2>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Outside your usual genres — selected because they match your reading style
            </p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
            {exploratoryBooksDisplay.map(({ book, match }) => (
              <MatchCard
                key={book.id}
                variant="book"
                title={book.title}
                subtitle={book.author}
                coverImage={book.cover ?? null}
                score={match.score}
                confidence={match.confidence}
                reasons={match.matchReasons}
                exploratory
                targetId={book.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* People to Follow */}
      {peopleToFollow.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              People to Follow
            </h2>
            <Link href="/discover" className="text-xs text-emerald-400 hover:underline">
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {peopleToFollow.map(({ user, match }) => (
              <PeopleSuggestion
                key={user.id}
                userId={user.id}
                name={user.name ?? user.username ?? "Reader"}
                username={user.username}
                avatar={user.avatar}
                matchScore={match.score}
                sharedGenres={match.sharedGenres}
                isFollowing={followingSet.has(user.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Clubs You'd Love */}
      {clubsForDisplay.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Clubs You&apos;d Love
            </h2>
            <Link href="/clubs" className="text-xs text-emerald-400 hover:underline">
              Browse all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {clubsForDisplay.map(({ club, match }) => (
              <ClubSuggestionCard
                key={club.id}
                clubId={club.id}
                name={club.name}
                avatar={club.avatar}
                cadence={cadenceMap.get(club.id)}
                memberCount={club._count.members}
                matchScore={match.score}
                matchReason={match.matchReasons[0]}
              />
            ))}
          </div>
        </section>
      )}

      {/* Currently reading */}
      {currentBook && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Currently reading
          </h2>
          <div className="bg-card border border-border rounded-xl p-4 flex gap-4 items-start max-w-lg">
            <div className="flex-shrink-0">
              {currentBook.book.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentBook.book.cover}
                  alt=""
                  className="h-20 w-14 object-cover rounded-md shadow"
                />
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
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${currentPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {currentBook.progress} / {currentBook.book.pageCount ?? "?"} pages
                </span>
                <span>{currentPercent}%</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Reading goal */}
      {goal && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Reading goal {new Date().getFullYear()}
          </h2>
          <div className="bg-card border border-border rounded-xl p-4 max-w-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white font-medium">
                {booksReadThisYear} of {goal.target} books
              </span>
              <span className="text-xs text-emerald-400">
                {Math.round((booksReadThisYear / goal.target) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round((booksReadThisYear / goal.target) * 100))}%`,
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Recently read */}
      {recentBooks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Recently read
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentBooks.map((ub) => (
              <div key={ub.id} className="group">
                <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden mb-2 shadow">
                  {ub.book.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ub.book.cover}
                      alt=""
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
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

      {/* Empty state */}
      {!currentBook && recentBooks.length === 0 && topPicksDisplay.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium mb-2 text-white">Your reading journey starts here</p>
          <p className="text-xs mb-1">Start by rating a few books you&apos;ve already read.</p>
          <p className="text-xs mb-5 opacity-70">
            Even 3–5 ratings unlock personalised recommendations.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/library"
              className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
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
