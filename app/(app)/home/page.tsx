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
  userId: string;
  bookId: string | null;
  type: string;
  createdAt: Date;
  user: { id: string; name: string | null; username: string | null; avatar: string | null };
  book: { id: string; title: string } | null;
  club: { id: string; name: string } | null;
  likes: { activityId: string }[];
  _count: { likes: number };
};

type FeedScore = {
  score: number;
  debug: { recencyScore: number; tasteMatchScore: number; userMatchScore: number; interactionBoost: number; finalScore: number };
};

function scoreFeedItem(
  event: RawEvent,
  bookScoreMap: Map<string, number>,
  userScoreMap: Map<string, number>,
  likedBookIds: Set<string>
): FeedScore {
  const hoursElapsed = (Date.now() - event.createdAt.getTime()) / 3_600_000;
  const recencyScore = 1 / (hoursElapsed + 1);
  const tasteMatchScore = event.bookId ? (bookScoreMap.get(event.bookId) ?? 0) / 100 : 0;
  const userMatchScore = (userScoreMap.get(event.userId) ?? 0) / 100;
  const interactionBoost = event.bookId && likedBookIds.has(event.bookId) ? 0.05 : 0;
  const finalScore =
    0.5 * recencyScore + 0.3 * tasteMatchScore + 0.2 * userMatchScore + interactionBoost + Math.random() * 0.03;
  return { score: finalScore, debug: { recencyScore, tasteMatchScore, userMatchScore, interactionBoost, finalScore } };
}

function applyFeedDiversity(
  scored: Array<{ event: RawEvent; score: number }>
): Array<{ event: RawEvent; score: number }> {
  const perUser = new Map<string, number>();
  const perBook = new Map<string, number>();
  return scored.filter(({ event }) => {
    const userCount = perUser.get(event.userId) ?? 0;
    if (userCount >= 2) return false;
    const bookCount = event.bookId ? (perBook.get(event.bookId) ?? 0) : 0;
    if (event.bookId && bookCount >= 2) return false;
    perUser.set(event.userId, userCount + 1);
    if (event.bookId) perBook.set(event.bookId, bookCount + 1);
    return true;
  });
}

