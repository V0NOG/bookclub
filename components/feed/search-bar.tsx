"use client";

import { useState } from "react";
import { Search } from "lucide-react";

const FILTERS = ["Genre", "Remote", "Cadence", "Popular"] as const;

export function SearchBar() {
  const [active, setActive] = useState<Set<string>>(new Set());

  function toggle(f: string) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }

  return (
    <div className="mb-8">
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Find clubs & events..."
          className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => toggle(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              active.has(f)
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : "bg-card border-border text-muted-foreground hover:text-white hover:border-white/20"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}
