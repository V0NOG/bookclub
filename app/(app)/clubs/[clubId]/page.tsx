import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CalendarDays, MessageCircle, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { ClubMembershipButton } from "@/components/clubs/club-membership-button";

export default async function ClubDetailPage({ params }: { params: { clubId: string } }) {
  const session = await getSession();
  const userId = session!.user.id;

  const club = await db.club.findUnique({
    where: { id: params.clubId },
    include: {
      currentBook: { select: { id: true, title: true, author: true, cover: true } },
      upcomingBook: { select: { id: true, title: true, author: true, cover: true } },
      members: {
        include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
        orderBy: { joinedAt: "asc" },
        take: 8,
      },
      posts: { orderBy: { createdAt: "desc" }, take: 4 },
      polls: { orderBy: { createdAt: "desc" }, take: 3 },
      challenges: { orderBy: { createdAt: "desc" }, take: 3, include: { participants: true } },
      _count: { select: { members: true } },
    },
  });

  if (!club) notFound();

  const membership = club.members.find((member) => member.userId === userId);
  const isJoined = Boolean(membership);
  const isOwner = club.ownerId === userId;
  const latestActivityAt = [
    ...club.posts.map((post) => post.createdAt),
    ...club.polls.map((poll) => poll.createdAt),
    ...club.challenges.map((challenge) => challenge.createdAt),
    ...club.members.map((member) => member.joinedAt),
  ].sort((a, b) => b.getTime() - a.getTime())[0];
  const activeLabel = latestActivityAt
    ? `Active ${new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(latestActivityAt)}`
    : "Ready for first activity";
  const activityItems = [
    ...club.posts.map((post) => ({
      id: `post-${post.id}`,
      title: post.title ?? "Club post",
      body: post.content,
      meta: new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(post.createdAt),
      icon: MessageCircle,
    })),
    ...club.polls.map((poll) => ({
      id: `poll-${poll.id}`,
      title: poll.title,
      body: poll.description ?? "Voting is open for this club poll.",
      meta: poll.status.toLowerCase(),
      icon: CalendarDays,
    })),
    ...club.challenges.map((challenge) => ({
      id: `challenge-${challenge.id}`,
      title: challenge.title,
      body: challenge.description ?? `${challenge.participants.length} participant${challenge.participants.length === 1 ? "" : "s"}`,
      meta: "challenge",
      icon: CalendarDays,
    })),
  ].slice(0, 6);

  return (
    <div className="w-full max-w-7xl px-6 py-8">
      <Link href="/clubs" className="folio-press inline-flex rounded-full px-2 py-1 text-sm text-primary hover:bg-primary/10">
        Back to clubs
      </Link>

      <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <div className="folio-cover flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
              {club.avatar ? (
                <Image src={club.avatar} alt="" width={64} height={64} unoptimized className="h-full w-full object-cover" />
              ) : (
                <Users className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Club</p>
              <h1 className="text-3xl font-bold text-foreground">{club.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {club._count.members} member{club._count.members === 1 ? "" : "s"}
                {club.meetingCadence ? ` · ${club.meetingCadence}` : ""}
                {club.location ? ` · ${club.location}` : ""}
              </p>
              <p className="mt-2 inline-flex rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                {activeLabel}
              </p>
            </div>
          </div>

          {club.description && (
            <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted-foreground">{club.description}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {(club.genres.length ? club.genres : ["Reading club"]).map((genre) => (
              <span key={genre} className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground">
                {genre}
              </span>
            ))}
          </div>

          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">Club activity</h2>
              <span className="text-xs text-secondary">{activityItems.length} recent signal{activityItems.length === 1 ? "" : "s"}</span>
            </div>
            {activityItems.length > 0 ? (
              <div className="space-y-0">
                {activityItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.id} className={`folio-lift -mx-2 rounded-lg border-b border-border/50 px-2 py-4 hover:bg-card/45 ${index === 0 ? "folio-updated" : ""}`}>
                      <div className="flex gap-3">
                        <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-card">
                          <Icon className="h-4 w-4 text-primary" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                          <p className="mt-2 text-[11px] text-muted-foreground/80">{item.meta}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Club posts, polls, and challenges will appear here.
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-foreground">Membership</h2>
              <ClubMembershipButton clubId={club.id} initialJoined={isJoined} disabled={isOwner} />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {isOwner
                ? "You own this club."
                : isJoined
                  ? "You are a member of this club."
                  : club.membershipType === "OPEN"
                    ? "This club is open to join."
                    : "This club is not open to join directly."}
            </p>
          </div>

          {(club.currentBook || club.upcomingBook) && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-foreground">Reading list</h2>
              {[club.currentBook, club.upcomingBook].filter(Boolean).map((book) => (
                <Link key={book!.id} href={`/books/${book!.id}`} className="flex gap-3 rounded-lg py-2 hover:text-primary">
                  {book!.cover ? (
                    <div className="folio-cover h-14 w-10 flex-shrink-0 overflow-hidden rounded bg-muted">
                      <Image src={book!.cover} alt="" width={40} height={56} unoptimized className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-14 w-10 flex-shrink-0 items-center justify-center rounded bg-muted">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">{book!.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{book!.author}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Members</h2>
            <div className="mb-4 flex -space-x-2">
              {club.members.slice(0, 5).map((member) => (
                <div key={`presence-${member.id}`} className="folio-cover flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-secondary/20">
                  {member.user.avatar ? (
                    <Image src={member.user.avatar} alt="" width={32} height={32} unoptimized className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-secondary">{(member.user.name ?? member.user.username ?? "R")[0]}</span>
                  )}
                </div>
              ))}
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              {club.members.length} member{club.members.length === 1 ? "" : "s"} recently present in this club.
            </p>
            <div className="space-y-3">
              {club.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="folio-cover flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-secondary/20">
                    {member.user.avatar ? (
                      <Image src={member.user.avatar} alt="" width={32} height={32} unoptimized className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-semibold text-secondary">{(member.user.name ?? member.user.username ?? "R")[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{member.user.name ?? member.user.username ?? "Reader"}</p>
                    <p className="text-xs text-muted-foreground">{member.role.toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
