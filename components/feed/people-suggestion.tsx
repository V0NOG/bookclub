"use client";

import { useState } from "react";
import { toast } from "sonner";
import { toggleFollow } from "@/app/actions/follow";

type Props = {
  userId: string;
  name: string;
  username?: string | null;
  avatar?: string | null;
  matchScore: number;
  sharedGenres: string[];
  isFollowing?: boolean;
};

export function PeopleSuggestion({
  userId, name, username, avatar, matchScore, sharedGenres, isFollowing: initialFollowing = false,
}: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    if (pending) return;
    setPending(true);
    const prev = following;
    setFollowing(!following);
    try {
      const result = await toggleFollow(userId);
      if (result.success) {
        setFollowing(result.following);
        toast.success(result.following ? `Following ${name}.` : `Unfollowed ${name}.`);
      } else {
        setFollowing(prev);
        toast.error(result.error);
      }
    } catch {
      setFollowing(prev);
      toast.error("Failed to update follow.");
    } finally {
      setPending(false);
    }
  }

  const genreLabel = sharedGenres.slice(0, 2).join(" · ");

  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-border/40">
      <div className="w-9 h-9 rounded-full bg-accent flex-shrink-0 flex items-center justify-center overflow-hidden">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-foreground">{name[0]?.toUpperCase()}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
        {username && (
          <p className="text-xs text-muted-foreground truncate">@{username}</p>
        )}
        <p className="text-xs text-primary/80 mt-0.5 font-medium">
          {matchScore}% match{genreLabel ? ` · ${genreLabel}` : ""}
        </p>
      </div>

      <button
        onClick={handleToggle}
        disabled={pending}
        aria-label={following ? `Unfollow ${name}` : `Follow ${name}`}
        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors flex-shrink-0 disabled:opacity-50 ${
          following
            ? "border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive bg-transparent"
            : "bg-primary hover:bg-primary/90 text-primary-foreground border-transparent"
        }`}
      >
        {pending ? "Saving..." : following ? "Following" : "Follow"}
      </button>
    </div>
  );
}
