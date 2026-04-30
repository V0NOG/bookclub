"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleChallengeParticipation } from "@/app/actions/challenge";

export function ChallengeToggleButton({
  challengeId,
  initialJoined,
}: {
  challengeId: string;
  initialJoined: boolean;
}) {
  const router = useRouter();
  const [joined, setJoined] = useState(initialJoined);
  const [message, setMessage] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(false);
  const [pending, startTransition] = useTransition();

  function pulse() {
    setHighlighted(true);
    setTimeout(() => setHighlighted(false), 1200);
  }

  function toggle() {
    const previous = joined;
    setJoined(!joined);
    setMessage(null);
    startTransition(async () => {
      const result = await toggleChallengeParticipation(challengeId);
      if (result.success) {
        setJoined(result.joined);
        const nextMessage = result.joined ? "Joined challenge." : "Left challenge.";
        setMessage(nextMessage);
        pulse();
        toast.success(nextMessage);
        router.refresh();
      } else {
        setJoined(previous);
        setMessage(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <div className={`flex flex-col items-end gap-1 rounded-lg ${highlighted ? "folio-updated" : ""}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`folio-press rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm disabled:opacity-60 ${
          joined
            ? "border-border bg-secondary/10 text-secondary hover:border-destructive/40 hover:text-destructive"
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
