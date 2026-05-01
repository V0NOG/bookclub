"use client";

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

  // TODO: Consider a generic spine derived from dominant cover colour or fallback palette.
  return {
    backgroundImage: `linear-gradient(180deg, hsl(var(--foreground) / 0.28), hsl(var(--foreground) / 0.52)), url(${book.cover})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export function BookSpine({ book, selected, opening, onActivate }: BookSpineProps) {
  return (
    <button
      type="button"
      data-bookshelf-spine
      data-selected={selected ? "true" : "false"}
      data-opening={opening ? "true" : "false"}
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
