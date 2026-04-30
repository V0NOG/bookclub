import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Clock, Star, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { LibraryBookActions } from "@/components/library/library-book-actions";
import { ReadingMiniPlayerActions } from "@/components/layout/reading-mini-player-actions";

export default async function BookDetailPage({ params }: { params: { bookId: string } }) {
  const session = await getSession();
  const userId = session!.user.id;

  const [book, userBook, activityCount] = await Promise.all([
    db.book.findUnique({
      where: { id: params.bookId },
      include: {
        reviews: {
          include: { user: { select: { name: true, username: true } } },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    }),
    db.userBook.findUnique({
      where: { userId_bookId: { userId, bookId: params.bookId } },
      select: { status: true, rating: true, progress: true },
    }),
    db.activityEvent.count({ where: { bookId: params.bookId } }),
  ]);

  if (!book) notFound();

  const status = userBook?.status ?? "WANT_TO_READ";
  const progressPercent = book.pageCount && userBook?.progress
    ? Math.min(100, Math.round((userBook.progress / book.pageCount) * 100))
    : 0;

  return (
    <div className="w-full max-w-7xl px-6 py-8">
      <Link href="/discover" className="folio-press inline-flex rounded-full px-2 py-1 text-sm text-primary hover:bg-primary/10">
        Back to discover
      </Link>

      <section className="mt-8 grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="folio-cover folio-cover-shimmer aspect-[2/3] overflow-hidden rounded-xl bg-muted shadow-sm">
            {book.cover ? (
              <Image src={book.cover} alt="" width={560} height={840} unoptimized priority className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/50" />
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Book detail
          </p>
          <h1 className="text-4xl font-bold text-foreground italic leading-tight">{book.title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{book.author}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {book.genres.slice(0, 6).map((genre) => (
              <span key={genre} className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground">
                {genre}
              </span>
            ))}
          </div>

          {book.description && (
            <div className="mt-8 max-w-3xl">
              <h2 className="text-base font-semibold text-foreground mb-2">About</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{book.description}</p>
            </div>
          )}

          {book.reviews.length > 0 && (
            <section className="mt-10 max-w-3xl">
              <h2 className="text-base font-semibold text-foreground mb-4">Recent reviews</h2>
              <div className="space-y-0">
                {book.reviews.map((review) => (
                  <article key={review.id} className="border-b border-border/50 py-4">
                    <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{review.user.name ?? review.user.username ?? "Reader"}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Star className="h-3.5 w-3.5 fill-primary" />
                        {review.rating}/5
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">{review.content}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Your shelf</h2>
            <LibraryBookActions bookId={book.id} initialStatus={status} initialRating={userBook?.rating} />
            {book.pageCount && (
              <div className="mt-5">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{userBook?.progress ?? 0} / {book.pageCount} pages</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="folio-progress-fill h-full rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            )}
            {userBook && (
              <div className="mt-5 border-t border-border pt-4">
                <ReadingMiniPlayerActions
                  bookId={book.id}
                  initialProgress={userBook.progress}
                  pageCount={book.pageCount}
                />
              </div>
            )}
            <Link href="/tracker" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">
              Open tracker
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Signals</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">{activityCount} recent activity signal{activityCount === 1 ? "" : "s"}</p>
              </div>
              {book.pageCount && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">{book.pageCount} pages</p>
                </div>
              )}
              {book.avgRating && (
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <p className="text-sm text-muted-foreground">{book.avgRating.toFixed(1)} average rating</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
