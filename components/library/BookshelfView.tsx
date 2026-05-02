"use client";

/**
 * Bookshelf interaction controller.
 *
 * This bookshelf interaction is not a simple UI animation. It is a simulated
 * physical interaction system based on hinge-based motion, delayed reaction,
 * depth stacking, and causal animation timing.
 *
 * State machine:
 * - selectedBookId: first click reveals the physical book object on the shelf.
 * - pressingBookId: second click gives the selected book a brief pressed state.
 * - openingBookId: after the press delay, the fullscreen opening overlay mounts.
 *
 * Flow:
 * 1. click a spine -> select the book and reveal its cover.
 * 2. second click -> enter pressing state for tactile feedback.
 * 3. short delay -> mount the opening overlay.
 * 4. overlay animation completes -> navigate to /books/[id].
 *
 * The small delay is intentional. It makes the second click read as a physical
 * action before the fullscreen book takes over the page.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookSpine, BookshelfBook } from "@/components/library/BookSpine";
import { BookOpeningOverlay } from "@/components/library/BookOpeningOverlay";

type BookshelfViewProps = {
  books: BookshelfBook[];
};

const SHELF_SIZE = 14;
const OPEN_ANIMATION_MS = 1650;
const OPEN_PRESS_DELAY_MS = 100;

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
  const [pressingBookId, setPressingBookId] = useState<string | null>(null);
  const [openingBookId, setOpeningBookId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shelves = useMemo(() => chunkBooks(books), [books]);
  const openingBook = openingBookId ? books.find((book) => book.id === openingBookId) : null;

  const clearOpeningTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
      pressTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearOpeningTimers();
    };
  }, [clearOpeningTimers]);

  useEffect(() => {
    if (!openingBookId) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [openingBookId]);

  useEffect(() => {
    if (!selectedBookId) return;
    if (books.some((book) => book.id === selectedBookId)) return;
    clearOpeningTimers();
    setSelectedBookId(null);
    setPressingBookId(null);
    setOpeningBookId(null);
  }, [books, clearOpeningTimers, selectedBookId]);

  function openBook(bookId: string) {
    router.push(`/books/${bookId}`);
  }

  function activateBook(bookId: string) {
    if (openingBookId || pressingBookId) return;

    if (selectedBookId !== bookId) {
      clearOpeningTimers();
      setSelectedBookId(bookId);
      setPressingBookId(null);
      setOpeningBookId(null);
      return;
    }

    if (prefersReducedMotion) {
      openBook(bookId);
      return;
    }

    setPressingBookId(bookId);
    pressTimeoutRef.current = setTimeout(() => {
      setPressingBookId(null);
      setOpeningBookId(bookId);
      timeoutRef.current = setTimeout(() => openBook(bookId), OPEN_ANIMATION_MS);
    }, OPEN_PRESS_DELAY_MS);
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
                const pressing = pressingBookId === book.id;
                return (
                  <div
                    key={book.id}
                    className="folio-book-slot"
                    style={{ zIndex: selected || opening || pressing ? 40 : 1 }}
                  >
                    <BookSpine
                      book={book}
                      selected={selected}
                      opening={opening}
                      pressing={pressing}
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
