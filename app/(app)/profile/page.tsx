import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { BookOpen, Library, MapPin, Sparkles, Star, Users } from "lucide-react";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-b border-border/60 py-3">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function formatNumber(value: number, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : "0.0";
}

function variance(values: number[]) {
  if (values.length < 2) return 0;
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length;
}

function buildTasteSummary({
  topGenres,
  topAuthors,
  topMoods,
  averageRating,
  ratingVariance,
  completionRate,
  pagesPerSession,
}: {
  topGenres: string[];
  topAuthors: string[];
  topMoods: string[];
  averageRating: number;
  ratingVariance: number;
  completionRate: number;
  pagesPerSession: number;
}) {
  const genreText = topGenres.length ? topGenres.slice(0, 2).join(" and ") : "a broad mix of genres";
  const authorText = topAuthors.length ? `, with ${topAuthors[0]} standing out` : "";
  const ratingStyle = ratingVariance >= 1 ? "selective" : averageRating >= 4 ? "generous when a book fits" : "measured";
  const completionText = completionRate >= 75 ? "usually finishes what they start" : completionRate >= 45 ? "keeps a balanced shelf of finished and in-progress books" : "is still building a completion history";
  const paceText = pagesPerSession > 0 ? ` around ${Math.round(pagesPerSession)} pages per logged session` : " an emerging reading pace";
  const moodText = topMoods.length ? ` The tone skews ${topMoods.slice(0, 2).join(" and ").toLowerCase()}.` : "";

  return `This reader leans toward ${genreText}${authorText}, rates in a ${ratingStyle} way, and ${completionText}. Recent logs suggest${paceText}.${moodText}`;
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
    allBooks,
    readingSessions,
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
    db.userBook.findMany({
      where: { userId },
      select: { rating: true, status: true },
    }),
    db.readingSession.findMany({
      where: { userId },
      select: { pagesRead: true, minutesRead: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
  ]);

  const displayName = user?.name ?? user?.username ?? "Reader";
  const initials = displayName.slice(0, 1).toUpperCase();
  const taste = user?.tasteProfile;
  const ratings = allBooks.map((book) => book.rating).filter((rating): rating is number => rating !== null);
  const averageRating = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
  const ratingVariance = variance(ratings);
  const completionRate = allBooks.length ? Math.round((allBooks.filter((book) => book.status === "READ").length / allBooks.length) * 100) : 0;
  const sessionsWithPages = readingSessions.filter((entry) => entry.pagesRead);
  const sessionsWithMinutes = readingSessions.filter((entry) => entry.minutesRead);
  const pagesPerSession = sessionsWithPages.length
    ? sessionsWithPages.reduce((sum, entry) => sum + (entry.pagesRead ?? 0), 0) / sessionsWithPages.length
    : 0;
  const minutesPerSession = sessionsWithMinutes.length
    ? sessionsWithMinutes.reduce((sum, entry) => sum + (entry.minutesRead ?? 0), 0) / sessionsWithMinutes.length
    : 0;
  const tasteSummary = buildTasteSummary({
    topGenres: taste?.topGenres ?? [],
    topAuthors: taste?.topAuthors ?? [],
    topMoods: taste?.topMoods ?? [],
    averageRating,
    ratingVariance,
    completionRate,
    pagesPerSession,
  });

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
                <div className="rounded-lg border border-border/70 bg-background/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Taste summary</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tasteSummary}</p>
                </div>
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
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Authors</p>
                  <div className="flex flex-wrap gap-2">
                    {(taste?.topAuthors?.length ? taste.topAuthors : ["Rate more books to reveal authors"]).slice(0, 6).map((author) => (
                      <span key={author} className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground">
                        {author}
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
                <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                  <Stat label="Average rating" value={ratings.length ? formatNumber(averageRating) : "N/A"} />
                  <Stat label="Rating variance" value={ratings.length > 1 ? formatNumber(ratingVariance) : "N/A"} />
                  <Stat label="Completion rate" value={`${completionRate}%`} />
                  <Stat label="Reading speed" value={pagesPerSession ? `${Math.round(pagesPerSession)}p` : minutesPerSession ? `${Math.round(minutesPerSession)}m` : "N/A"} />
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
          <ProfileEditForm
            profile={{
              name: user?.name,
              username: user?.username,
              bio: user?.bio,
              location: user?.location,
              avatar: user?.avatar,
            }}
          />

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
