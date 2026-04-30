import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { BookOpen, Library, MapPin, Sparkles, Star, Users } from "lucide-react";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-b border-border/60 py-3">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await getSession();
  const userId = session!.user.id;

  const [
    user,
    booksRead,
    currentlyReading,
    wantToRead,
    followers,
    following,
    clubs,
    recentReads,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        username: true,
        avatar: true,
        bio: true,
        location: true,
        userType: true,
        createdAt: true,
        tasteProfile: {
          select: {
            topGenres: true,
            topAuthors: true,
            topMoods: true,
            cluster: true,
            confidence: true,
          },
        },
      },
    }),
    db.userBook.count({ where: { userId, status: "READ" } }),
    db.userBook.count({ where: { userId, status: "CURRENTLY_READING" } }),
    db.userBook.count({ where: { userId, status: "WANT_TO_READ" } }),
    db.follow.count({ where: { followingId: userId } }),
    db.follow.count({ where: { followerId: userId } }),
    db.clubMember.count({ where: { userId } }),
    db.userBook.findMany({
      where: { userId, status: "READ" },
      include: { book: { select: { title: true, author: true, cover: true } } },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
  ]);

  const displayName = user?.name ?? user?.username ?? "Reader";
  const initials = displayName.slice(0, 1).toUpperCase();
  const taste = user?.tasteProfile;

  return (
    <div className="px-6 py-8 max-w-4xl">
      <section className="mb-10 border-b border-border/60 pb-8">
        <div className="flex items-start gap-5">
          <div className="h-20 w-20 rounded-xl bg-secondary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-secondary">{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">You</p>
            <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
              {user?.username && <span>@{user.username}</span>}
              {user?.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {user.location}
                </span>
              )}
              <span>{user?.userType?.toLowerCase().replace("_", " ") ?? "reader"}</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {user?.bio ?? "Your profile gathers the signals Folio uses to shape recommendations: ratings, reading progress, clubs, and taste preferences."}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Taste profile
            </h2>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {taste?.cluster ?? "Taste profile building"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Confidence: {taste?.confidence?.toLowerCase() ?? "low"}
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {booksRead} rated/read
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {(taste?.topGenres?.length ? taste.topGenres : ["Rate books to unlock genres"]).slice(0, 6).map((genre) => (
                      <span key={genre} className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Moods</p>
                  <div className="flex flex-wrap gap-2">
                    {(taste?.topMoods?.length ? taste.topMoods : ["Atmospheric", "Character-driven", "Curious"]).slice(0, 6).map((mood) => (
                      <span key={mood} className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs text-secondary">
                        {mood}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Recent reads
            </h2>
            {recentReads.length > 0 ? (
              <div className="space-y-0">
                {recentReads.map(({ id, book, rating }) => (
                  <div key={id} className="flex items-center gap-3 border-b border-border/50 py-3">
                    {book.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.cover} alt="" className="h-12 w-8 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-8 rounded bg-muted flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground">{book.author}</p>
                    </div>
                    {rating && <span className="text-xs font-semibold text-primary">{rating}/5</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Mark books as read to build a visible reading history.
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Library className="h-4 w-4 text-primary" />
              Reading stats
            </h2>
            <Stat label="Books read" value={booksRead} />
            <Stat label="Currently reading" value={currentlyReading} />
            <Stat label="Want to read" value={wantToRead} />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Community
            </h2>
            <Stat label="Followers" value={followers} />
            <Stat label="Following" value={following} />
            <Stat label="Clubs joined" value={clubs} />
          </div>
        </aside>
      </div>
    </div>
  );
}
