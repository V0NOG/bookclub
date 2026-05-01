import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import Link from "next/link";
import { ReadingMiniPlayerActions } from "@/components/layout/reading-mini-player-actions";
import { BookCover } from "@/components/ui/book-cover";

export async function CurrentlyReadingBar() {
  const session = await getSession();
  if (!session) return null;

  const currentBook = await db.userBook.findFirst({
    where: { userId: session.user.id, status: "CURRENTLY_READING" },
    include: { book: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!currentBook) return null;

  const percent = currentBook.book.pageCount
    ? Math.round((currentBook.progress / currentBook.book.pageCount) * 100)
    : 0;

  return (
    <div key={currentBook.bookId} className="folio-soft-enter min-h-[var(--mini-player-height)] border-t border-border bg-card px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgb(47_42_38/0.05)] md:px-6 md:pb-3">
      <div className="mx-auto flex max-w-7xl items-center gap-3 md:gap-4">
        <Link href="/tracker" className="group/player flex min-w-0 flex-1 items-center gap-3 rounded-lg -m-1 p-1 hover:bg-accent/40">
          <BookCover
            src={currentBook.book.cover}
            alt=""
            className="h-12 w-9 flex-shrink-0 rounded-md shadow-sm transition-shadow duration-200 group-hover/player:shadow-md"
            iconClassName="text-primary"
            sizes="36px"
          />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Currently reading</p>
            <p className="truncate text-sm font-semibold italic text-foreground transition-colors group-hover/player:text-primary">{currentBook.book.title}</p>
            <p className="truncate text-xs text-muted-foreground">{currentBook.book.author}</p>
          </div>
        </Link>

        <div className="hidden min-w-[220px] flex-col gap-1 md:flex">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{currentBook.progress} / {currentBook.book.pageCount ?? "?"} pages</span>
            <span>{percent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="folio-progress-fill h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
        </div>

        <div className="hidden lg:block">
          <ReadingMiniPlayerActions
            bookId={currentBook.bookId}
            initialProgress={currentBook.progress}
            pageCount={currentBook.book.pageCount}
          />
        </div>
      </div>
    </div>
  );
}
