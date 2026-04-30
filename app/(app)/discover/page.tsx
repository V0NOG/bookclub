import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { Compass } from "lucide-react";
import Link from "next/link";
import { getMatchesForUser } from "@/lib/matching/cache";
import { MatchCard } from "@/components/match/MatchCard";
import { SearchBar } from "@/components/feed/search-bar";
import { PeopleSuggestion } from "@/components/feed/people-suggestion";
import { ClubSuggestionCard } from "@/components/clubs/club-suggestion-card";

export default async function DiscoverPage() {
  const session = await getSession();
  const userId = session!.user.id;

  const [rawMatches, ratedCount, followingData] = await Promise.all([
    getMatchesForUser(userId),
    db.userBook.count({ where: { userId, rating: { not: null } } }),
    db.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
  ]);

  const followingSet = new Set(followingData.map((f) => f.followingId));

  const topBooks = rawMatches.bookMatches.slice(0, 12);
  const topPeople = rawMatches.userMatches.slice(0, 6);
  const topClubs = rawMatches.clubMatches.slice(0, 6);
  const exploratoryBooks = rawMatches.exploratoryBooks.slice(0, 4);

  const matchedClubIds = topClubs.map((c) => c.club.id);
  const cadenceRows = matchedClubIds.length > 0
    ? await db.club.findMany({
        where: { id: { in: matchedClubIds } },
        select: { id: true, meetingCadence: true },
      })
    : [];
  const cadenceMap = new Map(cadenceRows.map((c) => [c.id, c.meetingCadence]));

  const hasMatches = topBooks.length > 0 || topPeople.length > 0 || topClubs.length > 0;

  return (
    <div className="px-6 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Discover</h1>
        <p className="text-sm text-muted-foreground">
          {ratedCount > 0
            ? "Books, readers, and clubs matched to your taste"
            : "Rate books in your library to unlock personalised recommendations"}
        </p>
      </div>

      <SearchBar />

      {!hasMatches && (
        <div className="text-center py-20 text-muted-foreground">
          <Compass className="h-10 w-10 mx-auto mb-4 opacity-25" />
          <p className="text-base font-semibold mb-2 text-foreground">Rate a few books to get started</p>
          <p className="text-sm mb-8">Your recommendations unlock after 3–5 ratings.</p>
          <Link
            href="/library"
            className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg transition-colors"
          >
            Go to library
          </Link>
        </div>
      )}

      {topBooks.length > 0 && (
        <section className="mt-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recommended for you</h2>
            <Link href="/library" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Rate more books
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
            {topBooks.map(({ book, match }, idx) => (
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
                featured={idx === 0}
                targetId={book.id}
              />
            ))}
          </div>
        </section>
      )}

      {exploratoryBooks.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground mb-1">Explore something different</h2>
          <p className="text-xs text-muted-foreground mb-4">Outside your usual genres, matched to your reading style</p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
            {exploratoryBooks.map(({ book, match }) => (
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

      {topPeople.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">Readers similar to you</h2>
          <div>
            {topPeople.slice(0, 4).map(({ user, match }) => (
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

      {topClubs.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">Clubs matched to your taste</h2>
          <div>
            {topClubs.slice(0, 4).map(({ club, match }) => (
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
    </div>
  );
}
