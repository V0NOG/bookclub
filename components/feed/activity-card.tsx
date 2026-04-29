"use client";

import { useState } from "react";
import { Star, BookOpen, Users, Heart, BookmarkPlus } from "lucide-react";
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

  const isBookAction = action !== "joined_club";

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
    } else {
      setLikeCount(result.count);
    }
    setLikePending(false);
  }

  async function handleWantToRead() {
    if (!bookId || wtrPending || wantToRead) return;
    setWtrPending(true);
    setWantToRead(true);
    const result = await setBookStatus(bookId, "WANT_TO_READ");
    if (!result.success) setWantToRead(false);
    setWtrPending(false);
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3.5 bg-card border border-border rounded-xl hover:border-foreground/15 transition-colors group shadow-sm">
      <div className="w-8 h-8 rounded-full bg-accent flex-shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
        {actorAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={actorAvatar} alt="" className="w-full h-full object-cover" />
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

        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">{timestamp}</p>

          <div className="flex items-center gap-2">
            {bookId && isBookAction && (
              <button
                onClick={handleWantToRead}
                disabled={wantToRead || wtrPending}
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border transition-colors ${
                  wantToRead
                    ? "border-primary/50 text-primary cursor-default"
                    : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                }`}
              >
                <BookmarkPlus className="h-3 w-3" />
                {wantToRead ? "Added" : "Want to read"}
              </button>
            )}

            <button
              onClick={handleLike}
              disabled={likePending}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Heart
                className={`h-3.5 w-3.5 transition-colors ${
                  liked ? "fill-primary text-primary" : ""
                }`}
              />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 opacity-20 group-hover:opacity-40 transition-opacity mt-0.5">
        {isBookAction
          ? <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          : <Users className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
    </div>
  );
}
