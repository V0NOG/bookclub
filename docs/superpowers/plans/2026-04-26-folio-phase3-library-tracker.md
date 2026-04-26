# Folio Phase 3: Personal Library & Reading Tracker

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the personal library (browse, add, status-change, rate, review) and reading tracker (log sessions, progress bars, streaks, goals).

**Architecture:** Library page fetches UserBook records server-side. Add/status/rate mutations go through API routes. Tracker page shows reading sessions, progress, and streaks all from the database.

**Tech Stack:** Next.js 14 App Router, Prisma, server components for data fetching, API routes for mutations, shadcn/ui dialogs and cards.

**Prerequisite:** Phase 1 + 2 complete.

---

## File Map

| File | Purpose |
|------|---------|
| `app/(app)/library/page.tsx` | Library page (server component) |
| `app/(app)/library/loading.tsx` | Library skeleton |
| `app/(app)/tracker/page.tsx` | Tracker page (server component) |
| `app/api/library/route.ts` | GET/POST user library entries |
| `app/api/library/[bookId]/route.ts` | PATCH/DELETE a specific user book |
| `app/api/reading-sessions/route.ts` | POST new reading session |
| `app/api/books/search/route.ts` | GET book search from seeded data |
| `components/library/library-grid.tsx` | Responsive book grid |
| `components/library/book-card.tsx` | Individual book card with status |
| `components/library/add-book-dialog.tsx` | Search + add book modal |
| `components/library/status-selector.tsx` | Reading status dropdown |
| `components/library/star-rating.tsx` | 1–5 star rating input |
| `components/library/review-dialog.tsx` | Write/edit review modal |
| `components/tracker/session-logger.tsx` | Log a reading session |
| `components/tracker/progress-ring.tsx` | Circular progress component |
| `components/tracker/reading-stats.tsx` | Stats summary cards |
| `components/tracker/streak-display.tsx` | Streak and goal tracking |

---

### Task 1: Library API routes

**Files:**
- Create: `app/api/library/route.ts`
- Create: `app/api/library/[bookId]/route.ts`
- Create: `app/api/books/search/route.ts`

- [ ] **Step 1: Create `app/api/library/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { ReadingStatus } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const books = await db.userBook.findMany({
    where: { userId: session.user.id },
    include: { book: { include: { tasteDimensions: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(books);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId, status } = await req.json() as { bookId: string; status: ReadingStatus };

  const entry = await db.userBook.upsert({
    where: { userId_bookId: { userId: session.user.id, bookId } },
    update: { status, updatedAt: new Date() },
    create: {
      userId: session.user.id,
      bookId,
      status,
      startedAt: status === "CURRENTLY_READING" ? new Date() : undefined,
    },
    include: { book: true },
  });

  return NextResponse.json(entry, { status: 201 });
}
```

