"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { colors, typography, spacing, radius, shadow } from "@/styles/design-tokens";
import { ThumbsDown, Heart, BookmarkPlus, Check } from "lucide-react";
import { upsertFeedback } from "@/app/actions/feedback";
import { setBookStatus } from "@/app/actions/user-book";
import { FeedbackTargetType, FeedbackAction } from "@/lib/generated/prisma/enums";
import { BookCover } from "@/components/ui/book-cover";

type Props = {
  variant: "person" | "book" | "club";
  title: string;
  subtitle?: string;
  coverImage?: string | null;
  score?: number;
  confidence?: "low" | "medium" | "high";
  reasons?: string[];
  meta?: string;
  featured?: boolean;
  topMatch?: boolean;
  exploratory?: boolean;
  badge?: string;
  targetId?: string;
};

function Chip({
  label, color, bg,
}: { label: string; color: string; bg: string }) {
  return (
    <span
      style={{
        alignSelf: "flex-start",
        backgroundColor: bg,
        color,
        fontSize: "10px",
        fontFamily: typography.fontFamily.serif,
        fontWeight: 600,
        letterSpacing: "0.04em",
        padding: "2px 7px",
        borderRadius: radius.sm,
        marginBottom: spacing.sm,
        textTransform: "uppercase",
        display: "inline-block",
      }}
    >
      {label}
    </span>
  );
}

function ScoreBadge({ score, confidence }: { score: number; confidence: "low" | "medium" | "high" }) {
  const color =
    score >= 85 ? colors.primary :
    score >= 60 ? colors.secondary :
    colors.textSecondary;

  const label =
    score >= 85 ? "Strong match" :
    score >= 60 ? "Good match" :
    "Emerging match";

  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: spacing.xs, marginBottom: spacing.sm }}>
      <span
        style={{
          color,
          fontSize: typography.fontSize.sm,
          fontWeight: 700,
          fontFamily: typography.fontFamily.serif,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </span>
      {score >= 60 && (
        <span style={{ color: colors.accentMuted, fontSize: "11px", fontFamily: typography.fontFamily.serif }}>
          {score}%
        </span>
      )}
      {confidence === "high" && (
        <span
          style={{
            width: 5, height: 5, borderRadius: "50%",
            backgroundColor: color, display: "inline-block", flexShrink: 0,
          }}
        />
      )}
    </div>
  );
}

type FeedbackButtonsProps = {
  variant: Props["variant"];
  targetId: string;
  dismissed: boolean;
  liked: boolean;
  onDismiss: () => void;
  onLike: () => void;
};

