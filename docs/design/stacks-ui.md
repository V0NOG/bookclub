# Stacks — UI Design Direction

> Cozy, literary, serif-first. Feels like a worn hardcover book — calm, warm, personal.

---

## Design Tokens

All values are defined in `/styles/design-tokens.ts` and must be used verbatim. Do not approximate or substitute.

### Colors

| Token | Value | Usage |
|---|---|---|
| `background` | `#F5F1E8` | Page background |
| `surface` | `#ECE6D8` | Cards, panels, sidebar |
| `primary` | `#8B3A2F` | CTAs, active state, accent links |
| `secondary` | `#7A8B6F` | Secondary actions, genre tags, success states |
| `textPrimary` | `#2F2A26` | Headings, body copy |
| `textSecondary` | `#6B625B` | Subtext, metadata, placeholder labels |
| `border` | `#DDD4C5` | Dividers, input borders, card borders |
| `accentMuted` | `#C2B8A3` | Decorative lines, progress track, empty state fills |

No dark mode. The warm parchment palette is intentional — do not invert or add a dark variant.

### Typography

Font family: `'Source Serif 4', 'Iowan Old Style', serif`

Apply via a `<link>` to Google Fonts for Source Serif 4 (weights 400, 600, 700 italic).

| Scale | Size | Usage |
|---|---|---|
| `xs` | 12px | Timestamps, labels, badge text |
| `sm` | 14px | Body copy, card metadata |
| `base` | 16px | Default body, inputs |
| `lg` | 18px | Section headings, card titles |
| `xl` | 24px | Page headings |
| `display` | 32px | Hero headings, empty state headings |

All weights use the serif family. Use `font-weight: 600` for headings, `400` for body. Italic (`font-style: italic`) for book titles throughout the UI.

### Spacing

| Token | Value |
|---|---|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 12px |
| `lg` | 16px |
| `xl` | 24px |
| `xxl` | 32px |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `sm` | 6px | Chips, tags, small buttons |
| `md` | 10px | Input fields, compact cards |
| `lg` | 16px | Feed cards, book cards |
| `xl` | 20px | Modals, large panels |

### Shadow

`soft: 0 2px 8px rgba(0,0,0,0.06)` — applied to cards and surface elements. Do not use stronger shadows.

---

## Layout Philosophy

**Feed-first.** Home is not a dashboard. It is an activity stream. Users open Folio to see what their reading community is doing, then act on that context (discover a book, join a club, log progress).

Navigation is secondary to content. The sidebar carries users between sections but does not dominate visual weight.

---

## Page Structures

### Home (`/home`)

```
┌─────────────────────────────────────┐
│  SearchBar (clubs & events)         │
│  FilterChips: genre | remote/in-    │
│    person | cadence | popular       │
│─────────────────────────────────────│
│  Feed:                              │
│    FeedCard (friend activity)       │
│    FeedCard (club post)             │
│    UserMatchCard (people to follow) │
│    ClubCard (clubs you'd love)      │
│    FeedCard ...                     │
└─────────────────────────────────────┘
```

The feed mixes card types. Match cards and club recommendations are injected inline between activity items — not in a sidebar panel.

### Discover (`/discover`)

```
┌─────────────────────────────────────┐
│  SearchBar (books, authors, moods)  │
│─────────────────────────────────────│
│  ShelfCarousel: "For you"           │
│  ShelfCarousel: "In your network"   │
│  ShelfCarousel: "Curated lists"     │
└─────────────────────────────────────┘
```

### Library (`/library`)

```
┌─────────────────────────────────────┐
│  Stats bar: books | time | pages    │
│─────────────────────────────────────│
│  ShelfCarousel: Currently reading   │
│    (each card shows progress bar)   │
│  ShelfCarousel: Want to Read        │
│  ShelfCarousel: Read                │
│  ShelfCarousel: Abandoned           │
│  Custom shelves (user-created)      │
└─────────────────────────────────────┘
```

---

## Component Summary

Defined fully in `/docs/design/components.md`.

| Component | Purpose |
|---|---|
| `FeedCard` | Activity item in home/feed |
| `UserMatchCard` | Taste-matched reader suggestion |
| `ClubCard` | Book club with compatibility info |
| `BookCard` | Single book, compact or full variant |
| `ShelfCarousel` | Scrollable book row with heading |
| `FilterChips` | Toggleable pill filter row |
| `SearchBar` | Controlled search input |

---

## Visual Tone

- **Warmth over precision.** Rounded corners, generous padding, soft shadows. Nothing feels sharp or clinical.
- **Content leads.** Book covers are the primary visual element — let them breathe.
- **Serif everywhere.** No sans-serif fallback in the UI. The literary feel depends on consistent use of Source Serif 4.
- **Muted interactions.** Hover states use `accentMuted` or slight surface darkening — not colour jumps. Active/selected states use `primary`.
- **Stars, not numbers.** Ratings are always displayed as filled stars, never as raw numbers (e.g. "4.2/5").

---

## What This Is Not

- Not a dark-mode app. The parchment background is a deliberate identity choice.
- Not Goodreads. No table layouts, no dense metadata grids.
- Not Spotify. No green accents, no dark surfaces — those belong to the previous design direction.
- Not a dashboard. Home is a feed, not a stats screen.
