import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { CalendarDays, Trophy, Users } from "lucide-react";
import { ChallengeToggleButton } from "@/components/challenges/challenge-toggle-button";

function ChallengeCard({
  title,
  description,
  dates,
  meta,
  joined,
  challengeId,
}: {
  challengeId: string;
  title: string;
  description?: string | null;
  dates: string;
  meta: string;
  joined?: boolean;
}) {
  return (
    <article className="border-b border-border/50 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {dates}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {meta}
            </span>
          </div>
        </div>
        <ChallengeToggleButton challengeId={challengeId} initialJoined={Boolean(joined)} />
      </div>
    </article>
  );
}

export default async function ChallengesPage() {
  const session = await getSession();
  const userId = session!.user.id;

  const memberships = await db.challengeParticipant.findMany({
    where: { userId },
    select: { challengeId: true },
  });
  const joinedIds = new Set(memberships.map((m) => m.challengeId));
  const joinedIdList = Array.from(joinedIds);

  const [joinedChallenges, openChallenges] = await Promise.all([
    joinedIdList.length
      ? db.readingChallenge.findMany({
          where: { id: { in: joinedIdList } },
          include: { participants: true, book: true, club: true },
          orderBy: { endDate: "asc" },
        })
      : [],
    db.readingChallenge.findMany({
      where: { isPublic: true, id: { notIn: joinedIdList } },
      include: { participants: true, book: true, club: true },
      orderBy: { startDate: "asc" },
      take: 8,
    }),
  ]);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);

  return (
    <div className="w-full max-w-7xl px-6 py-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Reading goals</p>
        <h1 className="text-3xl font-bold text-foreground mb-2">Challenges</h1>
        <p className="text-sm text-muted-foreground">
          Join lightweight reading challenges from clubs and the wider Folio community.
        </p>
      </div>

      <div className="grid gap-10 xl:grid-cols-2">
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          Your challenges
        </h2>
        {joinedChallenges.length > 0 ? (
          <div>
            {joinedChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challengeId={challenge.id}
                title={challenge.title}
                description={challenge.description}
                dates={`${formatDate(challenge.startDate)} - ${formatDate(challenge.endDate)}`}
                meta={`${challenge.participants.length} participant${challenge.participants.length === 1 ? "" : "s"}`}
                joined
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            You have not joined a challenge yet. Open community challenges are listed below.
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Open challenges</h2>
        {openChallenges.length > 0 ? (
          <div>
            {openChallenges.map((challenge) => {
              const meta = [
                `${challenge.participants.length} participant${challenge.participants.length === 1 ? "" : "s"}`,
                challenge.club?.name,
                challenge.book?.title,
              ].filter(Boolean).join(" · ");
              return (
                <ChallengeCard
                  key={challenge.id}
                  challengeId={challenge.id}
                  title={challenge.title}
                  description={challenge.description}
                  dates={`${formatDate(challenge.startDate)} - ${formatDate(challenge.endDate)}`}
                  meta={meta}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-base font-semibold text-foreground">No open challenges</p>
            <p className="text-sm text-muted-foreground mt-2">Club and public challenges will appear here when available.</p>
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
