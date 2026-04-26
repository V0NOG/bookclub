# Folio Phase 6: Challenges, Social Feed, Achievements & Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the reading challenges page with leaderboards, social feed ranked by taste relevance, achievements display, settings page, and final responsive polish.

**Architecture:** Challenges page is server-rendered with live leaderboard data. Feed uses a server-side ranking algorithm. Settings page handles user profile mutations. Mobile responsiveness added via Tailwind responsive classes.

**Tech Stack:** Next.js 14 server components, Prisma, Tailwind responsive classes, shadcn.

**Prerequisite:** Phases 1–5 complete.

---

## File Map

| File | Purpose |
|------|---------|
| `app/(app)/challenges/page.tsx` | Challenges listing + leaderboards |
| `app/(app)/feed/page.tsx` | Social feed with taste-ranked items |
| `app/(app)/settings/page.tsx` | User settings (profile, password, goals) |
| `app/api/challenges/route.ts` | GET/POST challenges |
| `app/api/challenges/[id]/join/route.ts` | POST join challenge |
| `app/api/settings/route.ts` | PATCH user settings |
| `components/challenges/challenge-card.tsx` | Challenge card with leaderboard |
| `components/challenges/leaderboard.tsx` | Ranked leaderboard component |
| `components/feed/feed-item.tsx` | Individual feed item |
| `components/achievements/achievement-badge.tsx` | Achievement display badge |
| `lib/scoring/reading-score.ts` | Award points utility |
| `lib/scoring/challenge-leaderboard.ts` | Challenge ranking utility |
| `lib/feed/ranking.ts` | Feed ranking algorithm |

---

### Task 1: Scoring utilities

**Files:**
- Create: `lib/scoring/reading-score.ts`
- Create: `lib/scoring/challenge-leaderboard.ts`
- Create: `lib/feed/ranking.ts`

- [ ] **Step 1: Create `lib/scoring/reading-score.ts`**

```typescript
import { db } from "@/lib/db";

type AwardReason =
  | "session_logged"
  | "book_finished"
  | "review_written"
  | "challenge_joined"
  | "challenge_completed"
  | "poll_voted"
  | "streak_7_days"
  | "streak_30_days";

const POINT_VALUES: Record<AwardReason, number> = {
  session_logged: 10,
  book_finished: 100,
  review_written: 30,
  challenge_joined: 15,
  challenge_completed: 200,
  poll_voted: 5,
  streak_7_days: 75,
  streak_30_days: 250,
};

export async function awardPoints(userId: string, reason: AwardReason): Promise<void> {
  const points = POINT_VALUES[reason];
  await db.userScore.upsert({
    where: { userId },
    update: { totalPoints: { increment: points }, lastReadAt: new Date() },
    create: { userId, totalPoints: points, lastReadAt: new Date() },
  });
}

export async function updateStreak(userId: string): Promise<number> {
  const score = await db.userScore.findUnique({ where: { userId } });
  if (!score) return 1;

  const lastRead = score.lastReadAt;
  const now = new Date();
  const daysSinceLast = lastRead
    ? Math.floor((now.getTime() - lastRead.getTime()) / 86400000)
    : 999;

  let newStreak: number;
  if (daysSinceLast === 0) {
    newStreak = score.streakDays; // already logged today
  } else if (daysSinceLast === 1) {
    newStreak = score.streakDays + 1; // consecutive day
  } else {
    newStreak = 1; // streak broken
  }

  await db.userScore.update({
    where: { userId },
    data: { streakDays: newStreak, lastReadAt: now },
  });

  // Award streak achievements
  if (newStreak === 7) await awardPoints(userId, "streak_7_days");
  if (newStreak === 30) await awardPoints(userId, "streak_30_days");

  return newStreak;
}
```

- [ ] **Step 2: Create `lib/scoring/challenge-leaderboard.ts`**

