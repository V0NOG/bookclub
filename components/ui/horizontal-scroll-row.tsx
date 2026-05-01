"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function HorizontalScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [dragging, setDragging] = useState(false);

  function updateScrollState() {
    const node = ref.current;
    if (!node) return;
    setCanScrollLeft(node.scrollLeft > 4);
    setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 4);
  }

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    updateScrollState();
    node.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    const frame = requestAnimationFrame(updateScrollState);

    return () => {
      node.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      cancelAnimationFrame(frame);
    };
  }, [children]);

  function scrollBy(direction: -1 | 1) {
    const node = ref.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.max(360, node.clientWidth * 0.86), behavior: "smooth" });
  }

  return (
    <div className="group/row relative -mx-4 min-w-0 max-w-full px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div
        ref={ref}
        data-layout-part="horizontal-scroll"
        className={`flex max-w-full touch-pan-x snap-x snap-mandatory select-none gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-4 pt-1 no-scrollbar [&>*]:snap-start ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={(event) => {
          if (event.pointerType === "touch") return;
          const node = ref.current;
          if (!node) return;
          drag.current = { active: true, startX: event.clientX, scrollLeft: node.scrollLeft, moved: false };
          setDragging(true);
          node.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const node = ref.current;
          if (!node || !drag.current.active) return;
          const delta = event.clientX - drag.current.startX;
          if (Math.abs(delta) > 4) drag.current.moved = true;
          node.scrollLeft = drag.current.scrollLeft - delta;
        }}
        onPointerUp={(event) => {
          const node = ref.current;
          if (!node) return;
          drag.current.active = false;
          setDragging(false);
          if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          drag.current.active = false;
          setDragging(false);
        }}
        onClickCapture={(event) => {
          if (!drag.current.moved) return;
          event.preventDefault();
          event.stopPropagation();
          drag.current.moved = false;
        }}
      >
        {children}
      </div>
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          className="absolute left-0 top-1 hidden h-[calc(100%-1.25rem)] w-16 items-center justify-start bg-gradient-to-r from-background via-background/85 to-transparent pl-2 text-foreground opacity-0 transition-opacity hover:opacity-100 group-hover/row:opacity-100 focus:opacity-100 md:flex"
          aria-label="Scroll left"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/95 shadow-sm backdrop-blur">
            <ChevronLeft className="h-5 w-5" />
          </span>
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          className="absolute right-0 top-1 hidden h-[calc(100%-1.25rem)] w-16 items-center justify-end bg-gradient-to-l from-background via-background/85 to-transparent pr-2 text-foreground opacity-0 transition-opacity hover:opacity-100 group-hover/row:opacity-100 focus:opacity-100 md:flex"
          aria-label="Scroll right"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/95 shadow-sm backdrop-blur">
            <ChevronRight className="h-5 w-5" />
          </span>
        </button>
      )}
    </div>
  );
}

export function HorizontalScrollRow({ children }: { children: ReactNode }) {
  return <HorizontalScroll>{children}</HorizontalScroll>;
}
