"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logReadingSession } from "@/app/actions/reading";

type BookOption = {
  id: string;
  title: string;
  author: string;
  progress: number;
  pageCount?: number | null;
};

function milestoneFor(percent: number) {
  if (percent >= 100) return "Milestone reached: book complete.";
  if (percent >= 75) return "Milestone reached: 75% complete.";
  if (percent >= 50) return "Milestone reached: halfway there.";
  if (percent >= 25) return "Milestone reached: 25% complete.";
  return null;
}

export function ReadingSessionForm({ books }: { books: BookOption[] }) {
  const router = useRouter();
  const [bookId, setBookId] = useState(books[0]?.id ?? "");
  const [pagesRead, setPagesRead] = useState("");
  const [minutesRead, setMinutesRead] = useState("");
  const [currentPage, setCurrentPage] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [justLogged, setJustLogged] = useState(false);
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
        const selectedBook = books.find((book) => book.id === bookId);
        const nextProgress = currentPage
          ? Number(currentPage)
          : pagesRead
            ? (selectedBook?.progress ?? 0) + Number(pagesRead)
            : selectedBook?.progress ?? 0;
        const nextPercent = selectedBook?.pageCount
          ? Math.min(100, Math.round((nextProgress / selectedBook.pageCount) * 100))
          : 0;
        const milestone = milestoneFor(nextPercent);
        setPagesRead("");
        setMinutesRead("");
        setCurrentPage("");
        setNotes("");
        setJustLogged(true);
        setTimeout(() => setJustLogged(false), 1200);
        setMessage(milestone ?? "Session logged + progress updated.");
        toast.success(milestone ?? "Session logged + progress updated.");
        router.refresh();
      } else {
        setMessage(result.error);
        toast.error(result.error);
      }
    });
  }

  if (books.length === 0) {
    return (
      <div className="folio-lift rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <p>Add a currently-reading book before logging sessions.</p>
        <Link href="/library" className="folio-press folio-cta mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
          Go to library
        </Link>
      </div>
    );
  }

  return (
    <div className={`folio-lift rounded-xl border border-border bg-card p-5 transition-all ${justLogged ? "folio-milestone" : ""}`}>
      <h2 className="text-sm font-semibold text-foreground mb-4">Log reading session</h2>
      <div className="space-y-3">
        <select
          value={bookId}
          onChange={(event) => setBookId(event.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
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
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
          <input
            value={minutesRead}
            onChange={(event) => setMinutesRead(event.target.value)}
            type="number"
            min="0"
            placeholder="Minutes"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
          <input
            value={currentPage}
            onChange={(event) => setCurrentPage(event.target.value)}
            type="number"
            min="0"
            placeholder="Page now"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes"
          className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending || !bookId}
          className="folio-press w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Logging..." : "Log session"}
        </button>
        {message && (
          <p className={`text-xs ${message.includes("Failed") ? "text-destructive" : "text-secondary"}`}>{message}</p>
        )}
      </div>
    </div>
  );
}
