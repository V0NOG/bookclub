import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { BookOpen, Rss } from "lucide-react";
import { FeedActivityRow } from "@/components/feed/feed-activity-row";
import Link from "next/link";

function activityText(activity: {
  type: string;
  user: { name: string | null; username: string | null };
  book: { title: string; author: string } | null;
  club: { name: string } | null;
  targetUser: { name: string | null; username: string | null } | null;
}) {
  const actor = activity.user.name ?? activity.user.username ?? "A reader";
  const book = activity.book ? `${activity.book.title} by ${activity.book.author}` : "a book";
  const club = activity.club?.name ?? "a club";
  const target = activity.targetUser?.name ?? activity.targetUser?.username ?? "another reader";

  switch (activity.type) {
    case "finished":
      return `${actor} finished ${book}`;
    case "started":
      return `${actor} started ${book}`;
    case "rated":
      return `${actor} rated ${book}`;
    case "followed":
      return `${actor} followed ${target}`;
    case "joined_club":
      return `${actor} joined ${club}`;
    default:
      return `${actor} updated their reading activity`;
  }
}

function activityContext(activity: {
  type: string;
  user: { id: string };
  book: { author: string; genres: string[] } | null;
}, params: {
  userId: string;
  followingIds: Set<string>;
  likedAuthors: Set<string>;
  likedGenres: Set<string>;
  topGenres: Set<string>;
}) {
  if (activity.user.id === params.userId) return "Your activity helps Folio tune future recommendations.";
  if (activity.book) {
    const genreOverlap = activity.book.genres.some((genre) => params.likedGenres.has(genre) || params.topGenres.has(genre));
    if (params.likedAuthors.has(activity.book.author) || genreOverlap) {
      return "Because you rated similar books highly.";
    }
    if (activity.type === "started" || activity.type === "finished" || activity.type === "rated") {
      return "Readers with similar taste also read this.";
    }
  }
  if (params.followingIds.has(activity.user.id)) return "From someone you follow.";
  return "Popular among readers near your taste profile.";
}

export default async function FeedPage({ searchParams }: { searchParams?: { view?: string } }) {
  const session = await getSession();
  const userId = session!.user.id;
  const view = searchParams?.view === "social" ? "social" : "for-you";

  const [following, tasteProfile, likedBooks] = await Promise.all([
    db.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
    db.tasteProfile.findUnique({ where: { userId }, select: { topGenres: true } }),
    db.userBook.findMany({
      where: { userId, rating: { gte: 4 } },
      include: { book: { select: { author: true, genres: true } } },
      take: 50,
    }),
  ]);

  const followingSet = new Set(following.map((f) => f.followingId));
  const activityWhere = view === "social"
    ? { userId: { in: [userId, ...following.map((f) => f.followingId)] } }
    : {};

  const activities = await db.activityEvent.findMany({
    where: activityWhere,
    include: {
      user: { select: { id: true, name: true, username: true, avatar: true } },
      book: { select: { id: true, title: true, author: true, cover: true, genres: true } },
      club: { select: { name: true } },
      targetUser: { select: { name: true, username: true } },
      likes: { select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const likedAuthors = new Set(likedBooks.map((entry) => entry.book.author));
  const likedGenres = new Set(likedBooks.flatMap((entry) => entry.book.genres));
  const topGenres = new Set(tasteProfile?.topGenres ?? []);

  return (
    <div className="w-full max-w-7xl px-6 py-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Social reading</p>
        <h1 className="text-3xl font-bold text-foreground mb-2">Feed</h1>
        <p className="text-sm text-muted-foreground">
          Recent reading activity from the Folio community. Follow more readers to make this stream feel more personal.
        </p>
      </div>

      <div className="folio-lift mb-8 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Rss className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Your social graph</p>
            <p className="text-xs text-muted-foreground">
              You follow {following.length} reader{following.length === 1 ? "" : "s"}.
            </p>
          </div>
          <div className="ml-auto flex rounded-full border border-border bg-background p-1">
            <Link
              href="/feed"
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${view === "for-you" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              For you
            </Link>
            <Link
              href="/feed?view=social"
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${view === "social" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Social feed
            </Link>
          </div>
        </div>
      </div>

      {activities.length > 0 ? (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,760px)_340px]">
          <div className="min-w-0 space-y-0">
          {activities.map((activity) => {
            const likedByYou = activity.likes.some((like) => like.userId === userId);
            return (
              <FeedActivityRow
                key={activity.id}
                id={activity.id}
                actorId={activity.user.id}
                actorName={activity.user.name ?? activity.user.username ?? "Reader"}
                actorAvatar={activity.user.avatar}
                type={activity.type}
                text={activityText(activity)}
                timestamp={new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(activity.createdAt)}
                context={activityContext(activity, {
                  userId,
                  followingIds: followingSet,
                  likedAuthors,
                  likedGenres,
                  topGenres,
                })}
                bookId={activity.book?.id}
                likeCount={activity.likes.length}
                isLiked={likedByYou}
                isFollowing={followingSet.has(activity.user.id)}
                isCurrentUser={activity.user.id === userId}
              />
            );
          })}
          </div>
          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <div className="folio-lift rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Why these appear</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Folio weighs your ratings, followed readers, and taste profile to explain which activity is most relevant.
              </p>
            </div>
            <div className="folio-lift rounded-xl border border-border bg-card p-5">
              <p className="text-2xl font-bold text-foreground">{activities.length}</p>
              <p className="text-xs text-muted-foreground">Recent community signals</p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="folio-lift rounded-xl border border-border bg-card p-8 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-base font-semibold text-foreground">No activity yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Start, finish, or rate books to create activity for the feed.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/discover" className="folio-press folio-cta rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
              Follow readers
            </Link>
            <Link href="/library" className="folio-press rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent">
              Rate books
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
