"use client";

import { useState } from "react";
import { colors, typography, spacing, radius, shadow } from "@/styles/design-tokens";
import { BookOpen, Users } from "lucide-react";

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

function CoverPlaceholder({ variant }: { variant: Props["variant"] }) {
  return (
    <div
      style={{
        width: "100%", height: variant === "book" ? 116 : 56,
        backgroundColor: colors.accentMuted, borderRadius: radius.md,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: spacing.sm, flexShrink: 0,
      }}
    >
      {variant === "person"
        ? <Users size={18} color={colors.textSecondary} />
        : <BookOpen size={18} color={colors.textSecondary} />}
    </div>
  );
}

export function MatchCard({
  variant, title, subtitle, coverImage, score, confidence, reasons = [], meta,
  featured, topMatch, exploratory, badge,
}: Props) {
  const [hovered, setHovered] = useState(false);

  const visibleReasons = reasons.filter(Boolean).slice(0, 1);

  const defaultShadow = shadow.soft;
  const featuredShadow = "0 4px 16px rgba(139,58,47,0.14)";
  const hoverShadow = featured
    ? "0 8px 24px rgba(139,58,47,0.22)"
    : "0 6px 18px rgba(0,0,0,0.11)";

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: colors.surface,
        border: featured ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        padding: "12px",
        boxShadow: hovered ? hoverShadow : (featured ? featuredShadow : defaultShadow),
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "box-shadow 160ms ease, transform 160ms ease",
        minWidth: variant === "book" ? 152 : 196,
        maxWidth: variant === "book" ? 152 : 236,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header chip — one of: top match, exploratory, or custom badge */}
      {topMatch && <Chip label="Top match" color="#fff" bg={colors.primary} />}
      {!topMatch && exploratory && (
        <Chip label="Try something different" color={colors.secondary} bg={`${colors.secondary}20`} />
      )}
      {!topMatch && !exploratory && badge && (
        <Chip label={badge} color={colors.textSecondary} bg={colors.accentMuted} />
      )}

      {/* Cover / Avatar */}
      {variant === "book" ? (
        coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage} alt=""
            style={{
              width: "100%", height: 116, objectFit: "cover",
              borderRadius: radius.md, marginBottom: spacing.sm, display: "block",
            }}
          />
        ) : (
          <CoverPlaceholder variant="book" />
        )
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage} alt=""
              style={{
                width: 38, height: 38, borderRadius: "50%", objectFit: "cover",
                flexShrink: 0, border: `1px solid ${colors.border}`,
              }}
            />
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
              <p style={{ color: colors.textSecondary, fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.serif, margin: 0 }}>
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
            <p style={{ color: colors.textSecondary, fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.serif, margin: `${spacing.xs} 0 0` }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Score badge — only for matched items, not exploratory or badge-only */}
      {score !== undefined && confidence !== undefined && !exploratory && !badge && (
        <ScoreBadge score={score} confidence={confidence} />
      )}

      {/* Reasons */}
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}>
        {visibleReasons.map((reason, i) => (
          <p key={i} style={{ color: colors.textSecondary, fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.serif, margin: 0, lineHeight: "1.4" }}>
            {reason}
          </p>
        ))}
        {visibleReasons.length === 0 && !badge && (
          <p style={{ color: colors.accentMuted, fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.serif, margin: 0, fontStyle: "italic" }}>
            Add more books to see why.
          </p>
        )}
      </div>

      {/* Bottom: meta + feedback hooks */}
      <div style={{ marginTop: "auto", paddingTop: spacing.sm }}>
        {meta && (
          <p style={{ color: colors.accentMuted, fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.serif, margin: `0 0 ${spacing.xs}` }}>
            {meta}
          </p>
        )}
        {/* Step 4: feedback hooks — logs interaction, no backend yet */}
        <div style={{ display: "flex", gap: spacing.sm }}>
          <button
            onClick={() => console.log("[folio] dismiss", { variant, title })}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: colors.accentMuted, fontSize: "11px", fontFamily: typography.fontFamily.serif }}
          >
            Not for me
          </button>
          <button
            onClick={() => console.log("[folio] like", { variant, title })}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: colors.secondary, fontSize: "11px", fontFamily: typography.fontFamily.serif }}
          >
            More like this
          </button>
        </div>
      </div>
    </article>
  );
}
