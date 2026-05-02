"use client";

/**
 * Physical book object used by the My Library shelf.
 *
 * The DOM starts as a narrow spine, then reveals a larger book object when
 * selected. That object is built from three visual layers:
 * - spine: the left edge/hinge of the book.
 * - front cover: the readable cover surface.
 * - page edge: subtle right/bottom thickness behind the cover.
 *
 * Interaction states:
 * - idle: only the shelf spine is visible.
 * - selected: cover and page edge slide forward as one attached object.
 * - pressing: a short scale-down/settle state before opening.
 * - opening: keeps the selected geometry stable while the overlay mounts.
 *
 * The selected visual is wider than the original spine button. CSS expands the
 * button hitbox in selected/opening states so every visible book surface still
 * belongs to the same accessible button.
 */
import type { CSSProperties } from "react";
import { BookOpen } from "lucide-react";
import { BookCover } from "@/components/ui/book-cover";

export type BookshelfBook = {
  id: string;
  title: string;
  author: string;
  cover: string | null;
  status: string;
};

type BookSpineProps = {
  book: BookshelfBook;
  selected: boolean;
  opening: boolean;
  pressing: boolean;
  onActivate: () => void;
};

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

type SpineTheme = CSSProperties & {
  "--folio-spine-accent": string;
  "--folio-spine-text": string;
};

function getSpineTheme(book: BookshelfBook): SpineTheme {
  // TODO: Replace cover-derived spine with generated spine system
  // - dominant colour extraction
  // - readable title layout
  // - contrast rules
  const themes = [
    { top: "hsl(7 42% 32%)", bottom: "hsl(12 36% 20%)", accent: "hsl(31 54% 74%)", text: "hsl(38 42% 93%)" },
    { top: "hsl(159 24% 35%)", bottom: "hsl(162 28% 20%)", accent: "hsl(38 46% 78%)", text: "hsl(42 45% 94%)" },
    { top: "hsl(218 23% 34%)", bottom: "hsl(222 28% 18%)", accent: "hsl(23 48% 76%)", text: "hsl(40 38% 94%)" },
    { top: "hsl(32 38% 36%)", bottom: "hsl(28 36% 20%)", accent: "hsl(146 22% 72%)", text: "hsl(42 42% 94%)" },
    { top: "hsl(332 30% 35%)", bottom: "hsl(338 34% 19%)", accent: "hsl(37 54% 76%)", text: "hsl(40 46% 94%)" },
    { top: "hsl(48 28% 42%)", bottom: "hsl(45 34% 23%)", accent: "hsl(9 45% 76%)", text: "hsl(42 44% 95%)" },
  ];
  const theme = themes[hashString(book.id + book.title) % themes.length];

  return {
    "--folio-spine-accent": theme.accent,
    "--folio-spine-text": theme.text,
    backgroundImage: `
      linear-gradient(90deg, rgb(0 0 0 / 0.2), transparent 18%, rgb(255 255 255 / 0.08) 50%, rgb(0 0 0 / 0.16)),
      linear-gradient(180deg, ${theme.top}, ${theme.bottom})
    `,
    color: theme.text,
  };
}

export function BookSpine({ book, selected, opening, pressing, onActivate }: BookSpineProps) {
  const active = selected || pressing || opening;

  return (
    <button
      type="button"
      data-bookshelf-spine
      data-selected={selected ? "true" : "false"}
      data-opening={opening ? "true" : "false"}
      data-pressing={pressing ? "true" : "false"}
      aria-pressed={selected}
      aria-label={`${selected ? "Open" : "Select"} ${book.title} by ${book.author}`}
      title={`${book.title} by ${book.author}`}
      onClick={onActivate}
      className="folio-book-spine-button"
    >
      <span className="folio-book-3d">
        <span className="folio-book-spine-face" style={getSpineTheme(book)}>
          <span className="folio-book-spine-title">{book.title}</span>
          <span className="folio-book-spine-foot">
            <BookOpen className="h-3 w-3" />
          </span>
        </span>
        {active && (
          <span key={`${book.id}-${selected}`} className="folio-book-object" aria-hidden="true">
            <span className="folio-book-pages-edge" />
            <span className="folio-book-bottom-edge" />
            <span className="folio-book-attached-spine" style={getSpineTheme(book)}>
              <span className="folio-book-attached-spine-title">{book.title}</span>
            </span>
            <span className="folio-book-cover-board" />
            <span className="folio-book-front-cover">
              <BookCover
                src={book.cover}
                alt=""
                className="h-full w-full rounded-[0.28rem] shadow-md"
                sizes="128px"
              />
            </span>
          </span>
        )}
      </span>
    </button>
  );
}
