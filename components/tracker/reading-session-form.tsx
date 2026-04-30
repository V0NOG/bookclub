"use client";

import { useState, useTransition } from "react";
import { logReadingSession } from "@/app/actions/reading";

type BookOption = {
  id: string;
  title: string;
  author: string;
  progress: number;
  pageCount?: number | null;
};

export function ReadingSessionForm({ books }: { books: BookOption[] }) {
  const [bookId, setBookId] = useState(books[0]?.id ?? "");
  const [pagesRead, setPagesRead] = useState("");
  const [minutesRead, setMinutesRead] = useState("");
  const [currentPage, setCurrentPage] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await logReadingSession({
        bookId,
        pagesRead: pagesRead ? Number(pagesRead) : undefined,
        minutesRead: minutesRead ? Number(minutesRead) : undefined,
        currentPage: currentPage ? Number(currentPage) : undefined,
        notes,
      });
      if (result.success) {
        setPagesRead("");
        setMinutesRead("");
        setCurrentPage("");
        setNotes("");
        setMessage("Session logged.");
      } else {
        setMessage(result.error);
      }
    });
  }

  if (books.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Add a currently-reading book before logging sessions.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4">Log a session</h2>
      <div className="space-y-3">
        <select
          value={bookId}
          onChange={(event) => setBookId(event.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
          aria-label="Book"
        >
          {books.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title} by {book.author}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-3 gap-2">
          <input
            value={pagesRead}
            onChange={(event) => setPagesRead(event.target.value)}
            type="number"
            min="0"
            placeholder="Pages"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          />
          <input
            value={minutesRead}
            onChange={(event) => setMinutesRead(event.target.value)}
            type="number"
            min="0"
            placeholder="Minutes"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          />
          <input
            value={currentPage}
            onChange={(event) => setCurrentPage(event.target.value)}
            type="number"
            min="0"
            placeholder="Page now"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          />
        </div>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes"
          className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending || !bookId}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Logging..." : "Log session"}
        </button>
        {message && (
          <p className={`text-xs ${message.endsWith(".") ? "text-secondary" : "text-destructive"}`}>{message}</p>
        )}
      </div>
    </div>
  );
}