```typescript
import { db } from "@/lib/db";

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  progress: number;
  isCurrentUser: boolean;
};

export async function getChallengeLeaderboard(
  challengeId: string,
  currentUserId?: string,
  limit = 10
): Promise<LeaderboardEntry[]> {
  const participants = await db.challengeParticipant.findMany({
    where: { challengeId, isPrivate: false },
    include: { challenge: true },
    orderBy: { progress: "desc" },
    take: limit,
  });

  const userIds = participants.map((p) => p.userId);
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, username: true, avatar: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return participants.map((p, i) => {
    const user = userMap.get(p.userId);
    return {
      rank: i + 1,
      userId: p.userId,
      name: user?.name ?? null,
      username: user?.username ?? null,
      avatar: user?.avatar ?? null,
      progress: p.progress,
      isCurrentUser: p.userId === currentUserId,
    };
  });
}
```

- [ ] **Step 3: Create `lib/feed/ranking.ts`**

```typescript
import { db } from "@/lib/db";
import { buildUserTasteSnapshot } from "@/lib/taste/profile";
import { calculateUserToBookMatch } from "@/lib/matching/user-to-book";

export type FeedEntry = {
  id: string;
  type: string;
  actorId: string;
  actorName: string | null;
  actorAvatar: string | null;
  entityId: string;
  entityType: string;
  content: Record<string, unknown>;
  relevanceScore: number;
  createdAt: Date;
};

/** Synthesise a ranked social feed for a user from social graph activity. */
export async function buildRankedFeed(userId: string, limit = 30): Promise<FeedEntry[]> {
  const userSnapshot = await buildUserTasteSnapshot(userId);

  // Get users the current user follows
  const follows = await db.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = follows.map((f) => f.followingId);

  // Get club members from user's clubs
  const userClubs = await db.clubMember.findMany({
    where: { userId },
    select: { clubId: true },
  });
  const clubIds = userClubs.map((c) => c.clubId);
  const clubMemberships = await db.clubMember.findMany({
    where: { clubId: { in: clubIds }, userId: { not: userId } },
    select: { userId: true },
  });
  const clubMemberIds = [...new Set(clubMemberships.map((m) => m.userId))];

  const actorIds = [...new Set([...followingIds, ...clubMemberIds])];
  if (actorIds.length === 0) {
    // Return activity from all users for cold start
    actorIds.push(...(await db.user.findMany({ where: { id: { not: userId } }, select: { id: true }, take: 10 })).map((u) => u.id));
  }

  // Fetch recent reviews from social graph
  const reviews = await db.review.findMany({
    where: { userId: { in: actorIds }, isPublic: true },
    include: { user: true, book: { include: { tasteDimensions: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const feedEntries: FeedEntry[] = reviews.map((review) => {
    const bookMatch = calculateUserToBookMatch(userSnapshot, {
      bookId: review.bookId,
      title: review.book.title,
      author: review.book.author,
      genres: review.book.genres,
      tags: review.book.tags,
      dimensions: review.book.tasteDimensions ?? {},
    });

    // Relevance: 60% taste match, 30% recency, 10% follow boost
    const daysAgo = (Date.now() - review.createdAt.getTime()) / 86400000;
    const recencyScore = Math.max(0, 1 - daysAgo / 30);
    const followBoost = followingIds.includes(review.userId) ? 0.1 : 0;
    const relevanceScore = (bookMatch.score / 100) * 0.6 + recencyScore * 0.3 + followBoost;

    return {
      id: review.id,
      type: "REVIEW_CREATED",
      actorId: review.userId,
      actorName: review.user.name,
      actorAvatar: review.user.avatar,
      entityId: review.bookId,
      entityType: "book",
      content: {
        bookTitle: review.book.title,
        bookAuthor: review.book.author,
        bookCover: review.book.cover,
        rating: review.rating,
        reviewText: review.content,
        matchScore: bookMatch.score,
        matchReason: bookMatch.matchReasons[0] ?? null,
      },
      relevanceScore,
      createdAt: review.createdAt,
    };
  });

  // Sort by relevance, then recency
  return feedEntries
    .sort((a, b) => b.relevanceScore - a.relevanceScore || b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/scoring/ lib/feed/
git commit -m "feat: scoring utilities, challenge leaderboard, and feed ranking algorithm"
```

