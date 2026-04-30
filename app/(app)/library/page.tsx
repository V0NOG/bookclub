import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import Link from "next/link";
import Image from "next/image";
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
  const recentlyAdded = allBooks
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 4);

  const goalPct = goal ? Math.min(100, Math.round(((goal.current ?? 0) / goal.target) * 100)) : null;

  return (
    <div className="w-full max-w-7xl px-6 py-8">
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
            <div className="folio-progress-fill h-full bg-primary rounded-full" style={{ width: `${goalPct}%` }} />
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
            className="folio-press folio-cta rounded-lg bg-primary px-5 py-2.5 text-sm text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Discover books
          </Link>
        </div>
      )}

      {recentlyAdded.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-primary" />
            Recently added
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {recentlyAdded.map(({ book, status, createdAt }) => (
              <Link
                key={`recent-${book.id}`}
                href={`/books/${book.id}`}
                className="folio-updated flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-accent/40"
              >
                {book.cover ? (
                  <div className="folio-cover h-14 w-10 flex-shrink-0 rounded shadow-sm">
                    <Image src={book.cover} alt="" width={40} height={56} unoptimized className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-14 w-10 flex-shrink-0 items-center justify-center rounded bg-muted">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">{book.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{status.toLowerCase().replace("_", " ")}</span>
                  <span className="mt-1 block text-[11px] text-secondary">
                    Added {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(createdAt)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {currentlyReading.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Currently reading
          </h2>
          <div className="grid gap-x-8 lg:grid-cols-2">
            {currentlyReading.map(({ book, progress, status, rating }) => {
              const pct = book.pageCount && progress ? Math.min(100, Math.round((progress / book.pageCount) * 100)) : null;
              return (
                <div key={book.id} className="folio-lift -mx-2 flex items-center gap-4 rounded-lg border-b border-border/50 px-2 py-4 hover:bg-card/45">
                  {book.cover ? (
                    <Link href={`/books/${book.id}`} className="folio-cover h-16 w-11 flex-shrink-0 rounded shadow-sm">
                      <Image src={book.cover} alt="" width={44} height={64} unoptimized className="h-full w-full object-cover" />
                    </Link>
                  ) : (
                    <Link href={`/books/${book.id}`} className="h-16 w-11 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-muted-foreground/40" />
                    </Link>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link href={`/books/${book.id}`} className="block text-sm font-semibold text-foreground truncate hover:text-primary">{book.title}</Link>
                    <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
                    {pct !== null ? (
                      <>
                        <div className="h-1 bg-muted rounded-full overflow-hidden max-w-48">
                          <div className="folio-progress-fill h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{pct}% · {progress} of {book.pageCount} pages</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Progress not tracked</p>
                    )}
                    <LibraryBookActions bookId={book.id} initialStatus={status} initialRating={rating} />
                    <Link href="/tracker" className="mt-2 inline-flex text-xs text-primary hover:underline">
                      Log reading session
                    </Link>
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
          <div className="grid gap-x-8 md:grid-cols-2 xl:grid-cols-3">
            {wantToRead.map(({ book, status, rating }) => (
              <div key={book.id} className="folio-lift -mx-2 flex items-center gap-3 rounded-lg border-b border-border/40 px-2 py-3 hover:bg-card/45">
                {book.cover ? (
                  <Link href={`/books/${book.id}`} className="folio-cover h-12 w-8 flex-shrink-0 rounded shadow-sm">
                    <Image src={book.cover} alt="" width={32} height={48} unoptimized className="h-full w-full object-cover" />
                  </Link>
                ) : (
                  <Link href={`/books/${book.id}`} className="h-12 w-8 bg-muted rounded flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/books/${book.id}`} className="block text-sm font-medium text-foreground truncate hover:text-primary">{book.title}</Link>
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
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {read.map(({ book, rating, status }) => (
              <div key={book.id} className="group flex flex-col gap-1.5">
                {book.cover ? (
                  <Link href={`/books/${book.id}`} className="folio-cover aspect-[2/3] w-full rounded shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
                    <Image src={book.cover} alt={book.title} width={160} height={240} unoptimized className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
                  </Link>
                ) : (
                  <Link href={`/books/${book.id}`} className="w-full aspect-[2/3] bg-muted rounded flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-muted-foreground/30" />
                  </Link>
                )}
                <Link href={`/books/${book.id}`} className="text-xs text-foreground leading-tight line-clamp-2 hover:text-primary">{book.title}</Link>
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
          <div className="grid gap-x-8 md:grid-cols-2 xl:grid-cols-3">
            {abandoned.map(({ book, status, rating }) => (
              <div key={book.id} className="folio-lift -mx-2 flex items-center gap-3 rounded-lg border-b border-border/40 px-2 py-3 hover:bg-card/45">
                {book.cover ? (
                  <Link href={`/books/${book.id}`} className="folio-cover h-10 w-7 flex-shrink-0 rounded opacity-60">
                    <Image src={book.cover} alt="" width={28} height={40} unoptimized className="h-full w-full object-cover" />
                  </Link>
                ) : (
                  <Link href={`/books/${book.id}`} className="h-10 w-7 bg-muted rounded opacity-50 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <Link href={`/books/${book.id}`} className="block text-sm text-muted-foreground truncate hover:text-primary">{book.title}</Link>
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
