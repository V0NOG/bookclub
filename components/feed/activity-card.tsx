"use client";

import { useState } from "react";
import { Star, Heart, BookmarkPlus } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { toggleActivityLike } from "@/app/actions/activity-like";
import { setBookStatus } from "@/app/actions/user-book";

export type ActivityAction = "finished" | "started" | "rated" | "joined_club";

export type ActivityItem = {
  id: string;
  actorName: string;
  actorAvatar?: string | null;
  action: ActivityAction;
  bookTitle?: string;
  bookId?: string;
  rating?: number;
  clubName?: string;
  timestamp: string;
  likeCount: number;
  isLiked: boolean;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1 align-middle">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-2.5 w-2.5"
          fill={i < rating ? "#8B3A2F" : "none"}
          stroke={i < rating ? "#8B3A2F" : "#C2B8A3"}
        />
      ))}
    </span>
  );
}

function ActionLabel({ action }: { action: ActivityAction }) {
  const labels: Record<ActivityAction, string> = {
    finished: "finished",
    started: "started reading",
    rated: "rated",
    joined_club: "joined",
  };
  return <span className="text-muted-foreground">{labels[action]}</span>;
}

export function ActivityCard({
  id,
  actorName,
  actorAvatar,
  action,
  bookTitle,
  bookId,
  rating,
  clubName,
  timestamp,
  likeCount: initialLikeCount,
  isLiked: initialIsLiked,
}: ActivityItem) {
  const [liked, setLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [wantToRead, setWantToRead] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [wtrPending, setWtrPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(false);

  const isBookAction = action !== "joined_club";

  function showFeedback(message: string) {
    setFeedback(message);
    setHighlighted(true);
    setTimeout(() => setHighlighted(false), 1000);
    setTimeout(() => setFeedback(null), 2200);
  }

  async function handleLike() {
    if (likePending) return;
    setLikePending(true);
    const prev = { liked, likeCount };
    setLiked(!liked);
    setLikeCount(likeCount + (liked ? -1 : 1));
    const result = await toggleActivityLike(id);
    if (!result.success) {
      setLiked(prev.liked);
      setLikeCount(prev.likeCount);
      toast.error(result.error);
    } else {
      setLiked(result.liked);
      setLikeCount(result.count);
      showFeedback(result.liked ? "Liked" : "Like removed");
      toast.success(result.liked ? "Activity liked." : "Activity unliked.");
    }
    setLikePending(false);
  }

  async function handleWantToRead() {
    if (!bookId || wtrPending || wantToRead) return;
    setWtrPending(true);
    setWantToRead(true);
    const result = await setBookStatus(bookId, "WANT_TO_READ");
    if (result.success) {
      showFeedback("Saved to library");
      toast.success("Saved to want-to-read.");
    } else {
      setWantToRead(false);
      toast.error(result.error);
    }
    setWtrPending(false);
  }

  return (
    <div className={`folio-lift -mx-2 flex items-start gap-3 rounded-lg border-b border-border/50 px-2 py-5 hover:bg-card/45 ${highlighted ? "folio-updated" : ""}`}>
      <div className="folio-cover mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent">
        {actorAvatar ? (
          <Image src={actorAvatar} alt="" width={32} height={32} unoptimized className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-foreground">{actorName[0]?.toUpperCase()}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <span className="font-semibold text-foreground">{actorName}</span>
          {" "}
          <ActionLabel action={action} />
          {bookTitle && (
            <> <span className="font-medium text-foreground italic">{bookTitle}</span></>
          )}
          {clubName && (
            <> <span className="font-medium text-foreground">{clubName}</span></>
          )}
          {rating !== undefined && <StarRow rating={rating} />}
        </p>

        <div className="flex items-center gap-3 mt-2">
          <p className="text-xs text-muted-foreground">{timestamp}</p>

          {bookId && isBookAction && (
            <button
              onClick={handleWantToRead}
              disabled={wantToRead || wtrPending}
              className={`folio-press flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs ${
                wantToRead
                  ? "text-primary cursor-default"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookmarkPlus className="h-3 w-3" />
              {wtrPending ? "Saving..." : wantToRead ? "Added" : "Want to read"}
            </button>
          )}

          <button
            onClick={handleLike}
            disabled={likePending}
            className="folio-press ml-auto flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs text-muted-foreground hover:text-primary"
          >
            <Heart
              className={`h-3.5 w-3.5 transition-all ${
                liked ? "folio-action-confirm scale-110 fill-primary text-primary" : ""
              }`}
            />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          {feedback && <span className="text-xs text-secondary">{feedback}</span>}
        </div>
      </div>
    </div>
  );
}
