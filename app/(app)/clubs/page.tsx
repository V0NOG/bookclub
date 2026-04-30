import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { getMatchesForUser } from "@/lib/matching/cache";
import { ClubSuggestionCard } from "@/components/clubs/club-suggestion-card";
import { ClubMembershipButton } from "@/components/clubs/club-membership-button";
import Link from "next/link";
import { Users, Plus } from "lucide-react";

export default async function ClubsPage() {
  const session = await getSession();
  const userId = session!.user.id;

  const [memberships, matches] = await Promise.all([
    db.clubMember.findMany({
      where: { userId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            avatar: true,
            meetingCadence: true,
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    }),
    getMatchesForUser(userId),
  ]);

  const joinedClubIds = new Set(memberships.map((m) => m.clubId));
  const suggestedClubs = matches.clubMatches
    .filter((c) => !joinedClubIds.has(c.club.id))
    .slice(0, 6);

  const suggestedIds = suggestedClubs.map((c) => c.club.id);
  const cadenceRows = suggestedIds.length > 0
    ? await db.club.findMany({
        where: { id: { in: suggestedIds } },
        select: { id: true, meetingCadence: true },
      })
    : [];
  const cadenceMap = new Map(cadenceRows.map((c) => [c.id, c.meetingCadence]));

  return (
    <div className="px-6 py-8 max-w-3xl">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Clubs</h1>
          <p className="text-sm text-muted-foreground">
            {memberships.length === 0
              ? "Join clubs to read with others"
              : `${memberships.length} club${memberships.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/clubs/create"
          className="flex items-center gap-1.5 text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create
        </Link>
      </div>

      {memberships.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-foreground mb-4">Your clubs</h2>
          <div className="space-y-0">
            {memberships.map(({ club, role }) => (
              <div
                key={club.id}
                className="flex items-center gap-3 py-4 border-b border-border/50 group hover:bg-muted/30 -mx-2 px-2 rounded transition-colors"
              >
                {club.avatar ? (
                  <img src={club.avatar} alt="" className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/clubs/${club.id}`} className="block text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {club.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {club._count.members} member{club._count.members !== 1 ? "s" : ""}
                    {club.meetingCadence ? ` · ${club.meetingCadence.toLowerCase()}` : ""}
                  </p>
                </div>
                {role !== "MEMBER" && (
                  <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    {role.toLowerCase()}
                  </span>
                )}
                <ClubMembershipButton clubId={club.id} initialJoined disabled={role !== "MEMBER"} />
              </div>
            ))}
          </div>
        </section>
      )}

      {suggestedClubs.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-foreground mb-1">
            {memberships.length === 0 ? "Clubs matched to your taste" : "Discover more clubs"}
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Matched based on your reading taste profile</p>
          <div className="space-y-0">
            {suggestedClubs.map(({ club, match }) => (
              <div key={club.id} className="flex items-center gap-3 border-b border-border/40">
                <div className="flex-1 min-w-0">
                  <ClubSuggestionCard
                    clubId={club.id}
                    name={club.name}
                    avatar={club.avatar}
                    cadence={cadenceMap.get(club.id)}
                    memberCount={club._count.members}
                    matchScore={match.score}
                    matchReason={match.matchReasons[0]}
                  />
                </div>
                <ClubMembershipButton clubId={club.id} initialJoined={false} />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/discover" className="text-sm text-primary hover:underline">
              See all club recommendations →
            </Link>
          </div>
        </section>
      )}

      {memberships.length === 0 && suggestedClubs.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-4 opacity-25" />
          <p className="text-base font-semibold mb-2 text-foreground">No clubs yet</p>
          <p className="text-sm mb-8">Rate books in your library to get matched with clubs that suit your taste.</p>
          <Link
            href="/library"
            className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg transition-colors"
          >
            Go to library
          </Link>
        </div>
      )}
    </div>
  );
}
