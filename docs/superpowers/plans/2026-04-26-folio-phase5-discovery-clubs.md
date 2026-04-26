# Folio Phase 5: Home Dashboard, Discovery & Clubs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the personalised home dashboard, book discovery page, club discovery page, club detail pages (public + member views), club organiser tools, and book voting system.

**Architecture:** Home/Discovery pages are server components that fetch taste-matched data. Club pages have public and member views. Voting is a client component talking to `/api/clubs/[id]/polls` API routes.

**Tech Stack:** Next.js 14 server components, Prisma, taste matching from Phase 4, shadcn dialogs, Tailwind.

**Prerequisite:** Phases 1–4 complete.

---

## File Map

| File | Purpose |
|------|---------|
| `app/(app)/home/page.tsx` | Personalised dashboard with carousels |
| `app/(app)/discover/page.tsx` | Book discovery with recommendation rows |
| `app/(app)/discover/clubs/page.tsx` | Club discovery with match scores |
| `app/(app)/clubs/page.tsx` | My clubs listing |
| `app/(app)/clubs/[id]/page.tsx` | Club detail (public + member) |
| `app/(app)/clubs/create/page.tsx` | Create/edit club |
| `app/api/clubs/route.ts` | Create club API |
| `app/api/clubs/[id]/route.ts` | GET/PATCH club |
| `app/api/clubs/[id]/join/route.ts` | POST join/apply |
| `app/api/clubs/[id]/polls/route.ts` | GET/POST club polls |
| `app/api/clubs/[id]/polls/[pollId]/vote/route.ts` | POST vote |
| `components/books/book-carousel.tsx` | Horizontal scrollable carousel |
| `components/books/recommendation-row.tsx` | Labelled carousel with match info |
| `components/books/book-discovery-card.tsx` | Large discovery card with match badge |
| `components/clubs/club-card.tsx` | Club discovery card with match |
| `components/clubs/club-poll.tsx` | Voting UI for a single poll |
| `components/clubs/club-poll-option.tsx` | Single vote option with match score |
| `components/clubs/join-button.tsx` | Smart join/apply button |
| `components/clubs/club-members-list.tsx` | Member list with roles |

---

### Task 1: Shared book carousel component

**Files:**
- Create: `components/books/book-carousel.tsx`
- Create: `components/books/recommendation-row.tsx`
- Create: `components/books/book-discovery-card.tsx`

- [ ] **Step 1: Create `components/books/book-carousel.tsx`**

```typescript
"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { children: React.ReactNode; className?: string };

export function BookCarousel({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  }

  return (
    <div className={`relative group ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/90 border border-border opacity-0 group-hover:opacity-100 transition-opacity -ml-4"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/90 border border-border opacity-0 group-hover:opacity-100 transition-opacity -mr-4"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/books/book-discovery-card.tsx`**

```typescript
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { MatchBadge } from "@/components/taste/match-badge";

type Props = {
  book: {
    id: string;
    title: string;
    author: string;
    cover: string | null;
    genres: string[];
    avgRating: number | null;
  };
  matchScore?: number;
  matchConfidence?: "low" | "medium" | "high";
  matchReason?: string;
  size?: "sm" | "md";
};

