import { colors, radius, spacing } from "@/styles/design-tokens";

function Slab({
  width,
  height,
  style = {},
}: {
  width: string | number;
  height: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="folio-cover folio-cover-shimmer animate-pulse"
      style={{
        width,
        height,
        backgroundColor: colors.border,
        borderRadius: "4px",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export function MatchCardSkeleton({ variant = "book" }: { variant?: "person" | "book" | "club" }) {
  const isBook = variant === "book";

  return (
    <div
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        padding: "12px",
        minWidth: isBook ? 152 : 196,
        maxWidth: isBook ? 152 : 236,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: spacing.sm,
      }}
    >
      {/* cover / avatar */}
      {isBook ? (
        <Slab width="100%" height={116} style={{ borderRadius: radius.md, marginBottom: 0 }} />
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
          <Slab width={38} height={38} style={{ borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <Slab width="70%" height={12} />
            <Slab width="50%" height={10} />
          </div>
        </div>
      )}

      {/* title (book only) */}
      {isBook && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <Slab width="90%" height={12} />
          <Slab width="60%" height={10} />
        </div>
      )}

      {/* score badge */}
      <Slab width="50%" height={11} />

      {/* reason lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <Slab width="95%" height={10} />
        <Slab width="75%" height={10} />
      </div>

      {/* meta + feedback buttons */}
      <div style={{ marginTop: "auto", paddingTop: spacing.sm, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Slab width="50%" height={10} />
        <div style={{ display: "flex", gap: spacing.sm }}>
          <Slab width={13} height={13} style={{ borderRadius: "50%" }} />
          <Slab width={13} height={13} style={{ borderRadius: "50%" }} />
        </div>
      </div>
    </div>
  );
}
