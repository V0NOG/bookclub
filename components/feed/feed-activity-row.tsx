"use client";

import { useState, useTransition } from "react";
import { BookOpen, Heart, Star, Users, UserPlus, BookmarkPlus } from "lucide-react";
import { toast } from "sonner";
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
  const [pending, startTransition] = useTransition();

  function like() {
    const previous = { liked, likeCount };
    setLiked(!liked);
    setLikeCount(likeCount + (liked ? -1 : 1));
    startTransition(async () => {
      const result = await toggleActivityLike(id);
      if (result.success) {
        setLiked(result.liked);
        setLikeCount(result.count);
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
        toast.success("Saved to want-to-read.");
      } else {
        setSaved(false);
        toast.error(result.error);
      }
    });
  }

  return (
    <article className="flex gap-3 border-b border-border/50 py-4">
      <div className="mt-0.5 h-9 w-9 rounded-full bg-accent flex items-center justify-center overflow-hidden flex-shrink-0">
        {actorAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={actorAvatar} alt="" className="h-full w-full object-cover" />
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
            <button type="button" onClick={wantToRead} disabled={pending || saved} className="inline-flex items-center gap-1 hover:text-primary disabled:text-primary">
              <BookmarkPlus className="h-3.5 w-3.5" />
              {pending && !saved ? "Saving..." : saved ? "Added" : "Want to read"}
            </button>
          )}
          {!isCurrentUser && (
            <button type="button" onClick={follow} disabled={pending} className="inline-flex items-center gap-1 hover:text-primary">
              <UserPlus className="h-3.5 w-3.5" />
              {pending ? "Saving..." : following ? "Following" : `Follow ${actorName.split(" ")[0]}`}
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={like}
        disabled={pending}
        className="flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-primary transition-colors"
        aria-label={liked ? "Unlike activity" : "Like activity"}
      >
        <Heart className={`h-3.5 w-3.5 ${liked ? "fill-secondary text-secondary" : ""}`} />
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>
    </article>
  );
}
