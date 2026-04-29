import { MatchCardSkeleton } from "@/components/match/MatchCardSkeleton";

function CarouselSkeleton({ variant }: { variant: "person" | "book" | "club" }) {
  return (
    <section className="mb-8">
      <div className="animate-pulse h-2.5 w-28 bg-border rounded mb-3" />
      <div className="flex gap-3 overflow-x-hidden pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <MatchCardSkeleton key={i} variant={variant} />
        ))}
      </div>
    </section>
  );
}

export default function HomeLoading() {
  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <div className="animate-pulse h-6 w-48 bg-border rounded mb-2" />
        <div className="animate-pulse h-3.5 w-36 bg-border rounded" />
      </div>
      <CarouselSkeleton variant="person" />
      <CarouselSkeleton variant="book" />
      <CarouselSkeleton variant="club" />
    </div>
  );
}
