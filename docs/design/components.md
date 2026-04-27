# Stacks — Component Definitions

Component catalogue for the Stacks design direction. Each entry defines purpose, required data, and usage location. Do not implement until Phase 3 begins.

---

## FeedCard

**Purpose:** Displays a single activity item in the home feed — a friend's rating, review, reading status update, or club post.

**Required data:**
- `actor: { id, name, avatar }` — user who performed the action
- `actionType: "rated" | "reviewed" | "started" | "finished" | "posted"` — verb
- `book?: { id, title, author, cover }` — book the action relates to (if applicable)
- `club?: { id, name }` — club the action was posted in (if applicable)
- `body?: string` — review text or post body (truncated to ~120 chars)
- `rating?: 1 | 2 | 3 | 4 | 5` — star rating (if actionType is "rated")
- `createdAt: Date` — relative timestamp ("2h ago", "yesterday")
- `likeCount: number`
- `commentCount: number`

**Usage location:** `/home` feed, `/feed` page

---

## UserMatchCard

**Purpose:** Displays a reader whose taste profile closely matches the current user, with a percentage match score and plain-English explanation.

**Required data:**
- `user: { id, name, avatar, username }`
- `matchScore: number` — 0–100
- `matchReasons: string[]` — e.g. ["You both love slow-burn fantasy", "Shared dislike of action thrillers"]
- `sharedBooks: { title: string }[]` — up to 3 shared highly-rated books
- `booksRead: number` — total books in their library

**Usage location:** `/home` feed ("People you'd love"), `/discover` "In your network" section

---

## ClubCard

**Purpose:** Displays a book club with compatibility information, current book, and key metadata.

**Required data:**
- `club: { id, name, description, coverImage?, memberCount, isPrivate }`
- `currentBook?: { title, author, cover }` — what the club is reading now
- `matchScore?: number` — taste compatibility with this club (if computed)
- `genres: string[]` — up to 3 genre tags
- `cadence: "weekly" | "biweekly" | "monthly"` — meeting cadence
- `format: "online" | "in-person" | "hybrid"`

**Usage location:** `/home` feed ("Clubs you'd love"), `/clubs` browse page

---

## BookCard

**Purpose:** Displays a single book with cover, metadata, and optionally the user's relationship to it (shelf status, rating).

**Required data:**
- `book: { id, title, author, cover?, pageCount?, genres: string[] }`
- `userBook?: { status: ReadingStatus, rating?: number, progress?: number }` — current user's shelf entry (optional)
- `variant: "compact" | "full"` — compact for carousels, full for search results

**Usage location:** `/discover` carousels, `/library` shelf grids, search results, `ShelfCarousel`

---

## ShelfCarousel

**Purpose:** Horizontal scrollable row of BookCards with a section heading and optional "See all" link.

**Required data:**
- `title: string` — section heading (e.g. "Currently Reading", "Want to Read")
- `books: BookCardProps[]` — array of book data
- `seeAllHref?: string` — link target for "See all →"
- `emptyState?: string` — message when no books (e.g. "Nothing here yet — add some books")

**Usage location:** `/library` (one carousel per shelf), `/home` (e.g. "Your want-to-read list"), `/discover`

---

## FilterChips

**Purpose:** Horizontal row of toggleable pill filters. Multiple can be active simultaneously. Scrolls horizontally on small screens.

**Required data:**
- `options: { label: string; value: string }[]`
- `selected: string[]` — currently active values
- `onChange: (selected: string[]) => void`
- `multi?: boolean` — default true; if false, behaves as radio (single selection)

**Usage location:** `/home` feed filters (genre, remote/in-person, cadence, popular), `/discover` search refinement, `/library` shelf filter

---

## SearchBar

**Purpose:** Full-width search input with placeholder text and optional leading icon. Submits on Enter or debounce. Does not handle routing — callers decide where results go.

**Required data:**
- `placeholder: string`
- `value: string`
- `onChange: (value: string) => void`
- `onSubmit?: (value: string) => void`
- `autoFocus?: boolean`

**Usage location:** `/home` (clubs & events search), `/discover` (books, authors, moods), `/library` (filter own books)
