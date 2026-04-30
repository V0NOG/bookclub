import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import Link from "next/link";
import { BookOpen, Star, BookMarked, BookX } from "lucide-react";
import { LibraryBookActions } from "@/components/library/library-book-actions";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default async function LibraryPage() {
  const session = await getSession();
  const userId = session!.user.id;

  const [allBooks, goal] = await Promise.all([
    db.userBook.findMany({
      where: { userId },
      include: { book: { select: { id: true, title: true, author: true, cover: true, pageCount: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.readingGoal.findFirst({
      where: { userId, type: "BOOKS_PER_YEAR", year: new Date().getFullYear() },
    }),
  ]);

  const currentlyReading = allBooks.filter((b) => b.status === "CURRENTLY_READING");
  const wantToRead = allBooks.filter((b) => b.status === "WANT_TO_READ");
  const read = allBooks.filter((b) => b.status === "READ");
  const abandoned = allBooks.filter((b) => b.status === "ABANDONED");

  const goalPct = goal ? Math.min(100, Math.round(((goal.current ?? 0) / goal.target) * 100)) : null;

  return (
    <div className="px-6 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My library</h1>
        <p className="text-sm text-muted-foreground">
          {allBooks.length === 0
            ? "Add books to start building your library"
            : `${read.length} read · ${currentlyReading.length} in progress · ${wantToRead.length} to read`}
        </p>
      </div>

      {goal && (
        <div className="mb-8 pb-8 border-b border-border/60">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-foreground">{new Date().getFullYear()} reading goal</p>
            <p className="text-sm text-muted-foreground">
              {goal.current ?? 0} / {goal.target} books
            </p>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${goalPct}%` }} />
          </div>
          {goalPct === 100 && (
            <p className="text-xs text-primary mt-1.5">Goal complete!</p>
          )}
        </div>
      )}

      {allBooks.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-4 opacity-25" />
          <p className="text-base font-semibold mb-2 text-foreground">Your library is empty</p>
          <p className="text-sm mb-8">Search for books to add them to your library and start tracking your reading.</p>
          <Link
            href="/discover"
            className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg transition-colors"
          >
            Discover books
          </Link>
        </div>
      )}

      {currentlyReading.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Currently reading
          </h2>
          <div className="space-y-0">
            {currentlyReading.map(({ book, progress, status, rating }) => {
              const pct = book.pageCount && progress ? Math.min(100, Math.round((progress / book.pageCount) * 100)) : null;
              return (
                <div key={book.id} className="flex items-center gap-4 py-4 border-b border-border/50">
                  {book.cover ? (
                    <img src={book.cover} alt="" className="h-16 w-11 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="h-16 w-11 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{book.title}</p>
                    <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
                    {pct !== null ? (
                      <>
                        <div className="h-1 bg-muted rounded-full overflow-hidden max-w-48">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{pct}% · {progress} of {book.pageCount} pages</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Progress not tracked</p>
                    )}
                    <LibraryBookActions bookId={book.id} initialStatus={status} initialRating={rating} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {wantToRead.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-primary" />
            Want to read
            <span className="text-xs font-normal text-muted-foreground ml-1">({wantToRead.length})</span>
          </h2>
          <div className="space-y-0">
            {wantToRead.map(({ book, status, rating }) => (
              <div key={book.id} className="flex items-center gap-3 py-3 border-b border-border/40">
                {book.cover ? (
                  <img src={book.cover} alt="" className="h-12 w-8 object-cover rounded flex-shrink-0" />
                ) : (
                  <div className="h-12 w-8 bg-muted rounded flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground">{book.author}</p>
                  <LibraryBookActions bookId={book.id} initialStatus={status} initialRating={rating} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {read.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Read
            <span className="text-xs font-normal text-muted-foreground ml-1">({read.length})</span>
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {read.map(({ book, rating, status }) => (
              <div key={book.id} className="flex flex-col gap-1.5">
                {book.cover ? (
                  <img src={book.cover} alt={book.title} className="w-full aspect-[2/3] object-cover rounded" />
                ) : (
                  <div className="w-full aspect-[2/3] bg-muted rounded flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                )}
                <p className="text-xs text-foreground leading-tight line-clamp-2">{book.title}</p>
                {rating && <StarRating rating={rating} />}
                <LibraryBookActions bookId={book.id} initialStatus={status} initialRating={rating} />
              </div>
            ))}
          </div>
        </section>
      )}

      {abandoned.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookX className="h-4 w-4 text-muted-foreground" />
            Abandoned
            <span className="text-xs font-normal text-muted-foreground ml-1">({abandoned.length})</span>
          </h2>
          <div className="space-y-0">
            {abandoned.map(({ book, status, rating }) => (
              <div key={book.id} className="flex items-center gap-3 py-3 border-b border-border/40">
                {book.cover ? (
                  <img src={book.cover} alt="" className="h-10 w-7 object-cover rounded opacity-50 flex-shrink-0" />
                ) : (
                  <div className="h-10 w-7 bg-muted rounded opacity-50 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground/60">{book.author}</p>
                  <LibraryBookActions bookId={book.id} initialStatus={status} initialRating={rating} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
