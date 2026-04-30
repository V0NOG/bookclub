"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";

type Result = { success: true } | { success: false; error: string };

export async function updateBookProgress(bookId: string, progress: number): Promise<Result> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Unauthenticated" };
  if (!bookId || !Number.isFinite(progress) || progress < 0) {
    return { success: false, error: "Invalid progress" };
  }

  try {
    await db.userBook.update({
      where: { userId_bookId: { userId: session.user.id, bookId } },
      data: { progress: Math.round(progress) },
    });
    revalidatePath("/tracker");
    revalidatePath("/library");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update progress" };
  }
}

export async function logReadingSession(input: {
  bookId: string;
  pagesRead?: number;
  minutesRead?: number;
  currentPage?: number;
  notes?: string;
}): Promise<Result> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Unauthenticated" };
  const userId = session.user.id;
  const pagesRead = input.pagesRead && input.pagesRead > 0 ? Math.round(input.pagesRead) : undefined;
  const minutesRead = input.minutesRead && input.minutesRead > 0 ? Math.round(input.minutesRead) : undefined;
  const currentPage = input.currentPage && input.currentPage >= 0 ? Math.round(input.currentPage) : undefined;

  if (!input.bookId) return { success: false, error: "Choose a book" };
  if (!pagesRead && !minutesRead && currentPage === undefined) {
    return { success: false, error: "Log pages, minutes, or current page" };
  }

  try {
    const userBook = await db.userBook.findUnique({
      where: { userId_bookId: { userId, bookId: input.bookId } },
      include: { book: { select: { pageCount: true } } },
    });
    if (!userBook) return { success: false, error: "Book is not in your library" };

    await db.readingSession.create({
      data: {
        userId,
        bookId: input.bookId,
        pagesRead,
        minutesRead,
        notes: input.notes?.trim() || undefined,
      },
    });

    const nextProgress =
      currentPage !== undefined
        ? currentPage
        : pagesRead
          ? userBook.progress + pagesRead
          : undefined;

    if (nextProgress !== undefined) {
      const capped = userBook.book.pageCount
        ? Math.min(nextProgress, userBook.book.pageCount)
        : nextProgress;
      await db.userBook.update({
        where: { userId_bookId: { userId, bookId: input.bookId } },
        data: { progress: capped },
      });
    }

    revalidatePath("/tracker");
    revalidatePath("/library");
    revalidatePath("/home");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to log session" };
  }
}
