"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { rateBook, setBookStatus } from "@/app/actions/user-book";

type Status = "WANT_TO_READ" | "CURRENTLY_READING" | "READ" | "ABANDONED";

const STATUSES: { value: Status; label: string }[] = [
  { value: "WANT_TO_READ", label: "Want to read" },
  { value: "CURRENTLY_READING", label: "Reading" },
  { value: "READ", label: "Read" },
  { value: "ABANDONED", label: "Abandoned" },
];

export function LibraryBookActions({
  bookId,
  initialStatus,
  initialRating,
}: {
  bookId: string;
  initialStatus: Status;
  initialRating?: number | null;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [rating, setRating] = useState(initialRating ?? 0);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function changeStatus(nextStatus: Status) {
    const previous = status;
    setStatus(nextStatus);
    setMessage(null);
    startTransition(async () => {
      const result = await setBookStatus(bookId, nextStatus);
      if (!result.success) {
        setStatus(previous);
        setMessage(result.error);
      }
    });
  }

  function changeRating(nextRating: number) {
    const previous = rating;
    setRating(nextRating);
    setMessage(null);
    startTransition(async () => {
      const result = await rateBook(bookId, nextRating);
      if (!result.success) {
        setRating(previous);
        setMessage(result.error);
      } else {
        setStatus("READ");
      }
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <select
        value={status}
        onChange={(event) => changeStatus(event.target.value as Status)}
        disabled={pending}
        className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground disabled:opacity-60"
        aria-label="Reading status"
      >
        {STATUSES.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>
      <div className="flex items-center gap-0.5" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => changeRating(value)}
            disabled={pending}
            className="rounded p-0.5 text-muted-foreground hover:text-primary disabled:opacity-60"
            aria-label={`Rate ${value} stars`}
          >
            <Star className={`h-4 w-4 ${value <= rating ? "fill-primary text-primary" : ""}`} />
          </button>
        ))}
      </div>
      {message && <p className="basis-full text-xs text-destructive">{message}</p>}
    </div>
  );
}
