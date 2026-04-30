"use client";

import { useState, useTransition } from "react";
import { BookOpen, Heart, Star, Users, UserPlus, BookmarkPlus } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { toggleActivityLike } from "@/app/actions/activity-like";
import { toggleFollow } from "@/app/actions/follow";
import { setBookStatus } from "@/app/actions/user-book";

type FeedActivity = {
  id: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string | null;
  type: string;
  text: string;
  timestamp: string;
  context?: string;
  bookId?: string | null;
  likeCount: number;
  isLiked: boolean;
  isFollowing: boolean;
  isCurrentUser: boolean;
};

function Icon({ type }: { type: string }) {
  if (type === "joined_club" || type === "followed") return <Users className="h-4 w-4 text-secondary" />;
  if (type === "rated") return <Star className="h-4 w-4 text-primary" />;
  return <BookOpen className="h-4 w-4 text-primary" />;
}

export function FeedActivityRow({
  id,
  actorId,
  actorName,
  actorAvatar,
  type,
  text,
  timestamp,
  context,
  bookId,
  likeCount: initialLikeCount,
  isLiked: initialLiked,
  isFollowing: initialFollowing,
  isCurrentUser,
}: FeedActivity) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [following, setFollowing] = useState(initialFollowing);
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(false);
  const [pending, startTransition] = useTransition();

  function showFeedback(message: string) {
    setFeedback(message);
    setHighlighted(true);
    setTimeout(() => setHighlighted(false), 1000);
    setTimeout(() => setFeedback(null), 2200);
  }

  function like() {
    const previous = { liked, likeCount };
    setLiked(!liked);
    setLikeCount(likeCount + (liked ? -1 : 1));
    startTransition(async () => {
      const result = await toggleActivityLike(id);
      if (result.success) {
        setLiked(result.liked);
        setLikeCount(result.count);
        showFeedback(result.liked ? "Liked" : "Like removed");
        toast.success(result.liked ? "Activity liked." : "Activity unliked.");
      } else {
        setLiked(previous.liked);
        setLikeCount(previous.likeCount);
        toast.error(result.error);
      }
    });
  }

  function follow() {
    const previous = following;
    setFollowing(!following);
    startTransition(async () => {
      const result = await toggleFollow(actorId);
      if (result.success) {
        setFollowing(result.following);
        showFeedback(result.following ? `Following ${actorName.split(" ")[0]}` : "Unfollowed");
        toast.success(result.following ? `Following ${actorName}.` : `Unfollowed ${actorName}.`);
      } else {
        setFollowing(previous);
        toast.error(result.error);
      }
    });
  }

  function wantToRead() {
    if (!bookId || saved) return;
    setSaved(true);
    startTransition(async () => {
      const result = await setBookStatus(bookId, "WANT_TO_READ");
      if (result.success) {
        showFeedback("Saved to library");
        toast.success("Saved to want-to-read.");
      } else {
        setSaved(false);
        toast.error(result.error);
      }
    });
  }

  return (
    <article className={`folio-lift -mx-2 flex gap-3 rounded-lg border-b border-border/50 px-2 py-4 hover:bg-card/45 ${highlighted ? "folio-updated" : ""}`}>
      <div className="folio-cover mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent">
        {actorAvatar ? (
          <Image src={actorAvatar} alt="" width={36} height={36} unoptimized className="h-full w-full object-cover" />
        ) : (
          <Icon type={type} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground leading-relaxed">{text}</p>
        {context && (
          <p className="mt-1 text-xs text-secondary">{context}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{timestamp}</span>
          {bookId && (
            <button type="button" onClick={wantToRead} disabled={pending || saved} className="folio-press inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 hover:text-primary disabled:text-primary">
              <BookmarkPlus className="h-3.5 w-3.5" />
              {pending && !saved ? "Saving..." : saved ? "Added" : "Want to read"}
            </button>
          )}
          {!isCurrentUser && (
            <button type="button" onClick={follow} disabled={pending} className="folio-press inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 hover:text-primary">
              <UserPlus className="h-3.5 w-3.5" />
              {pending ? "Saving..." : following ? "Following" : `Follow ${actorName.split(" ")[0]}`}
            </button>
          )}
          {feedback && <span className="text-secondary">{feedback}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={like}
        disabled={pending}
        className="folio-press flex items-center gap-1 self-start rounded-full px-1.5 py-0.5 text-xs text-muted-foreground hover:text-primary"
        aria-label={liked ? "Unlike activity" : "Like activity"}
      >
        <Heart className={`h-3.5 w-3.5 transition-all ${liked ? "folio-action-confirm scale-110 fill-secondary text-secondary" : ""}`} />
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>
    </article>
  );
}
