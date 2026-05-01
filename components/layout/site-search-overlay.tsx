"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, Search, Trophy, User, Users, X } from "lucide-react";
import { searchShell, ShellSearchResult } from "@/app/actions/shell";
import { searchExternalBooksAction } from "@/app/actions/external-books";
import { ExternalBookResult } from "@/lib/books/types";
import { ExternalBookResults } from "@/components/books/external-book-results";

const iconMap = {
  book: BookOpen,
  club: Users,
  reader: User,
  challenge: Trophy,
};

export function SiteSearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ShellSearchResult[]>([]);
  const [externalResults, setExternalResults] = useState<ExternalBookResult[]>([]);
  const [externalError, setExternalError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  const openResult = useCallback((result: ShellSearchResult) => {
    onClose();
    setQuery("");
    setResults([]);
    router.push(result.href);
  }, [onClose, router]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (trimmedQuery.length < 2) {
      setResults([]);
      setExternalResults([]);
      setExternalError(null);
      setActiveIndex(0);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const [nextResults, external] = await Promise.all([
          searchShell(trimmedQuery),
          searchExternalBooksAction(trimmedQuery),
        ]);
        setResults(nextResults);
        setExternalResults(external.results);
        setExternalError(external.success ? null : external.error);
        setActiveIndex(0);
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [open, startTransition, trimmedQuery]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
      }
      if (event.key === "Enter" && results[activeIndex]) {
        event.preventDefault();
        openResult(results[activeIndex]);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, onClose, open, openResult, results]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-foreground/10 px-4 pt-20 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        className="folio-soft-enter mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search books, clubs, readers, challenges..."
            className="h-9 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {trimmedQuery.length < 2 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-semibold text-foreground">Search Folio</p>
              <p className="mt-1 text-xs text-muted-foreground">Type at least two characters to find books, clubs, readers, and challenges.</p>
            </div>
          )}

          {trimmedQuery.length >= 2 && !isPending && results.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-semibold text-foreground">No Folio results found</p>
              <p className="mt-1 text-xs text-muted-foreground">External book results can still be added below.</p>
            </div>
          )}

          {results.map((result, index) => {
            const Icon = iconMap[result.type];
            const active = index === activeIndex;
            return (
              <button
                key={`${result.type}-${result.id}`}
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => openResult(result)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${
                  active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-background">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{result.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {result.type}
                </span>
              </button>
            );
          })}

          {trimmedQuery.length >= 2 && (
            <div className="mt-2 border-t border-border px-2 pb-2 pt-4">
              <div className="mb-2 flex items-center justify-between gap-3 px-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Real books</p>
                <p className="text-[11px] text-muted-foreground">External until added</p>
              </div>
              <ExternalBookResults
                query={trimmedQuery}
                results={externalResults}
                loading={isPending}
                error={externalError}
                compact
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