---

### Task 2: Challenges API and page

**Files:**
- Create: `app/api/challenges/route.ts`
- Create: `app/api/challenges/[id]/join/route.ts`
- Create: `components/challenges/leaderboard.tsx`
- Create: `components/challenges/challenge-card.tsx`
- Create: `app/(app)/challenges/page.tsx`

- [ ] **Step 1: Create `app/api/challenges/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { ChallengeType } from "@prisma/client";

export async function GET() {
  const challenges = await db.readingChallenge.findMany({
    where: { isPublic: true },
    include: { _count: { select: { participants: true } }, book: true, club: true },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json(challenges);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, type, startDate, endDate, target, clubId, bookId, isPublic } = await req.json() as {
    title: string; description?: string; type: ChallengeType;
    startDate: string; endDate: string; target?: number;
    clubId?: string; bookId?: string; isPublic?: boolean;
  };

  const challenge = await db.readingChallenge.create({
    data: {
      title,
      description,
      type,
      creatorId: session.user.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      target,
      clubId,
      bookId,
      isPublic: isPublic ?? true,
      participants: { create: { userId: session.user.id } },
    },
  });

  return NextResponse.json(challenge, { status: 201 });
}
```

- [ ] **Step 2: Create `app/api/challenges/[id]/join/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { awardPoints } from "@/lib/scoring/reading-score";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const participant = await db.challengeParticipant.upsert({
    where: { challengeId_userId: { challengeId: params.id, userId: session.user.id } },
    update: {},
    create: { challengeId: params.id, userId: session.user.id },
  });

  await awardPoints(session.user.id, "challenge_joined");

  return NextResponse.json(participant, { status: 201 });
}
```

- [ ] **Step 3: Create `components/challenges/leaderboard.tsx`**

```typescript
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { LeaderboardEntry } from "@/lib/scoring/challenge-leaderboard";
import { cn } from "@/lib/utils";

type Props = { entries: LeaderboardEntry[]; unit?: string };

const MEDALS = ["🥇", "🥈", "🥉"];

export function Leaderboard({ entries, unit = "pages" }: Props) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No participants yet. Be the first!</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.userId}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border transition-all",
            entry.isCurrentUser ? "border-emerald-500/40 bg-emerald-500/5" : "border-border"
          )}
        >
          <span className="w-6 text-center text-sm font-bold">
            {entry.rank <= 3 ? MEDALS[entry.rank - 1] : entry.rank}
          </span>
          <Avatar className="h-8 w-8">
            <AvatarImage src={entry.avatar ?? undefined} />
            <AvatarFallback className="text-xs bg-emerald-500/20 text-emerald-400">
              {entry.name?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium truncate", entry.isCurrentUser ? "text-emerald-400" : "text-white")}>
              {entry.name ?? entry.username}
              {entry.isCurrentUser && <span className="ml-1 text-xs">(you)</span>}
            </p>
          </div>
          <span className="text-sm font-bold text-white">
            {entry.progress.toLocaleString()} {unit}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create `components/challenges/challenge-card.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaderboard } from "./leaderboard";
import type { LeaderboardEntry } from "@/lib/scoring/challenge-leaderboard";
import { Calendar, Users, Trophy } from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  startDate: string;
  endDate: string;
  target: number | null;
  isParticipating: boolean;
  participantCount: number;
  leaderboard: LeaderboardEntry[];
};

type Props = { challenge: Challenge };

const TYPE_LABELS: Record<string, string> = {
  FASTEST_FINISH: "Fastest to finish",
  MOST_PAGES_WEEK: "Most pages",
  MOST_MINUTES_MONTH: "Most minutes",
  CLUB_MONTHLY: "Club challenge",
  FRIEND_GROUP: "Friend challenge",
  PERSONAL_GOAL: "Personal goal",
};

const UNIT: Record<string, string> = {
  FASTEST_FINISH: "pages",
  MOST_PAGES_WEEK: "pages",
  MOST_MINUTES_MONTH: "minutes",
  CLUB_MONTHLY: "pages",
  FRIEND_GROUP: "pages",
  PERSONAL_GOAL: "pages",
};

