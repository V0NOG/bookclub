"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookSpine, BookshelfBook } from "@/components/library/BookSpine";
import { BookOpeningOverlay } from "@/components/library/BookOpeningOverlay";

type BookshelfViewProps = {
  books: BookshelfBook[];
};

const SHELF_SIZE = 14;
const OPEN_ANIMATION_MS = 1450;

function chunkBooks(books: BookshelfBook[]) {
  const shelves: BookshelfBook[][] = [];
  for (let i = 0; i < books.length; i += SHELF_SIZE) {
    shelves.push(books.slice(i, i + SHELF_SIZE));
  }
  return shelves;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);

    function onChange(event: MediaQueryListEvent) {
      setReduced(event.matches);
    }

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function BookshelfView({ books }: BookshelfViewProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [openingBookId, setOpeningBookId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shelves = useMemo(() => chunkBooks(books), [books]);
  const openingBook = openingBookId ? books.find((book) => book.id === openingBookId) : null;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!openingBookId) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [openingBookId]);

  function openBook(bookId: string) {
    router.push(`/books/${bookId}`);
  }

  function activateBook(bookId: string) {
    if (openingBookId) return;

    if (selectedBookId !== bookId) {
      setSelectedBookId(bookId);
      return;
    }

    if (prefersReducedMotion) {
      openBook(bookId);
      return;
    }

    setOpeningBookId(bookId);
    timeoutRef.current = setTimeout(() => openBook(bookId), OPEN_ANIMATION_MS);
  }

  if (books.length === 0) return null;

  return (
    <section className="mb-10" aria-labelledby="bookshelf-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="bookshelf-heading" className="text-base font-semibold text-foreground">
            Bookshelf
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Select a spine to reveal the cover. Select it again to open the book.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {books.length} book{books.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="folio-bookshelf" data-bookshelf-view>
        {shelves.map((shelfBooks, shelfIndex) => (
          <div key={`shelf-${shelfIndex}`} className="folio-bookshelf-row">
            <div className="folio-bookshelf-track" aria-label={`Bookshelf row ${shelfIndex + 1}`}>
              {shelfBooks.map((book) => {
                const selected = selectedBookId === book.id;
                const opening = openingBookId === book.id;
                return (
                  <div
                    key={book.id}
                    className="folio-book-slot"
                    style={{ zIndex: selected || opening ? 40 : 1 }}
                  >
                    <BookSpine
                      book={book}
                      selected={selected}
                      opening={opening}
                      onActivate={() => activateBook(book.id)}
                    />
                  </div>
                );
              })}
            </div>
            <div className="folio-bookshelf-board" aria-hidden="true" />
          </div>
        ))}
      </div>
      {openingBook && <BookOpeningOverlay book={openingBook} />}
    </section>
  );
}
