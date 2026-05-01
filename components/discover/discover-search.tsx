"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";
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

export function DiscoverSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ShellSearchResult[]>([]);
  const [externalResults, setExternalResults] = useState<ExternalBookResult[]>([]);
  const [externalError, setExternalError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const trimmedQuery = useMemo(() => query.trim(), [query]);

  const runSearch = useCallback((term: string) => {
    startTransition(async () => {
      const [localResults, external] = await Promise.all([
        searchShell(term),
        searchExternalBooksAction(term),
      ]);
      setResults(localResults);
      setExternalResults(external.results);
      setExternalError(external.success ? null : external.error);
    });
  }, [startTransition]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trimmedQuery.length >= 2) runSearch(trimmedQuery);
  }

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setResults([]);
      setExternalResults([]);
      setExternalError(null);
      return;
    }

    const timer = setTimeout(() => {
      runSearch(trimmedQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [runSearch, trimmedQuery]);

  return (
    <section className="mb-8 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <form className="relative" onSubmit={submitSearch}>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="text"
          placeholder="Search books, clubs, readers, challenges..."
          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-24 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setExternalResults([]);
              setExternalError(null);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          disabled={trimmedQuery.length < 2 || isPending}
          className="folio-press absolute right-2 top-1/2 inline-flex h-7 -translate-y-1/2 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {trimmedQuery.length >= 2 && (
        <div className="mt-4">
          {isPending && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching Folio...
            </div>
          )}

          {!isPending && results.length === 0 && (
            <div className="rounded-xl border border-border bg-background px-4 py-5 text-sm text-muted-foreground">
              No matches yet. Try an author, book title, club name, or reader username.
            </div>
          )}

          {!isPending && results.length > 0 && (
            <div className="grid gap-2 md:grid-cols-2">
              {results.map((result) => {
                const Icon = iconMap[result.type];
                return (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.href}
                    className="folio-lift flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-3 hover:bg-accent/45"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-card">
                      <Icon className="h-4 w-4 text-primary" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{result.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span>
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {result.type}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-5 border-t border-border pt-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Real books</p>
              <p className="text-[11px] text-muted-foreground">Open Library first, Google Books fallback</p>
            </div>
            <ExternalBookResults
              query={trimmedQuery}
              results={externalResults}
              loading={isPending}
              error={externalError}
            />
          </div>
        </div>
      )}
    </section>
  );
}
