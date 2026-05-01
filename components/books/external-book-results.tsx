"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { addExternalBookToLibraryAction } from "@/app/actions/external-books";
import { ExternalBookResult } from "@/lib/books/types";
import { BookCover } from "@/components/ui/book-cover";

type ExternalBookResultsProps = {
  query: string;
  results: ExternalBookResult[];
  loading: boolean;
  error?: string | null;
  compact?: boolean;
};

type AddedState = {
  bookId: string;
  alreadyInLibrary: boolean;
};

function providerLabel(source: ExternalBookResult["externalSource"]) {
  return source === "open-library" ? "Open Library" : "Google Books";
}

export function ExternalBookResults({ query, results, loading, error, compact = false }: ExternalBookResultsProps) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, AddedState>>({});
  const [isPending, startTransition] = useTransition();

  const hasQuery = query.trim().length >= 2;

  function resultKey(book: ExternalBookResult) {
    return `${book.externalSource}:${book.externalId}`;
  }

  function addBook(book: ExternalBookResult) {
    const key = resultKey(book);
    setPendingKey(key);

    startTransition(async () => {
      const result = await addExternalBookToLibraryAction(book);
      setPendingKey(null);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setAdded((current) => ({
        ...current,
        [key]: { bookId: result.bookId, alreadyInLibrary: result.alreadyInLibrary },
      }));
      toast.success(result.alreadyInLibrary ? "Already in your library." : "Added to want-to-read.");
      toast.message("Folio is adapting to your taste.");
      router.refresh();
    });
  }

  if (!hasQuery) return null;

  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Searching real books...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 rounded-xl border border-border bg-background px-4 py-4 text-sm text-muted-foreground">
        {error} Try again in a moment.
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="mt-3 rounded-xl border border-border bg-background px-4 py-4 text-sm text-muted-foreground">
        No external book matches yet. Try a title, author, or ISBN.
      </div>
    );
  }

  return (
    <div className={compact ? "mt-2 space-y-2" : "mt-4 grid gap-3 md:grid-cols-2"}>
      {results.map((book) => {
        const key = resultKey(book);
        const addedState = added[key];
        const pending = (isPending && pendingKey === key);
        const author = book.authors.join(", ");

        return (
          <article
            key={key}
            className={`folio-lift flex gap-3 rounded-xl border border-border bg-background p-3 hover:bg-accent/35 ${addedState ? "folio-updated" : ""}`}
          >
            <BookCover
              src={book.coverUrl}
              alt={book.title}
              className="h-20 w-[3.35rem] flex-shrink-0 rounded shadow-sm"
              sizes="54px"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold italic leading-tight text-foreground">{book.title}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{author}</p>
                </div>
                <span className="flex-shrink-0 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  External
                </span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {providerLabel(book.externalSource)}
                {book.publishedYear ? ` · ${book.publishedYear}` : ""}
                {book.pageCount ? ` · ${book.pageCount} pages` : ""}
                {book.isbn ? ` · ISBN ${book.isbn}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {addedState ? (
                  <>
                    <Link
                      href={`/books/${addedState.bookId}`}
                      className="folio-press inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Open in Folio
                    </Link>
                    <span className="text-xs text-secondary">
                      {addedState.alreadyInLibrary ? "Already in library" : "Added to library"}
                    </span>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => addBook(book)}
                    disabled={pending}
                    className="folio-press inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
                  >
                    {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    {pending ? "Adding..." : "Add to library"}
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
