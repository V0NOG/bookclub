"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { searchExternalBooks } from "@/lib/books/external-book-search";
import { ExternalBookResult } from "@/lib/books/types";

export type ExternalBookActionResult =
  | { success: true; results: ExternalBookResult[] }
  | { success: false; error: string; results: [] };

export type AddExternalBookResult =
  | { success: true; bookId: string; alreadyInLibrary: boolean }
  | { success: false; error: string };

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeIsbn(value: unknown): string | undefined {
  const raw = cleanString(value);
  if (!raw) return undefined;
  const normalized = raw.replace(/[^0-9Xx]/g, "").toUpperCase();
  return normalized.length >= 10 ? normalized : undefined;
}

function normalizeExternalBook(input: ExternalBookResult): ExternalBookResult | null {
  const title = cleanString(input.title);
  const authors = Array.isArray(input.authors)
    ? input.authors.map((author) => cleanString(author)).filter((author): author is string => Boolean(author)).slice(0, 4)
    : [];
  const externalSource = input.externalSource === "google-books" ? "google-books" : input.externalSource === "open-library" ? "open-library" : undefined;
  const externalId = cleanString(input.externalId);

  if (!title || authors.length === 0 || !externalSource || !externalId) return null;

  return {
    externalSource,
    externalId,
    title,
    authors,
    isbn: normalizeIsbn(input.isbn),
    coverUrl: cleanString(input.coverUrl),
    description: cleanString(input.description),
    publishedYear: typeof input.publishedYear === "number" && input.publishedYear > 0 ? input.publishedYear : undefined,
    pageCount: typeof input.pageCount === "number" && input.pageCount > 0 ? Math.round(input.pageCount) : undefined,
    genres: Array.isArray(input.genres)
      ? input.genres.map((genre) => cleanString(genre)).filter((genre): genre is string => Boolean(genre)).slice(0, 8)
      : undefined,
  };
}

export async function searchExternalBooksAction(query: string): Promise<ExternalBookActionResult> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Unauthenticated", results: [] };

  const term = query.trim();
  if (term.length < 2) return { success: true, results: [] };
  if (term.length > 120) return { success: false, error: "Search query is too long", results: [] };

  try {
    const results = await searchExternalBooks(term);
    return { success: true, results };
  } catch {
    return { success: false, error: "External book search is unavailable right now.", results: [] };
  }
}

export async function addExternalBookToLibraryAction(input: ExternalBookResult): Promise<AddExternalBookResult> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Unauthenticated" };
  const userId = session.user.id;

  const bookInput = normalizeExternalBook(input);
  if (!bookInput) return { success: false, error: "Book result is missing title, author, or provider details." };

  try {
    const existingByIsbn = bookInput.isbn
      ? await db.book.findUnique({ where: { isbn: bookInput.isbn }, select: { id: true } })
      : null;

    const existingByProvider = !existingByIsbn
      ? await db.book.findUnique({
          where: {
            externalSource_externalId: {
              externalSource: bookInput.externalSource,
              externalId: bookInput.externalId,
            },
          },
          select: { id: true },
        })
      : null;

    const existingByTitleAuthor = !existingByIsbn && !existingByProvider
      ? await db.book.findFirst({
          where: {
            title: { equals: bookInput.title, mode: "insensitive" },
            author: { equals: bookInput.authors[0], mode: "insensitive" },
          },
          select: { id: true },
        })
      : null;

    let book = existingByIsbn ?? existingByProvider ?? existingByTitleAuthor;
    if (!book) {
      book = await db.book.create({
        data: {
          title: bookInput.title,
          author: bookInput.authors[0],
          authors: bookInput.authors,
          isbn: bookInput.isbn,
          externalSource: bookInput.externalSource,
          externalId: bookInput.externalId,
          cover: bookInput.coverUrl,
          description: bookInput.description,
          publishedAt: bookInput.publishedYear ? new Date(Date.UTC(bookInput.publishedYear, 0, 1)) : undefined,
          pageCount: bookInput.pageCount,
          genres: bookInput.genres ?? [],
          tags: [],
        },
        select: { id: true },
      });
    }

    const existingUserBook = await db.userBook.findUnique({
      where: { userId_bookId: { userId, bookId: book.id } },
      select: { id: true },
    });

    if (!existingUserBook) {
      await db.userBook.create({
        data: { userId, bookId: book.id, status: "WANT_TO_READ" },
      });
    }

    revalidatePath("/library");
    revalidatePath("/discover");
    revalidatePath("/home");
    revalidatePath("/feed");
    revalidatePath(`/books/${book.id}`);

    return { success: true, bookId: book.id, alreadyInLibrary: Boolean(existingUserBook) };
  } catch {
    return { success: false, error: "Failed to add book to your library." };
  }
}
