"use client";

import { ReactNode, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function HorizontalScrollRow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  function scrollBy(direction: -1 | 1) {
    const node = ref.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.max(280, node.clientWidth * 0.8), behavior: "smooth" });
  }

  return (
    <div className="group/row relative">
      <div ref={ref} className="flex gap-3 overflow-x-auto scroll-smooth pb-2 -mx-1 px-1 no-scrollbar">
        {children}
      </div>
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        className="absolute left-0 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-sm transition-colors hover:bg-accent md:flex"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        className="absolute right-0 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-sm transition-colors hover:bg-accent md:flex"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