- [ ] **Step 2: Create `app/api/library/[bookId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { ReadingStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    status?: ReadingStatus;
    rating?: number;
    progress?: number;
    notes?: string;
  };

  const finishedAt =
    body.status === "READ" ? new Date() : undefined;

  const entry = await db.userBook.update({
    where: { userId_bookId: { userId: session.user.id, bookId: params.bookId } },
    data: {
      ...body,
      finishedAt,
      updatedAt: new Date(),
    },
    include: { book: true },
  });

  // If book is finished, award points
  if (body.status === "READ") {
    await db.userScore.upsert({
      where: { userId: session.user.id },
      update: { totalPoints: { increment: 100 } },
      create: { userId: session.user.id, totalPoints: 100 },
    });

    // Award "first book" achievement if not already earned
    const achievement = await db.achievement.findUnique({ where: { key: "first_book" } });
    if (achievement) {
      await db.userAchievement.upsert({
        where: { userId_achievementId: { userId: session.user.id, achievementId: achievement.id } },
        update: {},
        create: { userId: session.user.id, achievementId: achievement.id },
      });
    }
  }

  return NextResponse.json(entry);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.userBook.delete({
    where: { userId_bookId: { userId: session.user.id, bookId: params.bookId } },
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create `app/api/books/search/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";

  if (!q || q.length < 2) {
    const popular = await db.book.findMany({
      orderBy: { ratingsCount: "desc" },
      take: 12,
    });
    return NextResponse.json(popular);
  }

  const books = await db.book.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { author: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 10,
  });

  return NextResponse.json(books);
}
```

- [ ] **Step 4: Create `app/api/reading-sessions/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId, pagesRead, minutesRead, chaptersRead, notes, date } = await req.json() as {
    bookId: string;
    pagesRead?: number;
    minutesRead?: number;
    chaptersRead?: number;
    notes?: string;
    date?: string;
  };

  const [session_record] = await Promise.all([
    db.readingSession.create({
      data: {
        userId: session.user.id,
        bookId,
        pagesRead,
        minutesRead,
        chaptersRead,
        notes,
        date: date ? new Date(date) : new Date(),
      },
    }),
    // Update book progress
    pagesRead
      ? db.userBook.updateMany({
          where: { userId: session.user.id, bookId, status: "CURRENTLY_READING" },
          data: { progress: { increment: pagesRead } },
        })
      : Promise.resolve(),
    // Award reading points
    db.userScore.upsert({
      where: { userId: session.user.id },
      update: {
        totalPoints: { increment: 10 },
        lastReadAt: new Date(),
      },
      create: { userId: session.user.id, totalPoints: 10, lastReadAt: new Date() },
    }),
  ]);

  return NextResponse.json(session_record, { status: 201 });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await db.readingSession.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: 30,
  });

  return NextResponse.json(sessions);
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/
git commit -m "feat: library and reading session API routes"
```

---

### Task 2: Library UI components

**Files:**
- Create: `components/library/star-rating.tsx`
- Create: `components/library/status-selector.tsx`
- Create: `components/library/book-card.tsx`

- [ ] **Step 1: Create `components/library/star-rating.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md";
};

export function StarRating({ value, onChange, size = "md" }: Props) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              "transition-colors",
              size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5",
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `components/library/status-selector.tsx`**

```typescript
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReadingStatus } from "@prisma/client";

const STATUS_LABELS: Record<ReadingStatus, string> = {
  WANT_TO_READ: "Want to Read",
  CURRENTLY_READING: "Currently Reading",
  READ: "Read",
  ABANDONED: "Abandoned",
};

const STATUS_COLORS: Record<ReadingStatus, string> = {
  WANT_TO_READ: "text-muted-foreground",
  CURRENTLY_READING: "text-emerald-400",
  READ: "text-blue-400",
  ABANDONED: "text-red-400",
};

type Props = {
  value: ReadingStatus;
  onValueChange: (value: ReadingStatus) => void;
};

export function StatusSelector({ value, onValueChange }: Props) {
  return (
    <Select value={value} onValueChange={onValueChange as (v: string) => void}>
      <SelectTrigger className="h-8 text-xs bg-background border-border">
        <SelectValue>
          <span className={STATUS_COLORS[value]}>{STATUS_LABELS[value]}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(STATUS_LABELS) as ReadingStatus[]).map((status) => (
          <SelectItem key={status} value={status}>
            <span className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 3: Create `components/library/book-card.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Book, UserBook } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./star-rating";
import { StatusSelector } from "./status-selector";
import { BookOpen } from "lucide-react";
import { ReadingStatus } from "@prisma/client";

type UserBookWithBook = UserBook & { book: Book };

type Props = {
  entry: UserBookWithBook;
  onUpdate: (bookId: string, updates: { status?: ReadingStatus; rating?: number }) => void;
};

