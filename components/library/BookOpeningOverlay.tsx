"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen } from "lucide-react";
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
          <div className="folio-book-opening-cover">
            <BookCover
              src={book.cover}
              alt=""
              className="h-full w-full rounded-lg shadow-2xl"
              iconClassName="h-12 w-12"
              sizes="(max-width: 640px) 72vw, 320px"
            />
          </div>
          <div className="folio-book-opening-page folio-book-opening-page-left" />
          <div className="folio-book-opening-page folio-book-opening-page-right" />
          <div className="folio-book-opening-gutter" />
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-background">
          <BookOpen className="h-4 w-4" />
          <span className="max-w-[22rem] truncate italic">{book.title}</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