export function ChallengeCard({ challenge }: Props) {
  const [participating, setParticipating] = useState(challenge.isParticipating);
  const [loading, setLoading] = useState(false);
  const isActive = new Date(challenge.endDate) > new Date();
  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / 86400000));

  async function handleJoin() {
    setLoading(true);
    await fetch(`/api/challenges/${challenge.id}/join`, { method: "POST" });
    setParticipating(true);
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white">{challenge.title}</h3>
              <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}>
                {isActive ? `${daysLeft}d left` : "Ended"}
              </Badge>
              <Badge variant="outline" className="text-xs border-border">
                {TYPE_LABELS[challenge.type] ?? challenge.type}
              </Badge>
            </div>
            {challenge.description && (
              <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {challenge.participantCount} participants
              </span>
              {challenge.target && (
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  Goal: {challenge.target.toLocaleString()} {UNIT[challenge.type]}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Ends {new Date(challenge.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
            </div>
          </div>
          {isActive && !participating && (
            <Button size="sm" onClick={handleJoin} disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white flex-shrink-0">
              {loading ? "..." : "Join"}
            </Button>
          )}
          {participating && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Joined ✓</Badge>
          )}
        </div>
      </div>

      {challenge.leaderboard.length > 0 && (
        <div className="p-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-3">LEADERBOARD</h4>
          <Leaderboard entries={challenge.leaderboard.slice(0, 5)} unit={UNIT[challenge.type]} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create `app/(app)/challenges/page.tsx`**

```typescript
import { requireOnboarding } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getChallengeLeaderboard } from "@/lib/scoring/challenge-leaderboard";
import { ChallengeCard } from "@/components/challenges/challenge-card";

export default async function ChallengesPage() {
  const session = await requireOnboarding();
  const userId = session.user.id;

  const challenges = await db.readingChallenge.findMany({
    where: { isPublic: true },
    include: { _count: { select: { participants: true } }, book: true },
    orderBy: { startDate: "asc" },
  });

  const participations = new Set(
    (await db.challengeParticipant.findMany({ where: { userId }, select: { challengeId: true } }))
      .map((p) => p.challengeId)
  );

  const challengeData = await Promise.all(
    challenges.map(async (c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      type: c.type,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
      target: c.target,
      isParticipating: participations.has(c.id),
      participantCount: c._count.participants,
      leaderboard: await getChallengeLeaderboard(c.id, userId, 5),
    }))
  );

  const active = challengeData.filter((c) => new Date(c.endDate) > new Date());
  const past = challengeData.filter((c) => new Date(c.endDate) <= new Date());

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Reading Challenges</h1>
        <p className="text-muted-foreground">Compete, track progress, and celebrate milestones.</p>
      </div>

      {active.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Active Challenges</h2>
          <div className="space-y-4">
            {active.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Past Challenges</h2>
          <div className="space-y-4">
            {past.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
          </div>
        </section>
      )}

      {challengeData.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No challenges yet. Create one from a club page!</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/challenges/ app/api/challenges/ components/challenges/ lib/scoring/
git commit -m "feat: reading challenges page with leaderboards and join functionality"
```

---

### Task 3: Social feed page

**Files:**
- Create: `components/feed/feed-item.tsx`
- Create: `app/(app)/feed/page.tsx`

- [ ] **Step 1: Create `components/feed/feed-item.tsx`**

```typescript
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, BookOpen } from "lucide-react";
import type { FeedEntry } from "@/lib/feed/ranking";
import { MatchBadge } from "@/components/taste/match-badge";

type Props = { entry: FeedEntry };

function TimeAgo({ date }: { date: Date }) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 60) return <>{mins}m ago</>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <>{hrs}h ago</>;
  return <>{Math.floor(hrs / 24)}d ago</>;
}

export function FeedItem({ entry }: Props) {
  const c = entry.content as Record<string, unknown>;

  if (entry.type === "REVIEW_CREATED") {
    return (
      <div className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-border/80 transition-colors">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={entry.actorAvatar ?? undefined} />
          <AvatarFallback className="text-sm bg-emerald-500/20 text-emerald-400">
            {entry.actorName?.[0] ?? "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <span className="font-medium text-white text-sm">{entry.actorName}</span>
              <span className="text-muted-foreground text-sm"> reviewed a book</span>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              <TimeAgo date={entry.createdAt} />
            </span>
          </div>

          <div className="flex gap-3">
            {c.bookCover ? (
              <img src={c.bookCover as string} alt="" className="h-16 w-11 object-cover rounded flex-shrink-0" />
            ) : (
              <div className="h-16 w-11 bg-muted rounded flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-sm text-white">{c.bookTitle as string}</p>
              <p className="text-xs text-muted-foreground">{c.bookAuthor as string}</p>
              <div className="flex items-center gap-1 my-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < (c.rating as number) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
              {c.matchScore && (
                <MatchBadge score={c.matchScore as number} confidence="medium" size="sm" />
              )}
            </div>
          </div>

          {c.reviewText && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{c.reviewText as string}</p>
          )}

          {c.matchReason && (
            <p className="text-xs text-emerald-400/80 mt-2">→ {c.matchReason as string}</p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 2: Create `app/(app)/feed/page.tsx`**

```typescript
import { requireOnboarding } from "@/lib/auth-helpers";
import { buildRankedFeed } from "@/lib/feed/ranking";
import { FeedItem } from "@/components/feed/feed-item";
import { Rss } from "lucide-react";

export default async function FeedPage() {
  const session = await requireOnboarding();
  const feed = await buildRankedFeed(session.user.id, 30);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Social Feed</h1>
        <p className="text-muted-foreground">Activity from readers with similar taste, ranked by relevance.</p>
      </div>

      {feed.length === 0 ? (
        <div className="text-center py-24">
          <Rss className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Follow readers or join clubs to see activity here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feed.map((entry) => (
            <FeedItem key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/feed/ components/feed/ lib/feed/
git commit -m "feat: social feed ranked by taste relevance"
```

---

### Task 4: Settings page

**Files:**
- Create: `app/api/settings/route.ts`
- Create: `app/(app)/settings/page.tsx`

- [ ] **Step 1: Create `app/api/settings/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const settingsSchema = z.object({
  name: z.string().min(2).optional(),
  username: z.string().min(2).max(30).optional(),
  bio: z.string().max(200).optional(),
  location: z.string().max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as z.infer<typeof settingsSchema>;
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const { name, username, bio, location, currentPassword, newPassword } = parsed.data;

  // Password change flow
  if (currentPassword && newPassword) {
    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user?.passwordHash) return NextResponse.json({ error: "No password set" }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    const newHash = await bcrypt.hash(newPassword, 10);
    await db.user.update({ where: { id: session.user.id }, data: { passwordHash: newHash } });
    return NextResponse.json({ success: true });
  }

  // Check username uniqueness
  if (username) {
    const existing = await db.user.findFirst({ where: { username, id: { not: session.user.id } } });
    if (existing) return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: { name, username, bio, location },
    select: { id: true, name: true, username: true, bio: true, location: true },
  });

  return NextResponse.json(user);
}
```

- [ ] **Step 2: Create `app/(app)/settings/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio, location }),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    else { const d = await res.json() as { error: string }; setError(d.error); }
    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwSaving(true);
    setPwError(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) { setPwSaved(true); setCurrentPassword(""); setNewPassword(""); setTimeout(() => setPwSaved(false), 2000); }
    else { const d = await res.json() as { error: string }; setPwError(d.error); }
    setPwSaving(false);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">Settings</h1>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-white">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label>Display name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="bg-background resize-none" placeholder="Tell other readers about yourself..." />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="bg-background" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={saving} className={saved ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white"}>
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-white">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Current password</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>New password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" className="bg-background" />
            </div>
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            <Button type="submit" disabled={pwSaving || !currentPassword || !newPassword} variant="outline" className="border-border">
              {pwSaving ? "Updating..." : pwSaved ? "Updated ✓" : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-white">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Email: {session?.user?.email}</p>
            <Separator className="bg-border" />
            <p className="text-xs text-muted-foreground">
              To delete your account or export your data, contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/settings/ app/api/settings/
git commit -m "feat: settings page — profile edit and password change"
```

---

### Task 5: Achievements component and profile integration

**Files:**
- Create: `components/achievements/achievement-badge.tsx`

- [ ] **Step 1: Create `components/achievements/achievement-badge.tsx`**

```typescript
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  achievement: {
    key: string;
    title: string;
    description: string;
    icon: string | null;
    points: number;
  };
  size?: "sm" | "md";
};

export function AchievementBadge({ achievement, size = "md" }: Props) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`
            inline-flex items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20
            ${size === "sm" ? "h-8 w-8 text-sm" : "h-12 w-12 text-xl"}
            cursor-default hover:bg-yellow-500/20 transition-colors
          `}>
            {achievement.icon ?? "🏆"}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-card border-border">
          <p className="font-semibold text-white">{achievement.title}</p>
          <p className="text-xs text-muted-foreground">{achievement.description}</p>
          <p className="text-xs text-yellow-400 mt-1">+{achievement.points} pts</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/achievements/
git commit -m "feat: achievement badge component with tooltip"
```

---

### Task 6: Responsive polish

**Files:**
- Modify: `app/(app)/layout.tsx`
- Modify: `components/layout/sidebar.tsx`

- [ ] **Step 1: Add mobile sidebar toggle to `app/(app)/layout.tsx`**

Replace the layout with a mobile-aware version:

```typescript
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { CurrentlyReadingBar } from "@/components/layout/currently-reading-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) redirect("/sign-in");
  if (!session.user.onboarded) redirect("/onboarding");

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar — hidden on mobile, visible on md+ */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 md:ml-60 min-h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-16">
          {children}
        </main>
        <CurrentlyReadingBar />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add responsive classes to key pages**

In `app/(app)/home/page.tsx`, ensure the grid for club matches is responsive:

Find:
```
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

This is already responsive. Verify all pages use `p-4 md:p-6` for padding and `text-2xl md:text-3xl` for headings.

Update the home page heading block:
```typescript
<div>
  <h1 className="text-2xl md:text-3xl font-bold text-white">
    Good reading, {session.user.name?.split(" ")[0]} 👋
  </h1>
  <p className="text-muted-foreground mt-1">Here's what we've found for you today.</p>
</div>
```

- [ ] **Step 3: Verify responsive layout**

In Chrome DevTools, set viewport to 375px (iPhone SE). Expected: No sidebar, content fills full width, readable text.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/layout.tsx app/\(app\)/home/page.tsx
git commit -m "feat: responsive layout — sidebar hidden on mobile, paddings adjusted"
```

---

### Task 7: Final README and project documentation

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# Folio

> Find your next favourite book — and the people to read it with.

Folio is a Spotify-style social reading platform featuring taste-matched book recommendations, book club discovery, reading challenges, and a social feed.

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+

### Setup

1. Clone and install:
   \`\`\`bash
   npm install
   \`\`\`

2. Configure environment:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your database credentials
   \`\`\`

3. Set up the database:
   \`\`\`bash
   npx prisma migrate dev
   npx prisma db seed
   \`\`\`

4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000)

### Demo accounts

All passwords: `password123`

| Email | Role | Taste |
|-------|------|-------|
| stormbreaker128@gmail.com | Reader | Fantasy + Sci-Fi |
| sarah@folio.dev | Organiser | Fantasy + Dark Academia |
| marcus@folio.dev | Reader | Literary Fiction |
| luna@folio.dev | Reader | Dark Academia + Mystery |
| priya@folio.dev | Reader | Romance + Romantasy |
| alex@folio.dev | Organiser | Epic Fantasy |

## Architecture

### Taste Matching Engine

Located in `lib/matching/`. Pure TypeScript functions, no external ML.

- `user-to-user.ts` — Find readers with compatible taste
- `user-to-book.ts` — Match books to user taste profile
- `user-to-club.ts` — Match clubs using member similarity + genre alignment
- `club-to-book.ts` — Find books that fit a club's collective taste

Every match returns:
- Score (0-100)
- Confidence (low/medium/high)
- Human-readable match reasons
- Positive/negative signals
- Shared books, genres, authors, themes

### Routes

| Route | Description |
|-------|-------------|
| `/` | Public landing page |
| `/sign-in`, `/sign-up` | Authentication |
| `/onboarding` | 6-step taste profile setup |
| `/home` | Personalised dashboard |
| `/discover` | Book discovery with match scores |
| `/discover/clubs` | Club discovery with match scores |
| `/library` | Personal reading library |
| `/tracker` | Reading session logger + streak |
| `/challenges` | Reading challenges + leaderboards |
| `/clubs/[id]` | Club detail with voting |
| `/feed` | Taste-ranked social feed |
| `/profile/[id]` | User profile with taste dimensions |
| `/settings` | Profile + password settings |

## Phase 2 Roadmap

- [ ] Goodreads import
- [ ] Google Books API integration
- [ ] Direct messaging between matched readers
- [ ] Real bestseller API (NYT, etc.)
- [ ] AI-generated club discussion questions
- [ ] Push notifications
- [ ] Mobile app (React Native)
- [ ] Paid organiser tools
- [ ] Local event RSVP
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions and architecture overview"
```

---

### Task 8: Final verification pass

- [ ] **Step 1: Run a full smoke test of all pages**

```bash
# Dev server should be running
open http://localhost:3000
```

Visit each route and verify:
- [ ] `/` — Landing page loads with hero + features
- [ ] `/sign-up` → create new account → redirected to `/onboarding`
- [ ] `/onboarding` → 6 steps → redirected to `/home`
- [ ] `/home` — Dashboard with carousels, user matches, club matches
- [ ] `/discover` — Book rows with match badges
- [ ] `/discover/clubs` — Clubs sorted by match score with reasons
- [ ] `/library` — 10 books from seed data, status dropdowns work
- [ ] `/tracker` — Stats, session logger, currently reading progress
- [ ] `/challenges` — 2 challenges from seed, leaderboards visible
- [ ] `/clubs` — User's clubs listed
- [ ] `/clubs/[dragonclub-id]` — Full detail page with poll + voting
- [ ] `/feed` — Review feed from seeded users
- [ ] `/profile/[sarah-id]` — Taste dimensions, achievements, match reasons
- [ ] `/settings` — Profile form saves without error

- [ ] **Step 2: Verify matching produces sensible scores**

Sign in as `stormbreaker128@gmail.com` and visit `/profile/[sarah-id]`. Expected: 75+ match score (both like fantasy/dark fantasy, shared books like Six of Crows, Name of the Wind).

Visit `/profile/[priya-id]`. Expected: <50 match score (priya likes romance which connor dislikes).

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: complete Folio MVP — all 6 phases implemented and verified"
```

---

## Phase 6 Complete — MVP Complete 🎉

**What's working:**
- Reading challenges with leaderboards, join functionality, and point awards
- Social feed ranked by taste relevance (60% taste, 30% recency, 10% follow)
- Settings page — profile editing and password change
- Achievement badge component with tooltips
- Responsive layout (mobile-friendly, sidebar hidden on small screens)
- README with setup instructions, demo accounts, and architecture notes

**Full feature list:**
- Authentication (sign-up, sign-in, sign-out)
- 6-step taste profile onboarding
- Spotify-style app shell with sidebar
- Personal library (6 statuses, ratings, search)
- Reading tracker (sessions, streaks, goals, progress bars)
- Taste matching engine (4 algorithms, explanations, confidence)
- Personalised home dashboard
- Book discovery with genre rows
- Club discovery with match scores
- Club detail pages (public + member)
- Book voting with per-option match scores
- Reading challenges + leaderboards
- Taste-ranked social feed
- Profile pages with dimension visualisation
- Settings page

**Seed data:** 20 books, 8 users, 5 clubs, 2 challenges, 16 reviews, taste profiles, achievements, reading sessions — all making the app feel alive for demos.
