import { MatchCardSkeleton } from "@/components/match/MatchCardSkeleton";

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-border ${className}`} />;
}

function SearchBarSkeleton() {
  return (
    <div className="mb-8">
      <Pulse className="h-10 w-full mb-3 rounded-xl" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pulse key={i} className="h-7 w-16 rounded-full" />
        ))}
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <section className="mb-10">
      <Pulse className="h-2.5 w-28 mb-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3.5 bg-card border border-border rounded-xl">
            <Pulse className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Pulse className="h-3.5 w-3/4" />
              <Pulse className="h-2.5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CarouselSkeleton({ variant }: { variant: "person" | "book" | "club" }) {
  return (
    <section className="mb-8">
      <Pulse className="h-2.5 w-28 mb-1" />
      <Pulse className="h-2 w-40 mb-3" />
      <div className="flex gap-3 overflow-x-hidden pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <MatchCardSkeleton key={i} variant={variant} />
        ))}
      </div>
    </section>
  );
}

function GridSkeleton({ label }: { label: string }) {
  return (
    <section className="mb-10">
      <Pulse className="h-2.5 w-32 mb-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
            <Pulse className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Pulse className="h-3.5 w-1/2" />
              <Pulse className="h-2.5 w-3/4" />
              <Pulse className="h-2.5 w-1/3" />
            </div>
            {label === "people" && <Pulse className="h-7 w-16 rounded-lg flex-shrink-0" />}
            {label === "clubs" && <div className="text-right flex-shrink-0 space-y-1">
              <Pulse className="h-4 w-8" />
              <Pulse className="h-2.5 w-10" />
            </div>}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomeLoading() {
  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Pulse className="h-7 w-48 mb-2" />
        <Pulse className="h-3.5 w-64" />
      </div>

      <SearchBarSkeleton />
      <ActivitySkeleton />
      <CarouselSkeleton variant="book" />
      <GridSkeleton label="people" />
      <GridSkeleton label="clubs" />
    </div>
  );
}
