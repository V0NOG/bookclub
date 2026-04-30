"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleClubMembership } from "@/app/actions/club-membership";

export function ClubMembershipButton({
  clubId,
  initialJoined,
  disabled,
}: {
  clubId: string;
  initialJoined: boolean;
  disabled?: boolean;
}) {
  const [joined, setJoined] = useState(initialJoined);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const previous = joined;
    setJoined(!joined);
    setMessage(null);
    startTransition(async () => {
      const result = await toggleClubMembership(clubId);
      if (result.success) {
        setJoined(result.joined);
        const nextMessage = result.joined ? "Joined club." : "Left club.";
        setMessage(nextMessage);
        toast.success(nextMessage);
      } else {
        setJoined(previous);
        setMessage(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending || disabled}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
          joined
            ? "border-border bg-transparent text-muted-foreground hover:text-destructive"
            : "border-transparent bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {pending ? (joined ? "Leaving..." : "Joining...") : joined ? "Leave" : "Join"}
      </button>
      {message && (
        <p className={`max-w-40 text-right text-xs ${message.endsWith(".") ? "text-secondary" : "text-destructive"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
