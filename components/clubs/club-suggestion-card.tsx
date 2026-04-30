import Link from "next/link";
import Image from "next/image";
import { Users } from "lucide-react";

type Props = {
  clubId: string;
  name: string;
  avatar?: string | null;
  cadence?: string | null;
  memberCount: number;
  matchScore: number;
  matchReason?: string;
};

export function ClubSuggestionCard({
  clubId, name, avatar, cadence, memberCount, matchScore, matchReason,
}: Props) {
  const meta = [cadence, `${memberCount} member${memberCount === 1 ? "" : "s"}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/clubs/${clubId}`} className="group block">
      <div className="folio-lift -mx-2 flex items-center gap-3 rounded-lg border-b border-border/40 px-2 py-3.5 hover:bg-card/45">
        <div className="folio-cover flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent">
          {avatar ? (
            <Image src={avatar} alt="" width={36} height={36} unoptimized className="w-full h-full object-cover rounded-lg" />
          ) : (
            <Users className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>
          {matchReason && (
            <p className="text-xs text-muted-foreground/70 truncate mt-0.5 italic">{matchReason}</p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-primary">{matchScore}%</p>
          <p className="text-xs text-muted-foreground">match</p>
        </div>
      </div>
    </Link>
  );
}
