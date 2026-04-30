import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { BookOpen, Heart, Rss, Star, Users } from "lucide-react";

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

function ActivityIcon({ type }: { type: string }) {
  if (type === "joined_club" || type === "followed") return <Users className="h-4 w-4 text-secondary" />;
  if (type === "rated") return <Star className="h-4 w-4 text-primary" />;
  return <BookOpen className="h-4 w-4 text-primary" />;
}

export default async function FeedPage() {
  const session = await getSession();
  const userId = session!.user.id;

  const [following, activities] = await Promise.all([
    db.follow.count({ where: { followerId: userId } }),
    db.activityEvent.findMany({
      include: {
        user: { select: { name: true, username: true, avatar: true } },
        book: { select: { title: true, author: true, cover: true } },
        club: { select: { name: true } },
        targetUser: { select: { name: true, username: true } },
        likes: { select: { userId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div className="px-6 py-8 max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Social reading</p>
        <h1 className="text-3xl font-bold text-foreground mb-2">Feed</h1>
        <p className="text-sm text-muted-foreground">
          Recent reading activity from the Folio community. Follow more readers to make this stream feel more personal.
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Rss className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Your social graph</p>
            <p className="text-xs text-muted-foreground">
              You follow {following} reader{following === 1 ? "" : "s"}.
            </p>
          </div>
        </div>
      </div>

      {activities.length > 0 ? (
        <div className="space-y-0">
          {activities.map((activity) => {
            const likedByYou = activity.likes.some((like) => like.userId === userId);
            return (
              <article key={activity.id} className="flex gap-3 border-b border-border/50 py-4">
                <div className="mt-0.5 h-9 w-9 rounded-full bg-accent flex items-center justify-center overflow-hidden flex-shrink-0">
                  {activity.user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activity.user.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ActivityIcon type={activity.type} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {activityText(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(activity.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className={`h-3.5 w-3.5 ${likedByYou ? "fill-secondary text-secondary" : ""}`} />
                  {activity.likes.length}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-base font-semibold text-foreground">No activity yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Start, finish, or rate books to create activity for the feed.
          </p>
        </div>
      )}
    </div>
  );
}
