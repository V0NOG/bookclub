"use client";

import { useState } from "react";
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
      } else {
        setFollowing(prev);
      }
    } catch {
      setFollowing(prev);
    } finally {
      setPending(false);
    }
  }

  const genreLabel = sharedGenres.slice(0, 2).join(" · ");

  return (
    <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:-translate-y-0.5 transition-transform shadow-sm">
      <div className="w-10 h-10 rounded-full bg-accent flex-shrink-0 flex items-center justify-center overflow-hidden">
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
        <p className="text-xs text-primary mt-0.5 font-medium">
          {matchScore}% match{genreLabel ? ` · ${genreLabel}` : ""}
        </p>
      </div>

      <button
        onClick={handleToggle}
        disabled={pending}
        aria-label={following ? `Unfollow ${name}` : `Follow ${name}`}
        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0 disabled:opacity-50 ${
          following
            ? "border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive bg-transparent"
            : "bg-primary hover:bg-primary/90 text-primary-foreground border-transparent"
        }`}
      >
        {pending ? "…" : following ? "Following" : "Follow"}
      </button>
    </div>
  );
}