export function BookCard({ entry, onUpdate }: Props) {
  const [status, setStatus] = useState(entry.status);
  const [rating, setRating] = useState(entry.rating ?? 0);

  function handleStatusChange(newStatus: ReadingStatus) {
    setStatus(newStatus);
    onUpdate(entry.bookId, { status: newStatus });
  }

  function handleRatingChange(newRating: number) {
    setRating(newRating);
    onUpdate(entry.bookId, { rating: newRating });
  }

  const percent = entry.book.pageCount && status === "CURRENTLY_READING"
    ? Math.round((entry.progress / entry.book.pageCount) * 100)
    : null;

  return (
    <Card className="group border-border bg-card hover:border-emerald-500/30 transition-all duration-200">
      <CardContent className="p-0">
        {/* Cover */}
        <div className="relative aspect-[2/3] bg-muted rounded-t-lg overflow-hidden">
          {entry.book.cover ? (
            <img
              src={entry.book.cover}
              alt={entry.book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/50" />
            </div>
          )}
          {percent !== null && (
            <div className="absolute bottom-0 inset-x-0 h-1 bg-muted/80">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <div>
            <p className="font-medium text-sm text-white leading-tight line-clamp-1">{entry.book.title}</p>
            <p className="text-xs text-muted-foreground truncate">{entry.book.author}</p>
          </div>

          <StatusSelector value={status} onValueChange={handleStatusChange} />

          {(status === "READ" || rating > 0) && (
            <StarRating value={rating} onChange={handleRatingChange} size="sm" />
          )}

          {percent !== null && (
            <p className="text-xs text-muted-foreground">{percent}% read</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/library/
git commit -m "feat: library UI components — book card, star rating, status selector"
```

---

### Task 3: Add Book dialog

**Files:**
- Create: `components/library/add-book-dialog.tsx`

- [ ] **Step 1: Create `components/library/add-book-dialog.tsx`**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Search } from "lucide-react";
import { Book, ReadingStatus } from "@prisma/client";
import { StatusSelector } from "./status-selector";

type Props = { onAdd: (bookId: string, status: ReadingStatus) => void };

export function AddBookDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [status, setStatus] = useState<ReadingStatus>("WANT_TO_READ");
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    const res = await fetch(`/api/books/search?q=${encodeURIComponent(q)}`);
    const data = await res.json() as Book[];
    setResults(data);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (open) search("");
  }, [open, search]);

  async function handleAdd() {
    if (!selectedBook) return;
    setLoading(true);
    onAdd(selectedBook.id, status);
    setOpen(false);
    setSelectedBook(null);
    setQuery("");
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add book
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-white">Add a book</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or author..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedBook(null); }}
            className="pl-9 bg-background"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1">
          {results.map((book) => (
            <button
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                selectedBook?.id === book.id
                  ? "bg-emerald-500/15 border border-emerald-500/30"
                  : "hover:bg-accent"
              }`}
            >
              {book.cover ? (
                <img src={book.cover} alt="" className="h-12 w-8 object-cover rounded-sm flex-shrink-0" />
              ) : (
                <div className="h-12 w-8 bg-muted rounded-sm flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-sm text-white truncate">{book.title}</p>
                <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                <div className="flex gap-1 mt-0.5">
                  {book.genres.slice(0, 2).map((g) => (
                    <span key={g} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{g}</span>
                  ))}
                </div>
              </div>
            </button>
          ))}
          {results.length === 0 && query.length >= 2 && (
            <p className="text-center text-sm text-muted-foreground py-8">No books found</p>
          )}
        </div>

        {selectedBook && (
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm font-medium text-white">Adding: {selectedBook.title}</p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Status:</span>
              <StatusSelector value={status} onValueChange={setStatus} />
            </div>
            <Button
              onClick={handleAdd}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {loading ? "Adding..." : "Add to library"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/library/add-book-dialog.tsx
git commit -m "feat: add book dialog with search"
```

---

### Task 4: Library grid and page

**Files:**
- Create: `components/library/library-grid.tsx`
- Create: `app/(app)/library/page.tsx`
- Create: `app/(app)/library/loading.tsx`

- [ ] **Step 1: Create `components/library/library-grid.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Book, UserBook, ReadingStatus } from "@prisma/client";
import { BookCard } from "./book-card";
import { AddBookDialog } from "./add-book-dialog";
import { Button } from "@/components/ui/button";

type UserBookWithBook = UserBook & { book: Book };

const FILTERS: { label: string; value: ReadingStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Currently Reading", value: "CURRENTLY_READING" },
  { label: "Read", value: "READ" },
  { label: "Want to Read", value: "WANT_TO_READ" },
  { label: "Abandoned", value: "ABANDONED" },
];

type Props = { initialEntries: UserBookWithBook[] };

export function LibraryGrid({ initialEntries }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [filter, setFilter] = useState<ReadingStatus | "ALL">("ALL");

  const filtered = filter === "ALL" ? entries : entries.filter((e) => e.status === filter);

  async function handleAdd(bookId: string, status: ReadingStatus) {
    const res = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, status }),
    });
    const newEntry = await res.json() as UserBookWithBook;
    setEntries((prev) => [newEntry, ...prev.filter((e) => e.bookId !== bookId)]);
  }

  async function handleUpdate(bookId: string, updates: { status?: ReadingStatus; rating?: number }) {
    await fetch(`/api/library/${bookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setEntries((prev) =>
      prev.map((e) => (e.bookId === bookId ? { ...e, ...updates } : e))
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.value)}
              className={filter === f.value ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "border-border"}
            >
              {f.label}
              <span className="ml-1.5 text-xs opacity-70">
                {f.value === "ALL" ? entries.length : entries.filter((e) => e.status === f.value).length}
              </span>
            </Button>
          ))}
        </div>
        <AddBookDialog onAdd={handleAdd} />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-muted-foreground mb-2">No books here yet.</p>
          <p className="text-sm text-muted-foreground">Add a book to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((entry) => (
            <BookCard key={entry.bookId} entry={entry} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `app/(app)/library/page.tsx`**

```typescript
import { requireOnboarding } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { LibraryGrid } from "@/components/library/library-grid";

export default async function LibraryPage() {
  const session = await requireOnboarding();

  const entries = await db.userBook.findMany({
    where: { userId: session.user.id },
    include: { book: { include: { tasteDimensions: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const stats = {
    total: entries.length,
    read: entries.filter((e) => e.status === "READ").length,
    reading: entries.filter((e) => e.status === "CURRENTLY_READING").length,
    wantToRead: entries.filter((e) => e.status === "WANT_TO_READ").length,
  };

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Library</h1>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span><span className="text-white font-medium">{stats.total}</span> books total</span>
          <span><span className="text-emerald-400 font-medium">{stats.read}</span> read</span>
          <span><span className="text-blue-400 font-medium">{stats.reading}</span> reading</span>
          <span><span className="text-muted-foreground font-medium">{stats.wantToRead}</span> want to read</span>
        </div>
      </div>
      <LibraryGrid initialEntries={entries} />
    </div>
  );
}
```

- [ ] **Step 3: Create `app/(app)/library/loading.tsx`**

```typescript
export default function LibraryLoading() {
  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <div className="h-9 w-40 bg-muted rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-64 bg-muted/50 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-muted animate-pulse aspect-[2/3]" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify library in browser**

```bash
open http://localhost:3000/library
```

Expected: Sign in as `stormbreaker128@gmail.com`, navigate to Library. Should see 10 books in the grid from seed data.

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/library/ components/library/
git commit -m "feat: personal library page with status management and add book flow"
```

---

### Task 5: Tracker UI components

**Files:**
- Create: `components/tracker/reading-stats.tsx`
- Create: `components/tracker/session-logger.tsx`
- Create: `components/tracker/streak-display.tsx`

- [ ] **Step 1: Create `components/tracker/reading-stats.tsx`**

```typescript
import { BookOpen, Clock, TrendingUp, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  booksRead: number;
  pagesRead: number;
  minutesRead: number;
  streakDays: number;
  goalBooks: number;
  goalCurrent: number;
};

export function ReadingStats({ booksRead, pagesRead, minutesRead, streakDays, goalBooks, goalCurrent }: Props) {
  const goalPercent = goalBooks > 0 ? Math.min(100, Math.round((goalCurrent / goalBooks) * 100)) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Books read</span>
          </div>
          <p className="text-2xl font-bold text-white">{booksRead}</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-muted-foreground">Pages read</span>
          </div>
          <p className="text-2xl font-bold text-white">{pagesRead.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-muted-foreground">Hours read</span>
          </div>
          <p className="text-2xl font-bold text-white">{Math.round(minutesRead / 60)}</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-orange-400" />
            <span className="text-xs text-muted-foreground">Reading goal</span>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold text-white">{goalCurrent}</p>
            <p className="text-sm text-muted-foreground">/ {goalBooks}</p>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${goalPercent}%` }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/tracker/streak-display.tsx`**

```typescript
import { Flame } from "lucide-react";

type Props = { streakDays: number };

export function StreakDisplay({ streakDays }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
      <Flame className="h-6 w-6 text-orange-500" />
      <div>
        <p className="font-bold text-white text-lg leading-none">{streakDays}-day streak</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {streakDays === 0 ? "Log a session today to start your streak!" : "Keep reading to maintain your streak 🔥"}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `components/tracker/session-logger.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Book, UserBook } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen } from "lucide-react";

type UserBookWithBook = UserBook & { book: Book };

type Props = {
  currentlyReading: UserBookWithBook[];
  onSessionLogged: () => void;
};

export function SessionLogger({ currentlyReading, onSessionLogged }: Props) {
  const [bookId, setBookId] = useState(currentlyReading[0]?.bookId ?? "");
  const [pages, setPages] = useState("");
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bookId) return;
    setLoading(true);

    await fetch("/api/reading-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId,
        pagesRead: pages ? parseInt(pages) : undefined,
        minutesRead: minutes ? parseInt(minutes) : undefined,
        notes: notes || undefined,
      }),
    });

    setPages("");
    setMinutes("");
    setNotes("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
    setLoading(false);
    onSessionLogged();
  }

  if (currentlyReading.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-8 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">You're not currently reading anything.</p>
          <p className="text-xs text-muted-foreground mt-1">Add a book to your library and mark it as "Currently Reading".</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base text-white">Log a reading session</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {currentlyReading.length > 1 && (
            <div className="space-y-2">
              <Label>Book</Label>
              <Select value={bookId} onValueChange={setBookId}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentlyReading.map((e) => (
                    <SelectItem key={e.bookId} value={e.bookId}>{e.book.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pages">Pages read</Label>
              <Input
                id="pages"
                type="number"
                min="1"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="e.g. 35"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes spent</Label>
              <Input
                id="minutes"
                type="number"
                min="1"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="e.g. 45"
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Session notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was the reading? Any thoughts?"
              className="bg-background resize-none"
              rows={2}
            />
          </div>

          <Button
            type="submit"
            className={`w-full transition-all ${success ? "bg-blue-500 hover:bg-blue-600" : "bg-emerald-500 hover:bg-emerald-600"} text-white`}
            disabled={loading || (!pages && !minutes)}
          >
            {loading ? "Logging..." : success ? "Session logged! +10 points ✓" : "Log session"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/tracker/
git commit -m "feat: reading tracker UI components — stats, streak, session logger"
```

---

### Task 6: Tracker page

**Files:**
- Create: `app/(app)/tracker/page.tsx`

- [ ] **Step 1: Create `app/(app)/tracker/page.tsx`**

```typescript
import { requireOnboarding } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { ReadingStats } from "@/components/tracker/reading-stats";
import { StreakDisplay } from "@/components/tracker/streak-display";
import { SessionLoggerWrapper } from "@/components/tracker/session-logger-wrapper";
import { BookOpen, Calendar } from "lucide-react";

export default async function TrackerPage() {
  const session = await requireOnboarding();
  const userId = session.user.id;
  const currentYear = new Date().getFullYear();

  const [userScore, readingGoal, recentSessions, currentlyReading, booksRead] = await Promise.all([
    db.userScore.findUnique({ where: { userId } }),
    db.readingGoal.findUnique({ where: { userId_type_year: { userId, type: "BOOKS_PER_YEAR", year: currentYear } } }),
    db.readingSession.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 20,
      include: { user: { include: { userBooks: { include: { book: true }, where: { status: "CURRENTLY_READING" } } } } },
    }),
    db.userBook.findMany({
      where: { userId, status: "CURRENTLY_READING" },
      include: { book: true },
    }),
    db.userBook.count({ where: { userId, status: "READ" } }),
  ]);

  const totalPagesRead = recentSessions.reduce((sum, s) => sum + (s.pagesRead ?? 0), 0);
  const totalMinutesRead = recentSessions.reduce((sum, s) => sum + (s.minutesRead ?? 0), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Reading Tracker</h1>
        <p className="text-muted-foreground">Track your progress, log sessions, and maintain your streak.</p>
      </div>

      {/* Streak */}
      <StreakDisplay streakDays={userScore?.streakDays ?? 0} />

      {/* Stats */}
      <ReadingStats
        booksRead={booksRead}
        pagesRead={totalPagesRead}
        minutesRead={totalMinutesRead}
        streakDays={userScore?.streakDays ?? 0}
        goalBooks={readingGoal?.target ?? 12}
        goalCurrent={readingGoal?.current ?? booksRead}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session logger */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Log a session</h2>
          <SessionLoggerWrapper currentlyReading={currentlyReading} />
        </div>

        {/* Currently reading */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Currently reading</h2>
          {currentlyReading.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active reads</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentlyReading.map((entry) => {
                const percent = entry.book.pageCount
                  ? Math.round((entry.progress / entry.book.pageCount) * 100)
                  : 0;
                return (
                  <div key={entry.bookId} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                    {entry.book.cover ? (
                      <img src={entry.book.cover} alt="" className="h-14 w-10 object-cover rounded" />
                    ) : (
                      <div className="h-14 w-10 bg-muted rounded flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white truncate">{entry.book.title}</p>
                      <p className="text-xs text-muted-foreground">{entry.book.author}</p>
                      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.progress} / {entry.book.pageCount ?? "?"} pages ({percent}%)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Recent sessions</h2>
          <div className="space-y-2">
            {recentSessions.slice(0, 10).map((s) => (
              <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card/50 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground w-24 flex-shrink-0">
                  {new Date(s.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
                {s.pagesRead && <span className="text-white">{s.pagesRead} pages</span>}
                {s.minutesRead && <span className="text-muted-foreground">{s.minutesRead} mins</span>}
                {s.notes && <span className="text-muted-foreground truncate">{s.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `components/tracker/session-logger-wrapper.tsx` (client wrapper)**

```typescript
"use client";

import { useRouter } from "next/navigation";
import { SessionLogger } from "./session-logger";
import { Book, UserBook } from "@prisma/client";

type UserBookWithBook = UserBook & { book: Book };

export function SessionLoggerWrapper({ currentlyReading }: { currentlyReading: UserBookWithBook[] }) {
  const router = useRouter();
  return (
    <SessionLogger
      currentlyReading={currentlyReading}
      onSessionLogged={() => router.refresh()}
    />
  );
}
```

- [ ] **Step 3: Verify tracker in browser**

```bash
open http://localhost:3000/tracker
```

Expected: Stats row, streak badge, session logger, currently-reading books with progress bars.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/tracker/ components/tracker/
git commit -m "feat: reading tracker page with session logging, streaks, and progress"
```

---

### Task 7: Write review dialog

**Files:**
- Create: `components/library/review-dialog.tsx`
- Create: `app/api/reviews/route.ts`

- [ ] **Step 1: Create `app/api/reviews/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId, content, rating } = await req.json() as {
    bookId: string;
    content: string;
    rating: number;
  };

  const review = await db.review.upsert({
    where: { userId_bookId: { userId: session.user.id, bookId } },
    update: { content, rating },
    create: { userId: session.user.id, bookId, content, rating, isPublic: true },
  });

  // Award review points
  await db.userScore.upsert({
    where: { userId: session.user.id },
    update: { totalPoints: { increment: 30 } },
    create: { userId: session.user.id, totalPoints: 30 },
  });

  return NextResponse.json(review, { status: 201 });
}
```

- [ ] **Step 2: Create `components/library/review-dialog.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./star-rating";
import { MessageSquare } from "lucide-react";

type Props = {
  bookId: string;
  bookTitle: string;
  existingReview?: { content: string; rating: number } | null;
  onSaved?: () => void;
};

export function ReviewDialog({ bookId, bookTitle, existingReview, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(existingReview?.content ?? "");
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!content.trim() || rating === 0) return;
    setLoading(true);
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, content, rating }),
    });
    setLoading(false);
    setOpen(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-white gap-1">
          <MessageSquare className="h-3 w-3" />
          {existingReview ? "Edit review" : "Write review"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-white">Review: {bookTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Your rating</p>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Your thoughts</p>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="What did you think? What worked, what didn't?"
              className="bg-background resize-none"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={loading || !content.trim() || rating === 0}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {loading ? "Saving..." : "Save review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/library/review-dialog.tsx app/api/reviews/
git commit -m "feat: review dialog and review API route"
```

---

## Phase 3 Complete

**What's working:**
- Library page: browse books by status, 6-column grid
- Add book dialog with fuzzy search over seeded books
- Status management (read/want-to-read/currently-reading/abandoned)
- 1–5 star rating inline on cards
- Review dialog with write/edit capability
- Reading tracker: stats, streak, session logger, progress bars
- API routes: library CRUD, reading sessions, reviews, book search

**Next:** Phase 4 — Taste matching engine and taste profile UI.
