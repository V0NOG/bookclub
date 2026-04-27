import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { BookOpen, Star } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  const session = await getSession();
  const userId = session!.user.id;
  const firstName = session?.user.name?.split(" ")[0] ?? "there";

  const [currentBook, recentBooks, goal] = await Promise.all([
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
  ]);

  const booksReadThisYear = goal
    ? await db.userBook.count({
        where: { userId, status: "READ" },
      })
    : 0;

  const currentPercent = currentBook?.book.pageCount
    ? Math.round((currentBook.progress / currentBook.book.pageCount) * 100)
    : 0;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-1">
        Good reading, {firstName} 👋
      </h1>
      <p className="text-muted-foreground mb-8 text-sm">Here&apos;s where you left off.</p>

      {/* Currently reading */}
      {currentBook && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Currently reading</h2>
          <div className="bg-card border border-border rounded-xl p-4 flex gap-4 items-start max-w-lg">
            <div className="flex-shrink-0">
              {currentBook.book.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentBook.book.cover} alt="" className="h-20 w-14 object-cover rounded-md shadow" />
              ) : (
                <div className="h-20 w-14 bg-muted rounded-md flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{currentBook.book.title}</p>
              <p className="text-sm text-muted-foreground mb-3">{currentBook.book.author}</p>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${currentPercent}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{currentBook.progress} / {currentBook.book.pageCount ?? "?"} pages</span>
                <span>{currentPercent}%</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Reading goal */}
      {goal && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Reading goal {new Date().getFullYear()}</h2>
          <div className="bg-card border border-border rounded-xl p-4 max-w-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white font-medium">{booksReadThisYear} of {goal.target} books</span>
              <span className="text-xs text-emerald-400">{Math.round((booksReadThisYear / goal.target) * 100)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((booksReadThisYear / goal.target) * 100))}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Recently read */}
      {recentBooks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Recently read</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentBooks.map((ub) => (
              <div key={ub.id} className="group">
                <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden mb-2 shadow">
                  {ub.book.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ub.book.cover} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-white truncate">{ub.book.title}</p>
                <p className="text-xs text-muted-foreground truncate">{ub.book.author}</p>
                {ub.rating && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: ub.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-emerald-400 text-emerald-400" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state for new users */}
      {!currentBook && recentBooks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium mb-2">Your reading journey starts here</p>
          <p className="text-xs mb-4">Add books to your library to track your progress.</p>
          <Link href="/library" className="text-emerald-400 hover:underline text-sm">Browse your library →</Link>
        </div>
      )}
    </div>
  );
}
