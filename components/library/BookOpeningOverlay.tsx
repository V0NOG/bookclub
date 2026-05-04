"use client";

/**
 * Fullscreen book-opening animation.
 *
 * The overlay is rendered through a portal so the book can animate outside the
 * shelf row's scroll and stacking constraints. It owns the cinematic sequence:
 * zoom toward the viewer, front cover opens on a left hinge, three page layers
 * follow the cover, then BookshelfView navigates to the book detail route.
 *
 * The overlay is visual only. Navigation timing and reduced-motion behavior are
 * controlled by BookshelfView.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BookCover } from "@/components/ui/book-cover";
import { BookshelfBook } from "@/components/library/BookSpine";

type BookOpeningOverlayProps = {
  book: BookshelfBook;
};

export function BookOpeningOverlay({ book }: BookOpeningOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="folio-book-opening-overlay" data-bookshelf-opening-overlay aria-hidden="true">
      <div className="folio-book-opening-stage">
        <div className="folio-book-opening-book">
          <div className="folio-book-opening-table-shadow" />
          <div className="folio-book-opening-left-cover" />
          <div className="folio-book-opening-left-page-block" />
          <div className="folio-book-opening-right-cover-board" />
          <div className="folio-book-opening-right-page-block" />
          <div className="folio-book-opening-page folio-book-opening-page-three" />
          <div className="folio-book-opening-page folio-book-opening-page-two" />
          <div className="folio-book-opening-page folio-book-opening-page-one" />
          <div className="folio-book-opening-front-cover">
            <BookCover
              src={book.cover}
              alt=""
              className="h-full w-full rounded-[0.25rem] shadow-2xl"
              iconClassName="h-12 w-12"
              sizes="(max-width: 640px) 72vw, 320px"
            />
          </div>
          <div className="folio-book-opening-gutter" />
        </div>
      </div>
    </div>,
    document.body
  );
}