function FeedbackButtons({ variant, targetId, dismissed, liked, onDismiss, onLike }: FeedbackButtonsProps) {
  const [likePending, setLikePending] = useState(false);
  const [hoveredDismiss, setHoveredDismiss] = useState(false);
  const [hoveredLike, setHoveredLike] = useState(false);

  const targetType: FeedbackTargetType =
    variant === "person" ? FeedbackTargetType.USER :
    variant === "book"   ? FeedbackTargetType.BOOK : FeedbackTargetType.CLUB;

  function handleDismiss() {
    if (dismissed || liked || likePending) return;
    onDismiss();
    toast.success("We'll show you less like this.");
    upsertFeedback({ targetType, targetId, action: FeedbackAction.DISLIKE }).catch(() => {
      toast.error("Failed to save feedback.");
    });
  }

  async function handleLike() {
    if (dismissed || liked || likePending) return;
    setLikePending(true);
    try {
      const result = await upsertFeedback({ targetType, targetId, action: FeedbackAction.LIKE });
      if (result.success) {
        onLike();
        toast.success("We'll prioritise similar titles.");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to save feedback.");
    } finally {
      setLikePending(false);
    }
  }

  const dismissColor = hoveredDismiss && !dismissed && !liked ? colors.textSecondary : colors.accentMuted;
  const likeColor = liked ? colors.secondary : hoveredLike && !dismissed ? colors.textSecondary : colors.accentMuted;

  return (
    <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
      <button
        onClick={handleDismiss}
        onMouseEnter={() => setHoveredDismiss(true)}
        onMouseLeave={() => setHoveredDismiss(false)}
        disabled={dismissed || liked || likePending}
        aria-label="Not for me"
        title="Not for me"
        style={{
          background: "none",
          border: "none",
          cursor: dismissed || liked ? "default" : "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          color: dismissColor,
          opacity: dismissed ? 0.4 : 0.8,
          transition: "color 180ms ease, opacity 180ms ease",
        }}
      >
        <ThumbsDown size={13} />
      </button>
      <button
        onClick={handleLike}
        onMouseEnter={() => setHoveredLike(true)}
        onMouseLeave={() => setHoveredLike(false)}
        disabled={dismissed || liked || likePending}
        aria-label="More like this"
        title="More like this"
        style={{
          background: "none",
          border: "none",
          cursor: liked ? "default" : "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          color: likeColor,
          opacity: likePending ? 0.5 : 0.8,
          transition: "color 180ms ease, opacity 180ms ease",
        }}
      >
        <Heart
          size={13}
          fill={liked ? colors.secondary : "none"}
          stroke={liked ? colors.secondary : "currentColor"}
          style={{
            transform: liked ? "scale(1.12)" : "scale(1)",
            transition: "transform 180ms ease, fill 180ms ease, stroke 180ms ease",
          }}
        />
      </button>
    </div>
  );
}

export function MatchCard({
  variant, title, subtitle, coverImage, score, confidence, reasons = [], meta,
  featured, topMatch, exploratory, badge, targetId,
}: Props) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [dismissClicked, setDismissClicked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [likedAnimating, setLikedAnimating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [feedbackMsgFading, setFeedbackMsgFading] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [savingBook, setSavingBook] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (!dismissed) return;
    const timer = setTimeout(() => setHidden(true), 250);
    return () => clearTimeout(timer);
  }, [dismissed]);

  if (hidden) return null;

  const isClickableBook = variant === "book" && Boolean(targetId);
  const visibleReasons = reasons.filter(Boolean).slice(0, 1);

  const defaultShadow = shadow.soft;
  const featuredShadow = "0 4px 16px rgba(139,58,47,0.14)";
  const hoverShadow = featured
    ? "0 10px 28px rgba(139,58,47,0.26)"
    : "0 8px 24px rgba(0,0,0,0.14)";
  const likedShadow = `0 0 0 2px ${colors.secondary}40`;

  const articleBorder = liked
    ? `2px solid ${colors.secondary}`
    : featured
    ? `2px solid ${colors.primary}`
    : exploratory
    ? `1px solid ${colors.secondary}55`
    : `1px solid ${colors.border}`;

  const articleBackground = exploratory ? `${colors.secondary}06` : colors.surface;

  const articleBoxShadow = liked
    ? likedShadow
    : hovered
    ? hoverShadow
    : featured
    ? featuredShadow
    : defaultShadow;

  const articleTransform = dismissed
    ? "scale(0.98)"
    : likedAnimating
    ? "scale(1.02)"
    : hovered
    ? "translateY(-3px)"
    : "translateY(0)";

  async function saveWantToRead() {
    if (!targetId || variant !== "book" || savingBook || savedToLibrary) return;
    setSavingBook(true);
    setSavedToLibrary(true);
    setFeedbackMsg("Added to your library");
    setFeedbackMsgFading(false);
    try {
      const result = await setBookStatus(targetId, "WANT_TO_READ");
      if (result.success) {
        toast.success("Added to want-to-read.");
        router.refresh();
      } else {
        setSavedToLibrary(false);
        setFeedbackMsg(result.error);
        toast.error(result.error);
      }
    } catch {
      setSavedToLibrary(false);
      setFeedbackMsg("Failed to add book");
      toast.error("Failed to add book.");
    } finally {
      setSavingBook(false);
      setTimeout(() => setFeedbackMsgFading(true), 2000);
      setTimeout(() => setFeedbackMsg(null), 2500);
    }
  }

  return (
    <article
      className="group/match"
      role={isClickableBook ? "link" : undefined}
      tabIndex={isClickableBook ? 0 : undefined}
      onClick={() => {
        if (isClickableBook) router.push(`/books/${targetId}`);
      }}
      onKeyDown={(event) => {
        if (!isClickableBook) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/books/${targetId}`);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: articleBackground,
        border: articleBorder,
        borderRadius: radius.lg,
        padding: "12px",
        boxShadow: articleBoxShadow,
        transform: articleTransform,
        opacity: dismissed ? 0 : mounted ? 1 : 0,
        transition: "box-shadow 200ms ease, transform 200ms ease, opacity 200ms ease, border-color 200ms ease",
        minWidth: variant === "book" ? 152 : 196,
        maxWidth: variant === "book" ? 152 : 236,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        cursor: isClickableBook ? "pointer" : "default",
      }}
    >
      {topMatch && <Chip label="Top match" color="#fff" bg={colors.primary} />}
      {!topMatch && exploratory && (
        <Chip label="Try something different" color={colors.secondary} bg={`${colors.secondary}20`} />
      )}
      {!topMatch && !exploratory && badge && (
        <Chip label={badge} color={colors.textSecondary} bg={colors.accentMuted} />
      )}

      {variant === "book" ? (
        <BookCover
          src={coverImage}
          alt=""
          className="mb-2 h-[116px] w-full rounded-md"
          imageClassName={hovered ? "scale-[1.02] transition-transform duration-200" : "transition-transform duration-200"}
          sizes="152px"
        />
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
          {coverImage ? (
            <div
              className="folio-cover"
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                flexShrink: 0,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Image
                src={coverImage} alt=""
                width={76}
                height={76}
                unoptimized
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                  transform: hovered ? "scale(1.02)" : "scale(1)",
                  transition: "transform 200ms ease",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 38, height: 38, borderRadius: "50%",
                backgroundColor: colors.accentMuted,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <span style={{ color: colors.textPrimary, fontWeight: 700, fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.serif }}>
                {title[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{ color: colors.textPrimary, fontWeight: 600, fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.serif, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title}
            </p>
            {subtitle && (
              <p style={{ color: colors.textSecondary, fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.serif, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {variant === "book" && (
        <div style={{ marginBottom: spacing.sm }}>
          <p style={{ color: colors.textPrimary, fontWeight: 600, fontStyle: "italic", fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.serif, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: "1.3" } as React.CSSProperties}>
            {title}
          </p>
          {subtitle && (
            <p style={{ color: colors.textSecondary, fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.serif, margin: `${spacing.xs} 0 0`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {score !== undefined && confidence !== undefined && !exploratory && !badge && (
        <ScoreBadge score={score} confidence={confidence} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}>
        {visibleReasons.map((reason, i) => (
          <p
            key={i}
            style={{
              color: colors.textSecondary,
              fontSize: typography.fontSize.xs,
              fontFamily: typography.fontFamily.serif,
              margin: 0,
              lineHeight: "1.4",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            } as React.CSSProperties}
          >
            {reason}
          </p>
        ))}
        {visibleReasons.length === 0 && !badge && (
          <p style={{ color: colors.accentMuted, fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.serif, margin: 0, fontStyle: "italic" }}>
            Add more books to see why.
          </p>
        )}
      </div>

      <div style={{ marginTop: "auto", paddingTop: spacing.sm }}>
        {meta && (
          <p style={{ color: colors.accentMuted, fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.serif, margin: `0 0 ${spacing.xs}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {meta}
          </p>
        )}
        {targetId && variant === "book" && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              saveWantToRead();
            }}
            onKeyDown={(event) => event.stopPropagation()}
            disabled={savingBook || savedToLibrary}
            aria-label={savedToLibrary ? "Book added to library" : "Add book to want-to-read"}
            title={savedToLibrary ? "Added to library" : "Want to read"}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.xs,
              border: `1px solid ${savedToLibrary ? colors.secondary : colors.border}`,
              backgroundColor: savedToLibrary ? `${colors.secondary}18` : colors.background,
              color: savedToLibrary ? colors.secondary : colors.textSecondary,
              borderRadius: radius.md,
              padding: "6px 8px",
              marginBottom: spacing.sm,
              fontSize: typography.fontSize.xs,
              fontWeight: 700,
              fontFamily: typography.fontFamily.serif,
              cursor: savedToLibrary ? "default" : "pointer",
              transition: "background-color 180ms ease, border-color 180ms ease, color 180ms ease, transform 150ms ease",
            }}
          >
            {savedToLibrary ? <Check size={13} /> : <BookmarkPlus size={13} />}
            {savingBook ? "Saving..." : savedToLibrary ? "Added" : "Want to read"}
          </button>
        )}
        {targetId && (
          <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
            <FeedbackButtons
              variant={variant}
              targetId={targetId}
              dismissed={dismissed || dismissClicked}
              liked={liked}
              onDismiss={() => {
                setDismissClicked(true);
                setFeedbackMsg("We'll show you less like this");
                setFeedbackMsgFading(false);
                setTimeout(() => setDismissed(true), 700);
              }}
              onLike={() => {
                setLiked(true);
                setLikedAnimating(true);
                setFeedbackMsg("We'll prioritise similar titles");
                setFeedbackMsgFading(false);
                setTimeout(() => setLikedAnimating(false), 220);
                setTimeout(() => setFeedbackMsgFading(true), 2000);
                setTimeout(() => setFeedbackMsg(null), 2500);
              }}
            />
          </div>
        )}
        {feedbackMsg && (
          <p
            style={{
              color: colors.secondary,
              fontSize: "11px",
              fontFamily: typography.fontFamily.serif,
              margin: `${spacing.xs} 0 0`,
              fontStyle: "italic",
              opacity: feedbackMsgFading ? 0 : 1,
              transition: "opacity 500ms ease",
              lineHeight: "1.3",
            }}
          >
            {feedbackMsg}
          </p>
        )}
      </div>
    </article>
  );
}
