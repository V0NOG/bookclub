import Image from "next/image";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type BookCoverProps = {
  src?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  iconClassName?: string;
  priority?: boolean;
  sizes?: string;
};

export function BookCover({
  src,
  alt,
  className,
  imageClassName,
  iconClassName,
  priority = false,
  sizes = "(max-width: 640px) 33vw, 160px",
}: BookCoverProps) {
  return (
    <div data-layout-part="book-cover" className={cn("folio-cover aspect-[2/3] overflow-hidden rounded-md bg-muted", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          priority={priority}
          sizes={sizes}
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <BookOpen className={cn("h-5 w-5 text-muted-foreground/50", iconClassName)} />
        </div>
      )}
    </div>
  );
}
