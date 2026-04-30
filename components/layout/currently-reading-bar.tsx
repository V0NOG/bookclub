import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { BookOpen, ChevronUp } from "lucide-react";
import Link from "next/link";

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
    <div className="fixed bottom-0 left-60 right-0 z-30 border-t border-border bg-card/95 backdrop-blur h-16 flex items-center px-6 gap-4">
      <div className="flex items-center gap-3 flex-1">
        {currentBook.book.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentBook.book.cover} alt="" className="h-8 w-6 object-cover rounded-sm" />
        ) : (
          <BookOpen className="h-5 w-5 text-primary" />
        )}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Currently reading</p>
          <p className="text-sm font-medium text-foreground truncate">{currentBook.book.title}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground w-8">{percent}%</span>
      </div>

      <Link href="/tracker" className="text-xs text-primary hover:underline flex items-center gap-1">
        <ChevronUp className="h-3 w-3" />
        Log session
      </Link>
    </div>
  );
}
