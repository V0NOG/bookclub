"use client";

import { Search } from "lucide-react";

export function SearchBar() {
  function openGlobalSearch() {
    window.dispatchEvent(new Event("folio:open-search"));
  }

  return (
    <div className="mb-8">
      <button
        type="button"
        onClick={openGlobalSearch}
        className="relative flex w-full items-center rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-left text-sm text-muted-foreground shadow-sm hover:border-primary/40 hover:bg-accent/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
      >
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        Search books, clubs, readers, and challenges...
      </button>
    </div>
  );
}
