import Link from "next/link";
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
    <Link href={`/clubs/${clubId}`}>
      <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-white/10 hover:-translate-y-0.5 transition-all group cursor-pointer">
        <div className="w-10 h-10 rounded-lg bg-accent flex-shrink-0 flex items-center justify-center overflow-hidden">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <Users className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
            {name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>
          {matchReason && (
            <p className="text-xs text-muted-foreground/60 truncate mt-0.5 italic">{matchReason}</p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-emerald-400">{matchScore}%</p>
          <p className="text-xs text-muted-foreground">match</p>
        </div>
      </div>
    </Link>
  );
}
