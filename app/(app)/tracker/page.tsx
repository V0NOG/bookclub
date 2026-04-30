import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { Activity, BookOpen, Clock, Sparkles, Target } from "lucide-react";
import { ReadingSessionForm } from "@/components/tracker/reading-session-form";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function calculateStreak(dates: Date[]) {
  const days = new Set(dates.map(dateKey));
  if (days.size === 0) return 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function patternInsight(sessions: { date: Date; pagesRead: number | null }[]) {
  if (sessions.length < 3) return "Log a few more sessions to reveal weekly patterns.";
  const weekend = sessions.filter((session) => [0, 6].includes(session.date.getDay()));
  const weekday = sessions.filter((session) => ![0, 6].includes(session.date.getDay()));
  const avg = (items: typeof sessions) =>
    items.length ? items.reduce((sum, session) => sum + (session.pagesRead ?? 0), 0) / items.length : 0;
  const weekendAvg = avg(weekend);
  const weekdayAvg = avg(weekday);

  if (weekendAvg > weekdayAvg * 1.15) return "You read more on weekends.";
  if (weekdayAvg > weekendAvg * 1.15) return "You read more on weekdays.";
  return "Your reading is fairly balanced across the week.";
}

export default async function TrackerPage() {
  const session = await getSession();
  const userId = session!.user.id;

  const [currentBooks, sessions, insightSessions, goal] = await Promise.all([
    db.userBook.findMany({
      where: { userId, status: "CURRENTLY_READING" },
      include: { book: { select: { title: true, author: true, cover: true, pageCount: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    db.readingSession.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 6,
    }),
    db.readingSession.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 60,
    }),
    db.readingGoal.findFirst({
      where: { userId, type: "BOOKS_PER_YEAR", year: new Date().getFullYear() },
    }),
  ]);

  const sessionBookIds = Array.from(new Set(sessions.map((s) => s.bookId)));
  const sessionBooks = sessionBookIds.length
    ? await db.book.findMany({
        where: { id: { in: sessionBookIds } },
        select: { id: true, title: true, author: true },
      })
    : [];
  const bookMap = new Map(sessionBooks.map((book) => [book.id, book]));
  const totalPages = sessions.reduce((sum, session) => sum + (session.pagesRead ?? 0), 0);
  const totalMinutes = sessions.reduce((sum, session) => sum + (session.minutesRead ?? 0), 0);
  const goalPct = goal ? Math.min(100, Math.round(((goal.current ?? 0) / goal.target) * 100)) : null;
  const streakDays = calculateStreak(insightSessions.map((session) => session.date));
  const activeDays = new Set(insightSessions.map((session) => dateKey(session.date))).size;
  const consistency = Math.round((activeDays / 30) * 100);
  const avgPages = insightSessions.length
    ? Math.round(insightSessions.reduce((sum, session) => sum + (session.pagesRead ?? 0), 0) / insightSessions.length)
    : 0;
  const weeklyPattern = patternInsight(insightSessions);

  return (
    <div className="px-6 py-8 max-w-4xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Reading rhythm</p>
        <h1 className="text-3xl font-bold text-foreground mb-2">Tracker</h1>
        <p className="text-sm text-muted-foreground">
          Track current books, recent sessions, and progress toward this year&apos;s goal.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-10">
          <ReadingSessionForm
            books={currentBooks.map(({ bookId, book, progress }) => ({
              id: bookId,
              title: book.title,
              author: book.author,
              progress,
              pageCount: book.pageCount,
            }))}
          />

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Currently reading
            </h2>
            {currentBooks.length > 0 ? (
              <div className="space-y-0">
                {currentBooks.map(({ id, book, progress }) => {
                  const pct = book.pageCount ? Math.min(100, Math.round((progress / book.pageCount) * 100)) : 0;
                  return (
                    <div key={id} className="flex items-center gap-4 border-b border-border/50 py-4">
                      {book.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={book.cover} alt="" className="h-16 w-11 rounded object-cover" />
                      ) : (
                        <div className="h-16 w-11 rounded bg-muted flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{book.title}</p>
                        <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
                        <div className="h-1.5 max-w-60 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{pct}% complete</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Mark a book as currently reading to see it here.
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Recent sessions
            </h2>
            {sessions.length > 0 ? (
              <div className="space-y-0">
                {sessions.map((session) => {
                  const book = bookMap.get(session.bookId);
                  return (
                    <div key={session.id} className="border-b border-border/50 py-4">
                      <p className="text-sm font-semibold text-foreground">
                        {book?.title ?? "Reading session"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {book?.author ? `${book.author} · ` : ""}
                        {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(session.date)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {session.pagesRead ? `${session.pagesRead} pages` : "Pages not logged"}
                        {session.minutesRead ? ` · ${session.minutesRead} minutes` : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Reading sessions will appear here once logged.
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Reading insights
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-foreground">{streakDays}</p>
                <p className="text-xs text-muted-foreground">Day streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{Math.min(100, consistency)}%</p>
                <p className="text-xs text-muted-foreground">30-day consistency</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {weeklyPattern} {avgPages > 0 ? `You average ${avgPages} pages per logged session.` : ""}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Session totals
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-foreground">{totalPages}</p>
                <p className="text-xs text-muted-foreground">Pages in recent sessions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{Math.round(totalMinutes / 60)}</p>
                <p className="text-xs text-muted-foreground">Hours in recent sessions</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Annual goal
            </h2>
            {goal && goalPct !== null ? (
              <>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-foreground">{goal.current} / {goal.target}</span>
                  <span className="text-muted-foreground">{goalPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${goalPct}%` }} />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Set a goal during onboarding to track annual progress.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
