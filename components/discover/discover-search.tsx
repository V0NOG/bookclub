"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { BookOpen, Loader2, Search, Trophy, User, Users, X } from "lucide-react";
import { searchShell, ShellSearchResult } from "@/app/actions/shell";

const iconMap = {
  book: BookOpen,
  club: Users,
  reader: User,
  challenge: Trophy,
};

export function DiscoverSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ShellSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        setResults(await searchShell(trimmedQuery));
      });
    }, 180);

    return () => clearTimeout(timer);
  }, [trimmedQuery, startTransition]);

  return (
    <section className="mb-8 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="text"
          placeholder="Search books, clubs, readers, challenges..."
          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

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
        </div>
      )}
    </section>
  );
}