export function BookDiscoveryCard({ book, matchScore, matchConfidence, matchReason, size = "md" }: Props) {
  const width = size === "sm" ? "w-28" : "w-36";

  return (
    <div className={`${width} flex-shrink-0 group cursor-pointer`}>
      {/* Cover */}
      <div className={`${size === "sm" ? "h-44" : "h-52"} relative rounded-lg overflow-hidden bg-muted mb-2`}>
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
        {matchScore !== undefined && matchConfidence && (
          <div className="absolute top-2 left-2">
            <MatchBadge score={matchScore} confidence={matchConfidence} size="sm" />
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="font-medium text-sm text-white leading-tight line-clamp-2 group-hover:text-emerald-400 transition-colors">
          {book.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{book.author}</p>
        {matchReason && (
          <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{matchReason}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `components/books/recommendation-row.tsx`**

```typescript
import { BookCarousel } from "./book-carousel";
import { BookDiscoveryCard } from "./book-discovery-card";

type MatchedBook = {
  book: {
    id: string;
    title: string;
    author: string;
    cover: string | null;
    genres: string[];
    avgRating: number | null;
  };
  match: {
    score: number;
    confidence: "low" | "medium" | "high";
    matchReasons: string[];
  };
};

type Props = {
  title: string;
  subtitle?: string;
  books: MatchedBook[];
  showMatchScore?: boolean;
  exploratory?: boolean;
};

export function RecommendationRow({ title, subtitle, books, showMatchScore = true, exploratory = false }: Props) {
  if (books.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {exploratory && (
            <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
              Outside your usual taste
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <BookCarousel>
        {books.map(({ book, match }) => (
          <BookDiscoveryCard
            key={book.id}
            book={book}
            matchScore={showMatchScore ? match.score : undefined}
            matchConfidence={showMatchScore ? match.confidence : undefined}
            matchReason={match.matchReasons[0]}
          />
        ))}
      </BookCarousel>
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/books/
git commit -m "feat: book carousel, discovery card, and recommendation row components"
```

---

### Task 2: Home dashboard

**Files:**
- Modify: `app/(app)/home/page.tsx`

- [ ] **Step 1: Replace `app/(app)/home/page.tsx`**

```typescript
import { requireOnboarding } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { buildUserTasteSnapshot } from "@/lib/taste/profile";
import { calculateUserToBookMatch } from "@/lib/matching/user-to-book";
import { calculateUserToClubMatch } from "@/lib/matching/user-to-club";
import { calculateUserToUserMatch } from "@/lib/matching/user-to-user";
import { RecommendationRow } from "@/components/books/recommendation-row";
import { ClubCard } from "@/components/clubs/club-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MatchBadge } from "@/components/taste/match-badge";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default async function HomePage() {
  const session = await requireOnboarding();
  const userId = session.user.id;

  const userSnapshot = await buildUserTasteSnapshot(userId);

  // Fetch books not yet in user's library
  const userBookIds = new Set(userSnapshot.ratedBooks.map((b) => b.bookId));
  const [allBooks, otherUsers, clubs] = await Promise.all([
    db.book.findMany({ include: { tasteDimensions: true }, orderBy: { ratingsCount: "desc" } }),
    db.user.findMany({ where: { id: { not: userId }, onboarded: true }, take: 10 }),
    db.club.findMany({
      where: { visibility: "PUBLIC" },
      include: {
        members: true,
        currentBook: true,
        _count: { select: { members: true } },
      },
      take: 6,
    }),
  ]);

  // Match all books
  const bookMatches = allBooks
    .filter((b) => !userBookIds.has(b.id))
    .map((book) => ({
      book: { id: book.id, title: book.title, author: book.author, cover: book.cover, genres: book.genres, avgRating: book.avgRating },
      match: calculateUserToBookMatch(userSnapshot, {
        bookId: book.id, title: book.title, author: book.author,
        genres: book.genres, tags: book.tags, dimensions: book.tasteDimensions ?? {},
      }),
    }))
    .sort((a, b) => b.match.score - a.match.score);

  const recommended = bookMatches.slice(0, 12);
  const exploratory = bookMatches.slice(12, 20).sort(() => Math.random() - 0.5).slice(0, 8);

  // Find "Because you liked" — based on top-rated book
  const topRated = userSnapshot.ratedBooks.sort((a, b) => b.rating - a.rating)[0];
  const becauseYouLiked = topRated
    ? bookMatches
        .filter((m) => m.book.id !== topRated.bookId)
        .filter((m) => m.match.sharedGenres.length > 0 || m.match.sharedAuthors.length > 0)
        .slice(0, 10)
    : [];

  // User matches
  const userMatches = await Promise.all(
    otherUsers.map(async (u) => {
      const snapshot = await buildUserTasteSnapshot(u.id);
      return { user: u, match: calculateUserToUserMatch(userSnapshot, snapshot) };
    })
  );
  const topUserMatches = userMatches.sort((a, b) => b.match.score - a.match.score).slice(0, 5);

  // Club matches
  const clubMatches = await Promise.all(
    clubs.map(async (club) => {
      const memberSnapshots = await Promise.all(
        club.members.slice(0, 8).map((m) => buildUserTasteSnapshot(m.userId))
      );
      const match = calculateUserToClubMatch(userSnapshot, {
        clubId: club.id,
        genres: club.genres,
        themes: club.themes,
        dimensions: {},
        memberSnapshots,
      });
      return { club, match };
    })
  );
  const topClubMatches = clubMatches.sort((a, b) => b.match.score - a.match.score).slice(0, 4);

  // Currently reading
  const currentlyReading = await db.userBook.findMany({
    where: { userId, status: "CURRENTLY_READING" },
    include: { book: true },
    take: 1,
  });

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Good reading, {session.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's what we've found for you today.</p>
      </div>

      {/* Continue reading */}
      {currentlyReading.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Continue Reading</h2>
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card max-w-lg hover:border-emerald-500/30 transition-colors">
            {currentlyReading[0]!.book.cover ? (
              <img src={currentlyReading[0]!.book.cover} alt="" className="h-20 w-14 object-cover rounded" />
            ) : (
              <div className="h-20 w-14 bg-muted rounded flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">{currentlyReading[0]!.book.title}</p>
              <p className="text-sm text-muted-foreground">{currentlyReading[0]!.book.author}</p>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${currentlyReading[0]!.book.pageCount
                      ? Math.round((currentlyReading[0]!.progress / currentlyReading[0]!.book.pageCount) * 100)
                      : 0}%`,
                  }}
                />
              </div>
              <Link href="/tracker" className="text-xs text-emerald-400 hover:underline mt-1 inline-block">
                Log session →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Recommended for you */}
      <RecommendationRow
        title="Recommended For You"
        subtitle="Based on your taste profile"
        books={recommended}
      />

      {/* Because you liked */}
      {topRated && becauseYouLiked.length > 0 && (
        <RecommendationRow
          title={`Because You Loved ${topRated.title}`}
          books={becauseYouLiked}
        />
      )}

      {/* Top user matches */}
      {topUserMatches.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Readers You Read Like</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {topUserMatches.map(({ user, match }) => (
              <Link
                key={user.id}
                href={`/profile/${user.id}`}
                className="flex-shrink-0 w-44 p-4 rounded-xl border border-border bg-card hover:border-emerald-500/30 transition-all group"
              >
                <Avatar className="h-12 w-12 mb-3">
                  <AvatarImage src={user.avatar ?? undefined} />
                  <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                    {user.name?.[0] ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium text-sm text-white truncate group-hover:text-emerald-400 transition-colors">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate mb-2">@{user.username}</p>
                <MatchBadge score={match.score} confidence={match.confidence} size="sm" />
                {match.matchReasons[0] && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{match.matchReasons[0]}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Club matches */}
      {topClubMatches.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Clubs Matching Your Taste</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topClubMatches.map(({ club, match }) => (
              <ClubCard key={club.id} club={club} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Try something new */}
      <RecommendationRow
        title="Try Something New"
        subtitle="A little outside your usual taste — you might be surprised"
        books={exploratory}
        showMatchScore={false}
        exploratory
      />
    </div>
  );
}
```

- [ ] **Step 2: Create `components/clubs/club-card.tsx`** (needed by homepage)

```typescript
import Link from "next/link";
import { MatchBadge } from "@/components/taste/match-badge";
import { Badge } from "@/components/ui/badge";
import { Users, Globe, MapPin, BookOpen } from "lucide-react";
import type { MatchOutput } from "@/lib/matching/types";

type Props = {
  club: {
    id: string;
    name: string;
    description: string | null;
    avatar: string | null;
    genres: string[];
    isOnline: boolean;
    location: string | null;
    membershipType: string;
    memberCount?: number;
    currentBook?: { title: string; cover: string | null } | null;
    _count?: { members: number };
  };
  match: MatchOutput;
};

export function ClubCard({ club, match }: Props) {
  const memberCount = club.memberCount ?? club._count?.members ?? 0;

  return (
    <Link href={`/clubs/${club.id}`}>
      <div className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-emerald-500/30 transition-all group">
        {/* Avatar */}
        <div className="h-14 w-14 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-2xl">
          📚
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                {club.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {club.isOnline ? (
                  <Globe className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground">
                  {club.isOnline ? "Online" : club.location}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{memberCount}</span>
              </div>
            </div>
            <MatchBadge score={match.score} confidence={match.confidence} size="sm" />
          </div>

          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{club.description}</p>

          <div className="flex flex-wrap gap-1 mt-2">
            {club.genres.slice(0, 3).map((g) => (
              <Badge key={g} variant="secondary" className="text-xs bg-muted/50">{g}</Badge>
            ))}
          </div>

          {match.matchReasons[0] && (
            <p className="text-xs text-emerald-400/80 mt-2">→ {match.matchReasons[0]}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Verify home page renders**

```bash
open http://localhost:3000/home
```

Expected: Greeting, "Continue Reading" card, 3+ recommendation rows, user match cards, club match cards.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/home/page.tsx components/clubs/club-card.tsx
git commit -m "feat: personalised home dashboard with carousels and match cards"
```

---

### Task 3: Book discovery page

**Files:**
- Create: `app/(app)/discover/page.tsx`

- [ ] **Step 1: Create `app/(app)/discover/page.tsx`**

```typescript
import { requireOnboarding } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { buildUserTasteSnapshot } from "@/lib/taste/profile";
import { calculateUserToBookMatch } from "@/lib/matching/user-to-book";
import { RecommendationRow } from "@/components/books/recommendation-row";

export default async function DiscoverPage() {
  const session = await requireOnboarding();
  const userSnapshot = await buildUserTasteSnapshot(session.user.id);

  const userBookIds = new Set(userSnapshot.ratedBooks.map((b) => b.bookId));

  const allBooks = await db.book.findMany({
    include: { tasteDimensions: true },
    orderBy: { ratingsCount: "desc" },
  });

  const unreadBooks = allBooks.filter((b) => !userBookIds.has(b.id));

  const matchedBooks = unreadBooks.map((book) => ({
    book: { id: book.id, title: book.title, author: book.author, cover: book.cover, genres: book.genres, avgRating: book.avgRating },
    match: calculateUserToBookMatch(userSnapshot, {
      bookId: book.id, title: book.title, author: book.author,
      genres: book.genres, tags: book.tags, dimensions: book.tasteDimensions ?? {},
    }),
  })).sort((a, b) => b.match.score - a.match.score);

  // Genre rows
  const genreGroups = new Map<string, typeof matchedBooks>();
  for (const entry of allBooks) {
    for (const genre of entry.genres) {
      if (!genreGroups.has(genre)) genreGroups.set(genre, []);
      genreGroups.get(genre)!.push({
        book: { id: entry.id, title: entry.title, author: entry.author, cover: entry.cover, genres: entry.genres, avgRating: entry.avgRating },
        match: calculateUserToBookMatch(userSnapshot, {
          bookId: entry.id, title: entry.title, author: entry.author,
          genres: entry.genres, tags: entry.tags, dimensions: entry.tasteDimensions ?? {},
        }),
      });
    }
  }

  const featured = ["Fantasy", "Literary Fiction", "Science Fiction", "Romance", "Mystery"];

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Discover Books</h1>
        <p className="text-muted-foreground">Personalised for your taste. Updated as you read.</p>
      </div>

      <RecommendationRow title="Recommended For You" books={matchedBooks.slice(0, 15)} />

      {matchedBooks[0] && (
        <RecommendationRow
          title={`More Like ${matchedBooks[0].book.author}`}
          books={matchedBooks.filter((m) => m.book.author === matchedBooks[0]!.book.author)}
        />
      )}

      {featured.map((genre) => {
        const books = genreGroups.get(genre) ?? [];
        if (books.length === 0) return null;
        return (
          <RecommendationRow
            key={genre}
            title={`Best of ${genre}`}
            books={books.sort((a, b) => b.match.score - a.match.score).slice(0, 10)}
          />
        );
      })}

      <RecommendationRow
        title="Trending Now"
        books={allBooks
          .sort((a, b) => (b.ratingsCount ?? 0) - (a.ratingsCount ?? 0))
          .slice(0, 10)
          .map((book) => ({
            book: { id: book.id, title: book.title, author: book.author, cover: book.cover, genres: book.genres, avgRating: book.avgRating },
            match: calculateUserToBookMatch(userSnapshot, { bookId: book.id, title: book.title, author: book.author, genres: book.genres, tags: book.tags, dimensions: book.tasteDimensions ?? {} }),
          }))}
        showMatchScore={false}
      />

      <RecommendationRow
        title="Try Something New"
        exploratory
        books={matchedBooks.slice(-8).sort(() => Math.random() - 0.5)}
        showMatchScore={false}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/discover/page.tsx
git commit -m "feat: book discovery page with genre rows and personalised recommendations"
```

---

### Task 4: Club discovery page

**Files:**
- Create: `app/(app)/discover/clubs/page.tsx`

- [ ] **Step 1: Create `app/(app)/discover/clubs/page.tsx`**

```typescript
import { requireOnboarding } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { buildUserTasteSnapshot } from "@/lib/taste/profile";
import { calculateUserToClubMatch } from "@/lib/matching/user-to-club";
import { ClubCard } from "@/components/clubs/club-card";

export default async function ClubDiscoverPage() {
  const session = await requireOnboarding();
  const userSnapshot = await buildUserTasteSnapshot(session.user.id);

  const clubs = await db.club.findMany({
    where: { visibility: "PUBLIC" },
    include: {
      members: true,
      currentBook: true,
      _count: { select: { members: true } },
    },
  });

  const clubMatches = await Promise.all(
    clubs.map(async (club) => {
      const memberSnapshots = await Promise.all(
        club.members.slice(0, 10).map((m) => buildUserTasteSnapshot(m.userId))
      );
      const match = calculateUserToClubMatch(userSnapshot, {
        clubId: club.id,
        genres: club.genres,
        themes: club.themes,
        dimensions: {},
        memberSnapshots,
      });
      return { club, match };
    })
  );

  const sorted = clubMatches.sort((a, b) => b.match.score - a.match.score);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Discover Clubs</h1>
        <p className="text-muted-foreground">Find clubs that match your taste — not just your genre.</p>
      </div>

      {/* Top matches */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Your Best Club Matches</h2>
        <div className="space-y-3">
          {sorted.slice(0, 5).map(({ club, match }) => (
            <ClubCard key={club.id} club={club} match={match} />
          ))}
        </div>
      </section>

      {/* All clubs */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">All Clubs</h2>
        <div className="space-y-3">
          {sorted.slice(5).map(({ club, match }) => (
            <ClubCard key={club.id} club={club} match={match} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/discover/clubs/page.tsx
git commit -m "feat: club discovery page with taste match scores"
```

---

### Task 5: Club APIs

**Files:**
- Create: `app/api/clubs/route.ts`
- Create: `app/api/clubs/[id]/join/route.ts`
- Create: `app/api/clubs/[id]/polls/route.ts`
- Create: `app/api/clubs/[id]/polls/[pollId]/vote/route.ts`

- [ ] **Step 1: Create `app/api/clubs/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    name: string; description?: string; genres: string[]; themes: string[];
    isOnline: boolean; location?: string; meetingCadence: string; membershipType: "OPEN" | "APPLICATION" | "PRIVATE";
  };

  const club = await db.club.create({
    data: {
      ...body,
      ownerId: session.user.id,
      members: { create: { userId: session.user.id, role: "OWNER" } },
    },
  });

  return NextResponse.json(club, { status: 201 });
}
```

- [ ] **Step 2: Create `app/api/clubs/[id]/join/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const club = await db.club.findUnique({ where: { id: params.id } });
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const existing = await db.clubMember.findUnique({
    where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
  });
  if (existing) return NextResponse.json({ error: "Already a member" }, { status: 409 });

  if (club.membershipType === "OPEN") {
    const member = await db.clubMember.create({
      data: { clubId: params.id, userId: session.user.id, role: "MEMBER" },
    });
    return NextResponse.json({ type: "joined", member });
  }

  if (club.membershipType === "APPLICATION") {
    const { message } = await req.json() as { message?: string };
    const application = await db.clubApplication.upsert({
      where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
      update: { message, status: "PENDING" },
      create: { clubId: params.id, userId: session.user.id, message },
    });
    return NextResponse.json({ type: "applied", application });
  }

  return NextResponse.json({ error: "This club is private" }, { status: 403 });
}
```

- [ ] **Step 3: Create `app/api/clubs/[id]/polls/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const polls = await db.clubPoll.findMany({
    where: { clubId: params.id },
    include: {
      options: { include: { book: true, votes: true } },
      votes: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(polls);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await db.clubMember.findUnique({
    where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
  });
  if (!member || !["OWNER", "ORGANISER"].includes(member.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { title, description, endsAt, voteMode, options } = await req.json() as {
    title: string; description?: string; endsAt?: string; voteMode: "SINGLE" | "MULTI";
    options: Array<{ bookId?: string; label: string; matchScore?: number; matchReasons?: string[] }>;
  };

  const poll = await db.clubPoll.create({
    data: {
      clubId: params.id,
      title,
      description,
      endsAt: endsAt ? new Date(endsAt) : undefined,
      voteMode,
      options: { create: options },
    },
    include: { options: { include: { book: true } } },
  });

  return NextResponse.json(poll, { status: 201 });
}
```

- [ ] **Step 4: Create `app/api/clubs/[id]/polls/[pollId]/vote/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; pollId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await db.clubMember.findUnique({
    where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const poll = await db.clubPoll.findUnique({
    where: { id: params.pollId },
    include: { votes: { where: { memberId: member.id } } },
  });
  if (!poll || poll.status !== "ACTIVE") return NextResponse.json({ error: "Poll not active" }, { status: 400 });

  const { optionId } = await req.json() as { optionId: string };

  if (poll.voteMode === "SINGLE" && poll.votes.length > 0) {
    // Replace existing vote
    await db.clubVote.deleteMany({ where: { pollId: params.pollId, memberId: member.id } });
  }

  const vote = await db.clubVote.upsert({
    where: { pollId_memberId_optionId: { pollId: params.pollId, memberId: member.id, optionId } },
    update: {},
    create: { pollId: params.pollId, optionId, memberId: member.id },
  });

  // Award points for voting
  await db.userScore.upsert({
    where: { userId: session.user.id },
    update: { totalPoints: { increment: 5 } },
    create: { userId: session.user.id, totalPoints: 5 },
  });

  return NextResponse.json(vote, { status: 201 });
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/clubs/
git commit -m "feat: club API routes — create, join/apply, polls, and voting"
```

---

### Task 6: Club detail page

**Files:**
- Create: `components/clubs/join-button.tsx`
- Create: `components/clubs/club-poll.tsx`
- Create: `app/(app)/clubs/[id]/page.tsx`
- Create: `app/(app)/clubs/page.tsx`

- [ ] **Step 1: Create `components/clubs/join-button.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  clubId: string;
  membershipType: string;
  isMember: boolean;
  isPending: boolean;
};

export function JoinButton({ clubId, membershipType, isMember, isPending }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [joined, setJoined] = useState(isMember);
  const [applied, setApplied] = useState(isPending);

  async function handleClick() {
    setState("loading");
    const res = await fetch(`/api/clubs/${clubId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json() as { type: string };
    if (data.type === "joined") setJoined(true);
    if (data.type === "applied") setApplied(true);
    setState("done");
  }

  if (joined) return <Button disabled variant="secondary">Member ✓</Button>;
  if (applied) return <Button disabled variant="secondary">Application pending</Button>;

  return (
    <Button
      onClick={handleClick}
      disabled={state === "loading"}
      className="bg-emerald-500 hover:bg-emerald-600 text-white"
    >
      {state === "loading"
        ? "..."
        : membershipType === "OPEN"
        ? "Join club"
        : "Apply to join"}
    </Button>
  );
}
```

- [ ] **Step 2: Create `components/clubs/club-poll.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MatchBadge } from "@/components/taste/match-badge";
import { Clock } from "lucide-react";

type PollOption = {
  id: string;
  label: string;
  matchScore: number | null;
  matchReasons: string[];
  book: { title: string; cover: string | null; author: string } | null;
  votes: Array<{ id: string }>;
};

type Poll = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  voteMode: string;
  endsAt: string | null;
  options: PollOption[];
  votes: Array<{ memberId: string; optionId: string }>;
};

type Props = {
  poll: Poll;
  clubId: string;
  memberId: string | null;
};

export function ClubPoll({ poll, clubId, memberId }: Props) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);
  const myVotes = new Set(poll.votes.filter((v) => v.memberId === memberId).map((v) => v.optionId));
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(myVotes);
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(myVotes.size > 0);

  async function handleVote(optionId: string) {
    if (voted && poll.voteMode === "SINGLE") return;
    if (!memberId) return;
    setLoading(true);

    await fetch(`/api/clubs/${clubId}/polls/${poll.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });

    setSelectedOptions(new Set([optionId]));
    setVoted(true);
    setLoading(false);
  }

  const daysLeft = poll.endsAt
    ? Math.max(0, Math.ceil((new Date(poll.endsAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-white">{poll.title}</h3>
            {poll.description && <p className="text-sm text-muted-foreground mt-0.5">{poll.description}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {daysLeft !== null && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {daysLeft}d left
              </div>
            )}
            <Badge variant={poll.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
              {poll.status}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
      </div>

      <div className="p-4 space-y-3">
        {poll.options.map((option) => {
          const voteCount = option.votes.length;
          const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = selectedOptions.has(option.id);

          return (
            <div
              key={option.id}
              className={`rounded-lg border p-3 transition-all ${
                isSelected ? "border-emerald-500 bg-emerald-500/5" : "border-border hover:border-border/80"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-white">{option.label}</p>
                    {option.matchScore && (
                      <MatchBadge score={option.matchScore} confidence="medium" size="sm" />
                    )}
                  </div>
                  {option.book && (
                    <p className="text-xs text-muted-foreground">{option.book.author}</p>
                  )}
                  {option.matchReasons.slice(0, 2).map((r, i) => (
                    <p key={i} className="text-xs text-muted-foreground mt-0.5">→ {r}</p>
                  ))}
                </div>
                {!voted && poll.status === "ACTIVE" && memberId && (
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleVote(option.id)}
                    disabled={loading}
                    className={isSelected ? "bg-emerald-500 text-white" : "border-border"}
                  >
                    Vote
                  </Button>
                )}
                {(voted || poll.status !== "ACTIVE") && (
                  <span className="text-sm font-medium text-muted-foreground">{pct}%</span>
                )}
              </div>

              {(voted || poll.status !== "ACTIVE") && (
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isSelected ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `app/(app)/clubs/[id]/page.tsx`**

```typescript
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { buildUserTasteSnapshot } from "@/lib/taste/profile";
import { calculateUserToClubMatch } from "@/lib/matching/user-to-club";
import { JoinButton } from "@/components/clubs/join-button";
import { ClubPoll } from "@/components/clubs/club-poll";
import { MatchBadge } from "@/components/taste/match-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Globe, MapPin, Users, Calendar } from "lucide-react";

export default async function ClubDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();

  const club = await db.club.findUnique({
    where: { id: params.id },
    include: {
      currentBook: true,
      upcomingBook: true,
      members: { include: { user: true } },
      polls: {
        include: {
          options: { include: { book: true, votes: true } },
          votes: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      posts: { orderBy: { createdAt: "desc" }, take: 5 },
      readingHistory: { include: { book: true }, orderBy: { finishedAt: "desc" }, take: 5 },
      _count: { select: { members: true } },
    },
  });

  if (!club) notFound();

  const isMember = session ? club.members.some((m) => m.userId === session.user.id) : false;
  const currentMember = isMember ? club.members.find((m) => m.userId === session.user.id) : null;
  const isPending = session
    ? !!(await db.clubApplication.findUnique({
        where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
      }))
    : false;

  let matchResult = null;
  if (session) {
    const userSnapshot = await buildUserTasteSnapshot(session.user.id);
    const memberSnapshots = await Promise.all(
      club.members.slice(0, 10).map((m) => buildUserTasteSnapshot(m.userId))
    );
    matchResult = calculateUserToClubMatch(userSnapshot, {
      clubId: club.id,
      genres: club.genres,
      themes: club.themes,
      dimensions: {},
      memberSnapshots,
    });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-6 mb-8">
        <div className="h-20 w-20 rounded-xl bg-emerald-500/20 flex items-center justify-center text-4xl flex-shrink-0">
          📚
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-white">{club.name}</h1>
            {matchResult && <MatchBadge score={matchResult.score} confidence={matchResult.confidence} size="lg" />}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
            {club.isOnline ? <Globe className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
            <span>{club.isOnline ? "Online" : club.location}</span>
            <span>·</span>
            <Users className="h-4 w-4" />
            <span>{club._count.members} members</span>
            {club.meetingCadence && (
              <>
                <span>·</span>
                <Calendar className="h-4 w-4" />
                <span className="capitalize">{club.meetingCadence}</span>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {club.genres.map((g) => <Badge key={g} variant="secondary">{g}</Badge>)}
          </div>
        </div>
        {session && !isMember && (
          <JoinButton
            clubId={club.id}
            membershipType={club.membershipType}
            isMember={isMember}
            isPending={isPending}
          />
        )}
      </div>

      {/* Match reasons */}
      {matchResult && matchResult.matchReasons.length > 0 && (
        <div className="mb-8 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <h2 className="font-semibold text-emerald-400 mb-2">Why this club matches your taste</h2>
          <ul className="space-y-1">
            {matchResult.matchReasons.map((reason, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">→</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="md:col-span-2 space-y-8">
          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">About</h2>
            <p className="text-muted-foreground">{club.description}</p>
          </div>

          {/* Current book */}
          {club.currentBook && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Currently Reading</h2>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                {club.currentBook.cover ? (
                  <img src={club.currentBook.cover} alt="" className="h-16 w-11 object-cover rounded" />
                ) : (
                  <div className="h-16 w-11 bg-muted rounded flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">{club.currentBook.title}</p>
                  <p className="text-sm text-muted-foreground">{club.currentBook.author}</p>
                </div>
              </div>
            </div>
          )}

          {/* Active polls */}
          {club.polls.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Book Votes</h2>
              <div className="space-y-4">
                {club.polls.map((poll) => (
                  <ClubPoll
                    key={poll.id}
                    poll={{
                      ...poll,
                      endsAt: poll.endsAt?.toISOString() ?? null,
                    }}
                    clubId={club.id}
                    memberId={currentMember?.id ?? null}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reading history */}
          {club.readingHistory.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Reading History</h2>
              <div className="space-y-2">
                {club.readingHistory.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 text-sm p-2 rounded-lg border border-border/50">
                    <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-white">{h.book.title}</span>
                    {h.avgRating && (
                      <span className="text-yellow-400 ml-auto">★ {h.avgRating.toFixed(1)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming */}
          {club.upcomingBook && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Coming up next</h3>
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card">
                {club.upcomingBook.cover && (
                  <img src={club.upcomingBook.cover} alt="" className="h-12 w-8 object-cover rounded" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{club.upcomingBook.title}</p>
                  <p className="text-xs text-muted-foreground">{club.upcomingBook.author}</p>
                </div>
              </div>
            </div>
          )}

          {/* Members */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Members ({club._count.members})
            </h3>
            <div className="space-y-2">
              {club.members.slice(0, 8).map((member) => (
                <div key={member.id} className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={member.user.avatar ?? undefined} />
                    <AvatarFallback className="text-xs bg-emerald-500/20 text-emerald-400">
                      {member.user.name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-white truncate">{member.user.name}</span>
                  {member.role !== "MEMBER" && (
                    <Badge variant="outline" className="text-xs ml-auto border-emerald-500/30 text-emerald-400">
                      {member.role.toLowerCase()}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `app/(app)/clubs/page.tsx`**

```typescript
import { requireOnboarding } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { ClubCard } from "@/components/clubs/club-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ClubsPage() {
  const session = await requireOnboarding();

  const myClubs = await db.clubMember.findMany({
    where: { userId: session.user.id },
    include: {
      club: {
        include: {
          currentBook: true,
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">My Clubs</h1>
          <p className="text-muted-foreground">Your active book clubs.</p>
        </div>
        <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Link href="/clubs/create">
            <Plus className="h-4 w-4 mr-2" />
            Create club
          </Link>
        </Button>
      </div>

      {myClubs.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-muted-foreground mb-4">You haven't joined any clubs yet.</p>
          <Button asChild variant="outline">
            <Link href="/discover/clubs">Discover clubs →</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {myClubs.map(({ club }) => (
            <ClubCard
              key={club.id}
              club={club}
              match={{ score: 0, confidence: "low", matchReasons: [], positiveSignals: [], negativeSignals: [], sharedBooks: [], sharedGenres: [], sharedAuthors: [], sharedThemes: [], sharedTasteDimensions: [] }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create `app/(app)/clubs/create/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const GENRES = ["Fantasy", "Science Fiction", "Literary Fiction", "Mystery", "Romance", "Historical Fiction", "Thriller", "Dark Academia", "Cozy Fantasy", "Horror"];

export default function CreateClubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState("");
  const [meetingCadence, setMeetingCadence] = useState("monthly");
  const [membershipType, setMembershipType] = useState<"OPEN" | "APPLICATION" | "PRIVATE">("OPEN");

  function toggleGenre(g: string) {
    setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, genres, themes: genres, isOnline, location: isOnline ? undefined : location, meetingCadence, membershipType }),
    });
    const club = await res.json() as { id: string };
    router.push(`/clubs/${club.id}`);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Create a Club</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>Club name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. The Fantasy Collective" className="bg-card" />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="What kind of books do you read? Who is the club for?" className="bg-card resize-none" />
        </div>

        <div className="space-y-2">
          <Label>Genres</Label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button key={g} type="button" onClick={() => toggleGenre(g)}
                className={cn("px-3 py-1.5 rounded-full border text-sm transition-all", genres.includes(g) ? "bg-emerald-500 border-emerald-500 text-white" : "border-border text-muted-foreground hover:border-emerald-500/50")}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Format</Label>
            <div className="flex gap-2">
              {["Online", "Local"].map((opt) => (
                <button key={opt} type="button" onClick={() => setIsOnline(opt === "Online")}
                  className={cn("flex-1 py-2 rounded-lg border text-sm font-medium transition-all", (opt === "Online") === isOnline ? "bg-emerald-500 border-emerald-500 text-white" : "border-border text-muted-foreground")}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Membership</Label>
            <div className="flex gap-1">
              {(["OPEN", "APPLICATION", "PRIVATE"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setMembershipType(t)}
                  className={cn("flex-1 py-2 rounded-lg border text-xs font-medium transition-all capitalize", membershipType === t ? "bg-emerald-500 border-emerald-500 text-white" : "border-border text-muted-foreground")}>
                  {t.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!isOnline && (
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="bg-card" />
          </div>
        )}

        <Button type="submit" disabled={loading || !name || genres.length === 0} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12">
          {loading ? "Creating..." : "Create club →"}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Verify club pages**

```bash
# Find a club ID from seed data
open http://localhost:3000/clubs
```

Expected: My clubs page with The Dragon's Bookshelf, Dark Academia Society, etc. Click one — see full detail page with polls, match score, voting.

- [ ] **Step 7: Commit**

```bash
git add app/\(app\)/clubs/ components/clubs/ app/api/clubs/
git commit -m "feat: club detail, discovery, polls, voting, create club — complete clubs feature"
```

---

## Phase 5 Complete

**What's working:**
- Personalised home dashboard with 5+ recommendation rows, user match cards, club match cards
- Book discovery page with genre rows and match scores
- Club discovery page sorted by taste match
- Club detail page (public preview + member view) with taste match badge + reasons
- Book voting UI with match scores per option
- Join/apply button
- Create club page
- API routes: create club, join/apply, create poll, vote

**Next:** Phase 6 — Challenges, social feed, achievements, and responsive polish.