function mapToActivityItem(event: RawEvent): ActivityItem | null {
  const actorName = event.user.name ?? event.user.username ?? "Someone";
  const timestamp = formatTimestamp(event.createdAt);
  const likeCount = event._count.likes;
  const isLiked = event.likes.length > 0;
  const base = { id: event.id, actorName, actorAvatar: event.user.avatar, timestamp, likeCount, isLiked };

  switch (event.type) {
    case "finished":
    case "started":
      return event.book
        ? { ...base, action: event.type as "finished" | "started", bookTitle: event.book.title, bookId: event.book.id }
        : null;
    case "rated":
      return event.book
        ? { ...base, action: "rated" as const, bookTitle: event.book.title, bookId: event.book.id }
        : null;
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
      take: 20,
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        book: { select: { id: true, title: true } },
        club: { select: { id: true, name: true } },
        likes: { where: { userId }, select: { activityId: true } },
        _count: { select: { likes: true } },
      },
    }),
  ]);

  const cadenceMap = new Map(clubCadenceRows.map((c) => [c.id, c.meetingCadence]));

  const bookScoreMap = new Map(rawMatches.bookMatches.map((r) => [r.book.id, r.match.score]));
  const userScoreMap = new Map(rawMatches.userMatches.map((r) => [r.user.id, r.match.score]));

  const likedBookIds = new Set(
    rawActivityEvents
      .filter((e) => e.likes.length > 0 && e.bookId)
      .map((e) => e.bookId!)
  );

  const activityItems: ActivityItem[] = applyFeedDiversity(
    rawActivityEvents
      .map((event) => {
        const { score, debug } = scoreFeedItem(event, bookScoreMap, userScoreMap, likedBookIds);
        if (process.env.NODE_ENV === "development") {
          console.log(`[feed] ${event.type}@${event.userId}`, debug);
        }
        return { event, score };
      })
      .sort((a, b) => b.score - a.score)
  )
    .map(({ event }) => mapToActivityItem(event))
    .filter((item): item is ActivityItem => item !== null);

  // ── Build blended feed ────────────────────────────────────────────────────────

  type FeedSlot =
    | { kind: "activity"; item: ActivityItem }
    | { kind: "people"; items: ScoredUser[] }
    | { kind: "clubs"; items: ScoredClub[] }
    | { kind: "books"; label: string; sublabel?: string; items: ScoredBook[]; isTrigger?: boolean; triggerName?: string; isExploratory?: boolean }
    | { kind: "popular"; items: Array<{ id: string; title: string; author: string; cover: string | null }> }
    | { kind: "currently_reading" }
    | { kind: "reading_goal" }
    | { kind: "recently_read" };

  const suggPool: FeedSlot[] = [];

  if (topPicksDisplay.length > 0) {
    suggPool.push({ kind: "books", label: "Top Picks for You", sublabel: "Based on your reading taste", items: topPicksDisplay });
  } else if (popularBooks.length > 0) {
    suggPool.push({ kind: "popular", items: popularBooks as Array<{ id: string; title: string; author: string; cover: string | null }> });
  }
  if (peopleToFollow.length > 0) {
    suggPool.push({ kind: "people", items: peopleToFollow.slice(0, 2) });
  }
  if (clubsForDisplay.length > 0) {
    suggPool.push({ kind: "clubs", items: clubsForDisplay.slice(0, 2) });
  }
  if (triggerTitle && triggerGroup.length >= 2) {
    suggPool.push({ kind: "books", label: "Because you liked", items: triggerGroup, isTrigger: true, triggerName: triggerTitle });
  }
  if (exploratoryBooksDisplay.length > 0) {
    suggPool.push({ kind: "books", label: "Explore Something Different", sublabel: "Outside your usual genres", items: exploratoryBooksDisplay, isExploratory: true });
  }

  const contentSlots: FeedSlot[] = [];
  let sIdx = 0;
  for (let i = 0; i < activityItems.length; i++) {
    contentSlots.push({ kind: "activity", item: activityItems[i] });
    if ((i + 1) % 2 === 0 && sIdx < suggPool.length) {
      contentSlots.push(suggPool[sIdx++]);
    }
  }
  while (sIdx < suggPool.length) contentSlots.push(suggPool[sIdx++]);

  const anchorSlots: FeedSlot[] = [];
  if (currentBook) anchorSlots.push({ kind: "currently_reading" });
  if (goal) anchorSlots.push({ kind: "reading_goal" });
  if (recentBooks.length > 0) anchorSlots.push({ kind: "recently_read" });

  const feedSlots: FeedSlot[] = [...contentSlots, ...anchorSlots];
  const isEmpty = feedSlots.length === 0;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="px-6 py-8 max-w-3xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Good reading, {firstName}</h1>
        <p className="text-sm text-muted-foreground">
          {ratedCount > 0
            ? <>Personalised from {ratedCount} book{ratedCount === 1 ? "" : "s"} you&apos;ve rated{" · "}<Link href="/how-it-works" className="text-primary hover:underline">How it works</Link></>
            : "Rate books to unlock personalised recommendations"
          }
        </p>
      </div>

      {/* Search */}
      <SearchBar />

      {/* Today + feed */}
      {isEmpty ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-4 opacity-25" />
          <p className="text-base font-semibold mb-2 text-foreground">Your reading journey starts here</p>
          <p className="text-sm mb-1">Rate a few books you&apos;ve already read.</p>
          <p className="text-sm mb-8 opacity-60">Even 3–5 ratings unlock personalised recommendations.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/library" className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg transition-colors">
              Rate books
            </Link>
            <Link href="/how-it-works" className="text-sm text-primary hover:underline py-2.5">
              How it works
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Today</h2>
          </div>

          <div className="space-y-5">
            {feedSlots.map((slot, i) => {
              switch (slot.kind) {

                case "activity":
                  return <ActivityCard key={`a-${slot.item.id}`} {...slot.item} />;

                case "people":
                  return (
                    <div key={`people-${i}`} className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                          Readers like you
                        </span>
                        {peopleToFollow.length > 2 && (
                          <Link href="/discover" className="text-xs text-primary hover:underline">See all →</Link>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        {slot.items.map(({ user, match }) => (
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
                    </div>
                  );

                case "clubs":
                  return (
                    <div key={`clubs-${i}`} className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                          Clubs you&apos;d love
                        </span>
                        {clubsForDisplay.length > 2 && (
                          <Link href="/clubs" className="text-xs text-primary hover:underline">Browse all →</Link>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        {slot.items.map(({ club, match }) => (
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
                    </div>
                  );

                case "books":
                  return (
                    <div key={`books-${i}`} className="pt-2">
                      <div className="mb-3">
                        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                          {slot.isTrigger && slot.triggerName
                            ? <>Because you liked{" "}<span className="text-primary italic normal-case">{slot.triggerName}</span></>
                            : slot.label}
                        </span>
                        {slot.sublabel && (
                          <p className="text-xs text-muted-foreground/60 mt-0.5">{slot.sublabel}</p>
                        )}
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
                        {slot.items.map(({ book, match }, idx) => (
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
                            featured={idx === 0 && !slot.isExploratory && !slot.isTrigger}
                            topMatch={idx === 0 && bookTopMatch && !slot.isExploratory && !slot.isTrigger}
                            exploratory={slot.isExploratory}
                            targetId={book.id}
                          />
                        ))}
                      </div>
                    </div>
                  );

                case "popular":
                  return (
                    <div key={`popular-${i}`} className="pt-2">
                      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3 block">
                        Popular right now
                      </span>
                      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
                        {slot.items.map((b) => (
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
                    </div>
                  );

                case "currently_reading":
                  if (!currentBook) return null;
                  return (
                    <div key="currently-reading" className="pt-2">
                      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3 block">
                        On your nightstand
                      </span>
                      <div className="bg-card border border-border rounded-xl p-5 flex gap-4 items-start max-w-lg">
                        <div className="flex-shrink-0">
                          {currentBook.book.cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={currentBook.book.cover} alt="" className="h-20 w-14 object-cover rounded-md shadow-sm" />
                          ) : (
                            <div className="h-20 w-14 bg-muted rounded-md flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground italic truncate">{currentBook.book.title}</p>
                          <p className="text-sm text-muted-foreground mb-4">{currentBook.book.author}</p>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${currentPercent}%` }} />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{currentBook.progress} / {currentBook.book.pageCount ?? "?"} pages</span>
                            <span>{currentPercent}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                case "reading_goal":
                  if (!goal) return null;
                  return (
                    <div key="reading-goal" className="pt-2">
                      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3 block">
                        {new Date().getFullYear()} reading goal
                      </span>
                      <div className="bg-card border border-border rounded-xl p-5 max-w-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-foreground font-medium">
                            {booksReadThisYear} of {goal.target} books
                          </span>
                          <span className="text-xs text-primary font-semibold">
                            {Math.round((booksReadThisYear / goal.target) * 100)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.round((booksReadThisYear / goal.target) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );

                case "recently_read":
                  return (
                    <div key="recently-read" className="pt-2">
                      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3 block">
                        Recently read
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {recentBooks.map((ub) => (
                          <div key={ub.id} className="group">
                            <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden mb-2 shadow-sm">
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
                            <p className="text-sm font-medium text-foreground italic truncate">{ub.book.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{ub.book.author}</p>
                            {ub.rating && (
                              <div className="flex items-center gap-0.5 mt-1">
                                {Array.from({ length: ub.rating }).map((_, idx) => (
                                  <Star key={idx} className="h-3 w-3 fill-primary text-primary" />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
              }
            })}
          </div>
        </>
      )}
    </div>
  );
}
