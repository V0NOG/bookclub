"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Edit3, ListPlus } from "lucide-react";
import { toast } from "sonner";
import { updateBookProgress } from "@/app/actions/reading";
import { setBookStatus } from "@/app/actions/user-book";

function milestoneFor(percent: number) {
  if (percent >= 100) return "Milestone reached: book complete.";
  if (percent >= 75) return "Milestone reached: 75% complete.";
  if (percent >= 50) return "Milestone reached: halfway there.";
  if (percent >= 25) return "Milestone reached: 25% complete.";
  return null;
}

export function ReadingMiniPlayerActions({
  bookId,
  initialProgress,
  pageCount,
}: {
  bookId: string;
  initialProgress: number;
  pageCount?: number | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [progress, setProgress] = useState(initialProgress);
  const [draft, setDraft] = useState(String(initialProgress));
  const [markedRead, setMarkedRead] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [milestone, setMilestone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pulseSaved() {
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 900);
  }

  function saveProgress() {
    const nextProgress = Math.max(0, Number(draft));
    startTransition(async () => {
      const result = await updateBookProgress(bookId, nextProgress);
      if (result.success) {
        setProgress(nextProgress);
        setEditing(false);
        pulseSaved();
        const nextPercent = pageCount ? Math.min(100, Math.round((nextProgress / pageCount) * 100)) : 0;
        const nextMilestone = milestoneFor(nextPercent);
        setMilestone(nextMilestone);
        if (nextMilestone) setTimeout(() => setMilestone(null), 2400);
        toast.success(nextMilestone ?? "Progress updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function markRead() {
    startTransition(async () => {
      const result = await setBookStatus(bookId, "READ");
      if (result.success) {
        setMarkedRead(true);
        if (pageCount) setProgress(pageCount);
        pulseSaved();
        setMilestone("Milestone reached: book complete.");
        setTimeout(() => setMilestone(null), 2400);
        toast.success("Milestone reached: book complete.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-xl transition-all ${justSaved ? "ring-2 ring-primary/20 ring-offset-2 ring-offset-card" : ""}`}>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            type="number"
            min="0"
            max={pageCount ?? undefined}
            className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            aria-label="Current page"
          />
          <button
            type="button"
            onClick={saveProgress}
            disabled={pending}
            className="folio-press rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(String(progress));
            setEditing(true);
          }}
          disabled={pending || markedRead}
          className="folio-press inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-60"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Update progress
        </button>
      )}
      <Link
        href="/tracker"
        className="folio-press inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
      >
        <ListPlus className="h-3.5 w-3.5" />
        Log session
      </Link>
      <button
        type="button"
        onClick={markRead}
        disabled={pending || markedRead}
        className="folio-press rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
      >
        <Check className="h-3.5 w-3.5" />
        {markedRead ? "Read" : pending ? "Saving..." : "Mark read"}
      </button>
      {milestone && <p className="basis-full text-xs text-secondary">{milestone}</p>}
    </div>
  );
}
