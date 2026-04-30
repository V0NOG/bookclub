import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ReadingMiniPlayerActions } from "@/components/layout/reading-mini-player-actions";

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
    <div key={currentBook.bookId} className="folio-soft-enter border-t border-border bg-card/95 px-4 py-3 backdrop-blur md:px-6">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <Link href="/tracker" className="group/player flex min-w-0 flex-1 items-center gap-3 rounded-lg -m-1 p-1 hover:bg-accent/40">
          <div className="folio-cover h-12 w-9 flex-shrink-0 overflow-hidden rounded-md bg-muted shadow-sm transition-shadow duration-200 group-hover/player:shadow-md">
            {currentBook.book.cover ? (
              <Image src={currentBook.book.cover} alt="" width={72} height={96} unoptimized className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>
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
