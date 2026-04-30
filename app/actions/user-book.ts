"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { invalidateUserMatchCache } from "@/lib/matching/cache";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

type Result = { success: true } | { success: false; error: string };

export async function setBookStatus(
  bookId: string,
  status: "WANT_TO_READ" | "CURRENTLY_READING" | "READ" | "ABANDONED"
): Promise<Result> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Unauthenticated" };
  const userId = session.user.id;

  try {
    const now = new Date();
    const extra =
      status === "CURRENTLY_READING" ? { startedAt: now } :
      status === "READ"              ? { finishedAt: now } :
      {};

    await db.userBook.upsert({
      where: { userId_bookId: { userId, bookId } },
      update: { status, ...extra },
      create: { userId, bookId, status, ...extra },
    });

    if (status === "READ")              await logActivity({ userId, type: "finished", bookId });
    if (status === "CURRENTLY_READING") await logActivity({ userId, type: "started",  bookId });

    revalidatePath("/library");
    revalidatePath(`/books/${bookId}`);
    revalidatePath("/tracker");
    revalidatePath("/home");
    revalidatePath("/feed");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update status" };
  }
}

export async function rateBook(bookId: string, rating: number): Promise<Result> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Unauthenticated" };
  const userId = session.user.id;

  if (rating < 1 || rating > 5) return { success: false, error: "Rating must be 1–5" };

  try {
    await db.userBook.upsert({
      where: { userId_bookId: { userId, bookId } },
      update: { rating },
      create: { userId, bookId, rating, status: "READ" },
    });

    await logActivity({ userId, type: "rated", bookId });
    invalidateUserMatchCache(userId);
    revalidatePath("/library");
    revalidatePath(`/books/${bookId}`);
    revalidatePath("/home");
    revalidatePath("/feed");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to rate book" };
  }
}
