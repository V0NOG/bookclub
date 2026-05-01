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

function fallbackSpineStyle(book: BookshelfBook) {
  const hue = 12 + (hashString(book.id + book.title) % 72);
  return {
    backgroundImage: `linear-gradient(180deg, hsl(${hue} 32% 34%), hsl(${hue + 8} 26% 24%))`,
  };
}

function coverSpineStyle(book: BookshelfBook) {
  if (!book.cover) return fallbackSpineStyle(book);

  // TODO: Replace cover-derived spine with generated spine system
  // (dominant colour + title layout + contrast rules).
  return {
    backgroundImage: `linear-gradient(180deg, hsl(var(--foreground) / 0.28), hsl(var(--foreground) / 0.52)), url(${book.cover})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export function BookSpine({ book, selected, opening, pressing, onActivate }: BookSpineProps) {
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
        <span className="folio-book-spine-face" style={coverSpineStyle(book)}>
          <span className="folio-book-spine-title">{book.title}</span>
          <span className="folio-book-spine-foot">
            <BookOpen className="h-3 w-3" />
          </span>
        </span>
        <span className="folio-book-object" aria-hidden="true">
          <span className="folio-book-pages-edge" />
          <span className="folio-book-attached-spine" style={coverSpineStyle(book)}>
            <span className="folio-book-attached-spine-title">{book.title}</span>
          </span>
          <span className="folio-book-front-cover">
            <BookCover
              src={book.cover}
              alt=""
              className="h-full w-full rounded-r-md rounded-l-sm shadow-md"
              sizes="128px"
            />
          </span>
        </span>
      </span>
    </button>
  );
}
