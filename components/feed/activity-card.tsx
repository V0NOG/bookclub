import { Star, BookOpen, Users } from "lucide-react";

export type ActivityAction = "finished" | "started" | "rated" | "joined_club";

export type ActivityItem = {
  id: string;
  actorName: string;
  actorAvatar?: string | null;
  action: ActivityAction;
  bookTitle?: string;
  rating?: number;
  clubName?: string;
  timestamp: string;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1 align-middle">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-2.5 w-2.5"
          fill={i < rating ? "#34d399" : "none"}
          stroke={i < rating ? "#34d399" : "#6b7280"}
        />
      ))}
    </span>
  );
}

function ActionLabel({ action }: { action: ActivityAction }) {
  const labels: Record<ActivityAction, string> = {
    finished: "finished",
    started: "started reading",
    rated: "rated",
    joined_club: "joined",
  };
  return <span className="text-muted-foreground">{labels[action]}</span>;
}

export function ActivityCard({
  actorName, actorAvatar, action, bookTitle, rating, clubName, timestamp,
}: Omit<ActivityItem, "id">) {
  const isBookAction = action !== "joined_club";

  return (
    <div className="flex items-start gap-3 px-4 py-3.5 bg-card border border-border rounded-xl hover:border-white/10 transition-colors group">
      <div className="w-8 h-8 rounded-full bg-accent flex-shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
        {actorAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={actorAvatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-white">{actorName[0]?.toUpperCase()}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <span className="font-semibold text-white">{actorName}</span>
          {" "}
          <ActionLabel action={action} />
          {bookTitle && (
            <> <span className="font-medium text-white italic">{bookTitle}</span></>
          )}
          {clubName && (
            <> <span className="font-medium text-white">{clubName}</span></>
          )}
          {rating !== undefined && <StarRow rating={rating} />}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{timestamp}</p>
      </div>

      <div className="flex-shrink-0 mt-1 opacity-30 group-hover:opacity-50 transition-opacity">
        {isBookAction
          ? <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          : <Users className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
    </div>
  );
}
