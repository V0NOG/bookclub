"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, Search, Trophy, User, Users, X } from "lucide-react";
import { searchShell, ShellSearchResult } from "@/app/actions/shell";

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
      setActiveIndex(0);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const nextResults = await searchShell(trimmedQuery);
        setResults(nextResults);
        setActiveIndex(0);
      });
    }, 180);

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
              <p className="text-sm font-semibold text-foreground">No results found</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a book title, author, club name, or reader username.</p>
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
        </div>
      </div>
    </div>
  );
}
