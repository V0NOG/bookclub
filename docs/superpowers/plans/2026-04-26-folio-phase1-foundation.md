# Folio Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Next.js project with Prisma schema, PostgreSQL database, realistic seed data, and NextAuth credentials auth.

**Architecture:** Next.js 14 App Router in the existing `/Users/connor/Documents/bookclub/` directory. Prisma ORM with PostgreSQL. NextAuth v4 with credentials + bcrypt. Seed data makes the app demo-ready from day one.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Prisma, PostgreSQL, NextAuth v4, bcryptjs, zod, shadcn/ui

---

## File Map

| File | Purpose |
|------|---------|
| `package.json` | Dependencies |
| `next.config.ts` | Next.js config |
| `tailwind.config.ts` | Tailwind + design tokens |
| `prisma/schema.prisma` | Complete data model |
| `prisma/seed.ts` | Realistic demo seed data |
| `lib/db.ts` | Prisma client singleton |
| `lib/auth.ts` | NextAuth config |
| `lib/auth-helpers.ts` | Session utilities |
| `middleware.ts` | Route protection |
| `app/api/auth/[...nextauth]/route.ts` | Auth API handler |
| `types/index.ts` | Shared TypeScript types |

---

### Task 1: Initialise Next.js project

**Files:**
- Create: entire project scaffold at `/Users/connor/Documents/bookclub/`

- [ ] **Step 1: Initialise Next.js**

```bash
cd /Users/connor/Documents/bookclub
npx create-next-app@14 . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
```

Expected: project scaffold created, `package.json` exists with `"next": "14.*"`

- [ ] **Step 2: Verify scaffold**

```bash
ls -1
```

Expected output includes: `app/`, `components/`, `lib/`, `public/`, `tailwind.config.ts`, `next.config.ts`, `tsconfig.json`

- [ ] **Step 3: Commit**

```bash
git init
git add .
git commit -m "chore: initialise Next.js 14 project scaffold"
```

---

### Task 2: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install production dependencies**

```bash
npm install \
  prisma @prisma/client \
  next-auth @auth/prisma-adapter \
  bcryptjs \
  zod \
  date-fns \
  clsx tailwind-merge \
  lucide-react \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-select \
  @radix-ui/react-slot \
  @radix-ui/react-tabs \
  @radix-ui/react-toast \
  @radix-ui/react-avatar \
  @radix-ui/react-progress \
  @radix-ui/react-separator \
  @radix-ui/react-label \
  @radix-ui/react-checkbox \
  @radix-ui/react-scroll-area \
  class-variance-authority
```

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D \
  @types/bcryptjs \
  @types/node \
  ts-node \
  typescript
```

- [ ] **Step 3: Verify install**

```bash
cat package.json | grep '"next-auth"'
```

Expected: `"next-auth": "^4.*"`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install prisma, next-auth, radix-ui and utility deps"
```

---

### Task 3: Configure shadcn/ui design system

**Files:**
- Create: `components/ui/` (shadcn components)
- Modify: `tailwind.config.ts`, `app/globals.css`

- [ ] **Step 1: Initialise shadcn**

```bash
npx shadcn@latest init --yes --defaults
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes

- [ ] **Step 2: Add required shadcn components**

```bash
npx shadcn@latest add button card badge input label textarea \
  dialog dropdown-menu select tabs toast avatar progress separator \
  scroll-area checkbox sheet tooltip
```

Expected: `components/ui/` populated with component files.

- [ ] **Step 3: Update `tailwind.config.ts` with Folio design tokens**

Replace the content of `tailwind.config.ts` with:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Folio brand colours
        emerald: {
          500: "#10b981",
          600: "#059669",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

- [ ] **Step 4: Replace `app/globals.css` with dark Folio theme**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 142 71% 45%;
    --primary-foreground: 355.7 100% 97.3%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 142 71% 45%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 5.5%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 5.5%;
    --popover-foreground: 0 0% 98%;
    --primary: 142 71% 45%;
    --primary-foreground: 144 61% 20%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 142 71% 45%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Folio custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 3px;
}
```

- [ ] **Step 5: Install tailwindcss-animate**

```bash
npm install tailwindcss-animate
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: configure shadcn/ui with dark Folio design theme"
```

---

### Task 4: Initialise Prisma and write the full schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db.ts`

- [ ] **Step 1: Initialise Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Expected: `prisma/schema.prisma` and `.env` created.

- [ ] **Step 2: Update `.env`**

```bash
# .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/folio?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="folio-dev-secret-change-in-production-32chars"
```

- [ ] **Step 3: Write `prisma/schema.prisma`**

Replace the entire file:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────────────────────────────

enum UserType {
  READER
  ORGANISER
  MEMBER
  INFLUENCER
}

enum ReadingStatus {
  WANT_TO_READ
  CURRENTLY_READING
  READ
  ABANDONED
}

enum MatchType {
  USER_TO_USER
  USER_TO_BOOK
  USER_TO_CLUB
  CLUB_TO_BOOK
}

enum MatchConfidence {
  LOW
  MEDIUM
  HIGH
}

enum MembershipType {
  OPEN
  APPLICATION
  PRIVATE
}

enum ClubVisibility {
  PUBLIC
  PRIVATE
}

enum ClubRole {
  OWNER
  ORGANISER
  MEMBER
}

enum ApplicationStatus {
  PENDING
  APPROVED
  REJECTED
}

enum PollStatus {
  ACTIVE
  CLOSED
  DRAFT
}

enum VoteMode {
  SINGLE
  MULTI
}

enum GoalType {
  BOOKS_PER_YEAR
  PAGES_PER_MONTH
  MINUTES_PER_DAY
}

enum ChallengeType {
  FASTEST_FINISH
  MOST_PAGES_WEEK
  MOST_MINUTES_MONTH
  CLUB_MONTHLY
  FRIEND_GROUP
  PERSONAL_GOAL
}

enum FeedItemType {
  REVIEW_CREATED
  BOOK_FINISHED
  BOOK_STARTED
  CLUB_JOINED
  CHALLENGE_JOINED
  CHALLENGE_COMPLETED
  ACHIEVEMENT_EARNED
  CLUB_POST
  CLUB_POLL
  READING_MILESTONE
  TASTE_EVOLUTION
}

// ─── Auth ────────────────────────────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  username      String?   @unique
  avatar        String?
  bio           String?
  location      String?
  userType      UserType  @default(READER)
  onboarded     Boolean   @default(false)
  passwordHash  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts              Account[]
  sessions              Session[]
  userBooks             UserBook[]
  shelves               Shelf[]
  reviews               Review[]
  tasteProfile          TasteProfile?
  onboardingData        OnboardingData?
  clubMemberships       ClubMember[]
  clubApplications      ClubApplication[]
  followers             Follow[]           @relation("Following")
  following             Follow[]           @relation("Followers")
  readingSessions       ReadingSession[]
  readingGoals          ReadingGoal[]
  challengeParticipants ChallengeParticipant[]
  userScore             UserScore?
  userAchievements      UserAchievement[]
  feedItems             FeedItem[]

  @@index([email])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── Books ───────────────────────────────────────────────────────────────────

model Book {
  id          String    @id @default(cuid())
  title       String
  author      String
  authors     String[]
  isbn        String?   @unique
  cover       String?
  description String?   @db.Text
  publishedAt DateTime?
  publisher   String?
  pageCount   Int?
  language    String    @default("en")
  genres      String[]
  tags        String[]
  avgRating   Float?
  ratingsCount Int      @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  userBooks         UserBook[]
  reviews           Review[]
  shelfBooks        ShelfBook[]
  tasteDimensions   BookTasteDimension?
  clubCurrentBooks  Club[]             @relation("CurrentBook")
  clubUpcomingBooks Club[]             @relation("UpcomingBook")
  clubPollOptions   ClubPollOption[]
  challengeBooks    ReadingChallenge[]
  readingHistories  ClubReadingHistory[]

  @@index([author])
}

model BookTasteDimension {
  id                  String  @id @default(cuid())
  bookId              String  @unique
  pace                Float?
  tone                Float?
  focus               Float?
  emotionalIntensity  Float?
  romanceLevel        Float?
  complexity          Float?
  worldbuildingDepth  Float?
  discussionPotential Float?

  book Book @relation(fields: [bookId], references: [id], onDelete: Cascade)
}

model UserBook {
  id         String        @id @default(cuid())
  userId     String
  bookId     String
  status     ReadingStatus @default(WANT_TO_READ)
  rating     Int?
  startedAt  DateTime?
  finishedAt DateTime?
  progress   Int           @default(0)
  notes      String?       @db.Text
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  book Book @relation(fields: [bookId], references: [id])

  @@unique([userId, bookId])
  @@index([userId, status])
}

model Review {
  id        String   @id @default(cuid())
  userId    String
  bookId    String
  content   String   @db.Text
  rating    Int
  isPublic  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  likes     ReviewLike[]

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  book Book @relation(fields: [bookId], references: [id])

  @@unique([userId, bookId])
}

model ReviewLike {
  id       String @id @default(cuid())
  reviewId String
  userId   String
  review   Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@unique([reviewId, userId])
}

// ─── Shelves ─────────────────────────────────────────────────────────────────

model Shelf {
  id          String      @id @default(cuid())
  userId      String
  name        String
  description String?
  isPublic    Boolean     @default(true)
  isDefault   Boolean     @default(false)
  createdAt   DateTime    @default(now())

  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  shelfBooks ShelfBook[]

  @@index([userId])
}

model ShelfBook {
  id      String   @id @default(cuid())
  shelfId String
  bookId  String
  addedAt DateTime @default(now())

  shelf Shelf @relation(fields: [shelfId], references: [id], onDelete: Cascade)
  book  Book  @relation(fields: [bookId], references: [id])

  @@unique([shelfId, bookId])
}

// ─── Taste ───────────────────────────────────────────────────────────────────

model TasteProfile {
  id                  String   @id @default(cuid())
  userId              String   @unique
  topGenres           String[]
  topAuthors          String[]
  topThemes           String[]
  topMoods            String[]
  pace                Float?
  tone                Float?
  focus               Float?
  emotionalIntensity  Float?
  romanceLevel        Float?
  complexity          Float?
  worldbuildingDepth  Float?
  discussionPotential Float?
  cluster             String?
  dislikedGenres      String[]
  dislikedThemes      String[]
  dislikedAuthors     String[]
  confidence          MatchConfidence @default(LOW)
  lastCalculated      DateTime?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  user            User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  dimensionScores TasteDimensionScore[]
}

model TasteDimensionScore {
  id             String  @id @default(cuid())
  tasteProfileId String
  dimension      String
  score          Float
  confidence     Float

  tasteProfile TasteProfile @relation(fields: [tasteProfileId], references: [id], onDelete: Cascade)

  @@unique([tasteProfileId, dimension])
}

model TasteMatch {
  id                    String          @id @default(cuid())
  userAId               String?
  userBId               String?
  bookId                String?
  clubId                String?
  matchType             MatchType
  score                 Int
  confidence            MatchConfidence
  matchReasons          String[]
  positiveSignals       Json
  negativeSignals       Json
  sharedBooks           String[]
  sharedGenres          String[]
  sharedAuthors         String[]
  sharedThemes          String[]
  sharedTasteDimensions String[]
  calculatedAt          DateTime        @default(now())
  expiresAt             DateTime?

  @@index([userAId, matchType])
  @@index([clubId, matchType])
}

model TasteCluster {
  id          String   @id @default(cuid())
  name        String   @unique
  label       String
  description String?
  genres      String[]
  themes      String[]
  dimensions  Json
  createdAt   DateTime @default(now())
}

model OnboardingData {
  id                      String    @id @default(cuid())
  userId                  String    @unique
  favoriteGenres          String[]
  favoriteBookIds         String[]
  dislikedBookIds         String[]
  favoriteAuthors         String[]
  preferredMoods          String[]
  preferredThemes         String[]
  readingGoalBooksPerYear Int?
  clubPreference          String?
  interestedInClubs       Boolean   @default(false)
  interestedInChallenges  Boolean   @default(false)
  userType                UserType  @default(READER)
  completedAt             DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ─── Clubs ───────────────────────────────────────────────────────────────────

model Club {
  id             String         @id @default(cuid())
  name           String
  description    String?        @db.Text
  banner         String?
  avatar         String?
  ownerId        String
  genres         String[]
  themes         String[]
  location       String?
  isOnline       Boolean        @default(true)
  meetingCadence String?
  membershipType MembershipType @default(OPEN)
  visibility     ClubVisibility @default(PUBLIC)
  maxMembers     Int?
  currentBookId  String?
  upcomingBookId String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  currentBook      Book?                @relation("CurrentBook", fields: [currentBookId], references: [id])
  upcomingBook     Book?                @relation("UpcomingBook", fields: [upcomingBookId], references: [id])
  members          ClubMember[]
  applications     ClubApplication[]
  posts            ClubPost[]
  discussions      ClubDiscussion[]
  polls            ClubPoll[]
  readingHistory   ClubReadingHistory[]
  challenges       ReadingChallenge[]

  @@index([genres])
  @@index([isOnline])
}

model ClubMember {
  id       String   @id @default(cuid())
  clubId   String
  userId   String
  role     ClubRole @default(MEMBER)
  joinedAt DateTime @default(now())
  votes    ClubVote[]

  club Club @relation(fields: [clubId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([clubId, userId])
}

model ClubApplication {
  id        String            @id @default(cuid())
  clubId    String
  userId    String
  message   String?
  status    ApplicationStatus @default(PENDING)
  createdAt DateTime          @default(now())

  club Club @relation(fields: [clubId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([clubId, userId])
}

model ClubReadingHistory {
  id         String    @id @default(cuid())
  clubId     String
  bookId     String
  startedAt  DateTime?
  finishedAt DateTime?
  avgRating  Float?
  notes      String?

  club Club @relation(fields: [clubId], references: [id], onDelete: Cascade)
  book Book @relation(fields: [bookId], references: [id])

  @@index([clubId])
}

model ClubPost {
  id        String   @id @default(cuid())
  clubId    String
  authorId  String
  title     String?
  content   String   @db.Text
  isPinned  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  comments  ClubComment[]

  club Club @relation(fields: [clubId], references: [id], onDelete: Cascade)
}

model ClubDiscussion {
  id        String   @id @default(cuid())
  clubId    String
  authorId  String
  title     String
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  comments  ClubComment[]

  club Club @relation(fields: [clubId], references: [id], onDelete: Cascade)
}

model ClubComment {
  id           String   @id @default(cuid())
  postId       String?
  discussionId String?
  authorId     String
  content      String   @db.Text
  createdAt    DateTime @default(now())

  post       ClubPost?       @relation(fields: [postId], references: [id], onDelete: Cascade)
  discussion ClubDiscussion? @relation(fields: [discussionId], references: [id], onDelete: Cascade)
}

model ClubPoll {
  id             String     @id @default(cuid())
  clubId         String
  title          String
  description    String?
  status         PollStatus @default(ACTIVE)
  voteMode       VoteMode   @default(SINGLE)
  resultsVisible Boolean    @default(false)
  endsAt         DateTime?
  createdAt      DateTime   @default(now())

  club    Club             @relation(fields: [clubId], references: [id], onDelete: Cascade)
  options ClubPollOption[]
  votes   ClubVote[]

  @@index([clubId, status])
}

model ClubPollOption {
  id           String   @id @default(cuid())
  pollId       String
  bookId       String?
  label        String
  matchScore   Int?
  matchReasons String[]
  votes        ClubVote[]

  poll ClubPoll @relation(fields: [pollId], references: [id], onDelete: Cascade)
  book Book?    @relation(fields: [bookId], references: [id])
}

model ClubVote {
  id        String   @id @default(cuid())
  pollId    String
  optionId  String
  memberId  String
  createdAt DateTime @default(now())

  poll   ClubPoll       @relation(fields: [pollId], references: [id], onDelete: Cascade)
  option ClubPollOption @relation(fields: [optionId], references: [id], onDelete: Cascade)
  member ClubMember     @relation(fields: [memberId], references: [id], onDelete: Cascade)

  @@unique([pollId, memberId, optionId])
}

// ─── Reading ─────────────────────────────────────────────────────────────────

model ReadingSession {
  id           String   @id @default(cuid())
  userId       String
  bookId       String
  date         DateTime @default(now())
  pagesRead    Int?
  minutesRead  Int?
  chaptersRead Int?
  notes        String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, date])
}

model ReadingGoal {
  id      String   @id @default(cuid())
  userId  String
  type    GoalType
  target  Int
  current Int      @default(0)
  year    Int

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, type, year])
}

// ─── Challenges ──────────────────────────────────────────────────────────────

model ReadingChallenge {
  id          String        @id @default(cuid())
  title       String
  description String?
  type        ChallengeType
  creatorId   String
  clubId      String?
  bookId      String?
  startDate   DateTime
  endDate     DateTime
  target      Int?
  isPublic    Boolean       @default(true)
  createdAt   DateTime      @default(now())

  club         Club?                  @relation(fields: [clubId], references: [id])
  book         Book?                  @relation(fields: [bookId], references: [id])
  participants ChallengeParticipant[]

  @@index([clubId])
}

model ChallengeParticipant {
  id          String   @id @default(cuid())
  challengeId String
  userId      String
  progress    Int      @default(0)
  joinedAt    DateTime @default(now())
  isPrivate   Boolean  @default(false)

  challenge ReadingChallenge @relation(fields: [challengeId], references: [id], onDelete: Cascade)

  @@unique([challengeId, userId])
}

// ─── Gamification ────────────────────────────────────────────────────────────

model Achievement {
  id          String   @id @default(cuid())
  key         String   @unique
  title       String
  description String
  icon        String?
  points      Int      @default(10)

  userAchievements UserAchievement[]
}

model UserAchievement {
  id            String   @id @default(cuid())
  userId        String
  achievementId String
  earnedAt      DateTime @default(now())

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement Achievement @relation(fields: [achievementId], references: [id])

  @@unique([userId, achievementId])
}

model UserScore {
  id          String    @id @default(cuid())
  userId      String    @unique
  totalPoints Int       @default(0)
  streakDays  Int       @default(0)
  lastReadAt  DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ─── Social ──────────────────────────────────────────────────────────────────

model Follow {
  id          String   @id @default(cuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower  User @relation("Followers", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("Following", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
}

model FeedItem {
  id             String       @id @default(cuid())
  userId         String
  actorId        String
  type           FeedItemType
  entityId       String
  entityType     String
  content        Json?
  isRead         Boolean      @default(false)
  relevanceScore Float?
  createdAt      DateTime     @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
}
```

- [ ] **Step 4: Create `lib/db.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma lib/db.ts .env
git commit -m "feat: add complete Prisma schema for all Folio models"
```

---

### Task 5: Create PostgreSQL database and run migration

**Files:**
- Creates: `prisma/migrations/`

- [ ] **Step 1: Ensure PostgreSQL is running**

```bash
psql -U postgres -c "SELECT version();" 2>/dev/null || echo "PostgreSQL not running - start it first"
```

If not running on macOS: `brew services start postgresql@15`

- [ ] **Step 2: Create the database**

```bash
psql -U postgres -c "CREATE DATABASE folio;" 2>/dev/null || echo "DB may already exist"
```

- [ ] **Step 3: Run initial migration**

```bash
npx prisma migrate dev --name init
```

Expected: `✔ Generated Prisma Client` and migration file created.

- [ ] **Step 4: Verify tables**

```bash
npx prisma studio
```

Open http://localhost:5555 — you should see all models listed. Press Ctrl+C to close.

- [ ] **Step 5: Commit**

```bash
git add prisma/migrations/
git commit -m "feat: initial database migration"
```

---

### Task 6: Write the seed script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add seed script)

- [ ] **Step 1: Add seed script to `package.json`**

Add inside the `"scripts"` object:

```json
"db:seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts",
"db:reset": "npx prisma migrate reset --force && npm run db:seed"
```

Also add after `"scripts"`:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

- [ ] **Step 2: Create `prisma/seed.ts`**

```typescript
import { PrismaClient, ReadingStatus, ClubRole, PollStatus, ChallengeType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Folio database...");

  // ── Achievements ────────────────────────────────────────────────────────────
  const achievements = await Promise.all([
    prisma.achievement.upsert({
      where: { key: "first_book" },
      update: {},
      create: { key: "first_book", title: "First Page Turner", description: "Finished your first book on Folio", icon: "📖", points: 50 },
    }),
    prisma.achievement.upsert({
      where: { key: "week_streak" },
      update: {},
      create: { key: "week_streak", title: "7-Day Streak", description: "Read every day for 7 days", icon: "🔥", points: 75 },
    }),
    prisma.achievement.upsert({
      where: { key: "club_finisher" },
      update: {},
      create: { key: "club_finisher", title: "Club Finisher", description: "Completed a club reading challenge", icon: "🏆", points: 100 },
    }),
    prisma.achievement.upsert({
      where: { key: "speed_reader" },
      update: {},
      create: { key: "speed_reader", title: "Speed Reader", description: "Finished a book in under 3 days", icon: "⚡", points: 80 },
    }),
    prisma.achievement.upsert({
      where: { key: "thoughtful_reviewer" },
      update: {},
      create: { key: "thoughtful_reviewer", title: "Thoughtful Reviewer", description: "Written 5 detailed reviews", icon: "✍️", points: 60 },
    }),
    prisma.achievement.upsert({
      where: { key: "genre_explorer" },
      update: {},
      create: { key: "genre_explorer", title: "Genre Explorer", description: "Read books across 5 different genres", icon: "🗺️", points: 70 },
    }),
    prisma.achievement.upsert({
      where: { key: "poll_participant" },
      update: {},
      create: { key: "poll_participant", title: "Poll Participant", description: "Voted in your first club poll", icon: "🗳️", points: 20 },
    }),
    prisma.achievement.upsert({
      where: { key: "challenge_winner" },
      update: {},
      create: { key: "challenge_winner", title: "Challenge Winner", description: "Won a reading challenge", icon: "🥇", points: 150 },
    }),
  ]);

  // ── Taste Clusters ──────────────────────────────────────────────────────────
  await prisma.tasteCluster.upsert({
    where: { name: "epic_fantasy" },
    update: {},
    create: {
      name: "epic_fantasy",
      label: "Epic Fantasy Readers",
      description: "Loves sprawling worlds, complex magic systems, and multi-book sagas",
      genres: ["Fantasy", "Epic Fantasy", "High Fantasy"],
      themes: ["magic", "world-building", "prophecy", "war", "chosen one"],
      dimensions: { pace: [0.2, 0.6], worldbuilding: [0.7, 1.0], complexity: [0.6, 1.0] },
    },
  });
  await prisma.tasteCluster.upsert({
    where: { name: "dark_academia" },
    update: {},
    create: {
      name: "dark_academia",
      label: "Dark Academia Readers",
      description: "Drawn to elite institutions, forbidden knowledge, and gothic atmosphere",
      genres: ["Dark Academia", "Gothic", "Mystery", "Literary Fiction"],
      themes: ["academia", "secrets", "obsession", "power", "knowledge"],
      dimensions: { tone: [0.6, 1.0], complexity: [0.6, 1.0], discussionPotential: [0.7, 1.0] },
    },
  });
  await prisma.tasteCluster.upsert({
    where: { name: "cozy_romance" },
    update: {},
    create: {
      name: "cozy_romance",
      label: "Cozy Romance Readers",
      description: "Prefers warm, feel-good stories with satisfying romantic arcs",
      genres: ["Romance", "Contemporary Romance", "Cozy Fantasy"],
      themes: ["love", "community", "healing", "found family", "small town"],
      dimensions: { tone: [0.0, 0.4], romanceLevel: [0.6, 1.0], emotionalIntensity: [0.3, 0.7] },
    },
  });
  await prisma.tasteCluster.upsert({
    where: { name: "literary_fiction" },
    update: {},
    create: {
      name: "literary_fiction",
      label: "Literary Fiction Readers",
      description: "Values prose quality, character depth, and thematic complexity over plot",
      genres: ["Literary Fiction", "Contemporary Fiction", "Historical Fiction"],
      themes: ["identity", "grief", "memory", "society", "family"],
      dimensions: { focus: [0.7, 1.0], discussionPotential: [0.7, 1.0], pace: [0.0, 0.5] },
    },
  });
  await prisma.tasteCluster.upsert({
    where: { name: "thriller_reader" },
    update: {},
    create: {
      name: "thriller_reader",
      label: "Thriller & Mystery Readers",
      description: "Craves fast-paced plots, twists, and unputdownable page-turners",
      genres: ["Thriller", "Mystery", "Crime", "Suspense"],
      themes: ["crime", "deception", "investigation", "twists", "danger"],
      dimensions: { pace: [0.6, 1.0], tone: [0.4, 0.8], emotionalIntensity: [0.5, 0.9] },
    },
  });

  // ── Books ───────────────────────────────────────────────────────────────────
  const books = await Promise.all([
    createBook(prisma, {
      title: "The Name of the Wind",
      author: "Patrick Rothfuss",
      authors: ["Patrick Rothfuss"],
      cover: "https://covers.openlibrary.org/b/id/8369551-L.jpg",
      description: "The tale of Kvothe, a legendary figure known as a notorious troublemaker. His story begins where all good tales should begin — at the beginning.",
      publishedAt: new Date("2007-03-27"),
      pageCount: 662,
      genres: ["Fantasy", "Epic Fantasy"],
      tags: ["magic", "coming-of-age", "music", "revenge"],
      avgRating: 4.5,
      ratingsCount: 892341,
      dimensions: { pace: 0.3, tone: 0.5, focus: 0.85, emotionalIntensity: 0.6, romanceLevel: 0.2, complexity: 0.85, worldbuildingDepth: 0.9, discussionPotential: 0.85 },
    }),
    createBook(prisma, {
      title: "Six of Crows",
      author: "Leigh Bardugo",
      authors: ["Leigh Bardugo"],
      cover: "https://covers.openlibrary.org/b/id/8228691-L.jpg",
      description: "A convict with a plan to break into the world's most secure prison. A sharpshooter who can't walk away from a wager. A runaway with a privileged past.",
      publishedAt: new Date("2015-09-29"),
      pageCount: 465,
      genres: ["Fantasy", "Young Adult"],
      tags: ["heist", "dark", "ensemble cast", "crime"],
      avgRating: 4.4,
      ratingsCount: 673211,
      dimensions: { pace: 0.75, tone: 0.7, focus: 0.6, emotionalIntensity: 0.7, romanceLevel: 0.5, complexity: 0.7, worldbuildingDepth: 0.7, discussionPotential: 0.7 },
    }),
    createBook(prisma, {
      title: "The House in the Cerulean Sea",
      author: "TJ Klune",
      authors: ["TJ Klune"],
      cover: "https://covers.openlibrary.org/b/id/10521464-L.jpg",
      description: "A case worker at the Department in Charge of Magical Youth discovers the children he's been sent to supervise might save the world.",
      publishedAt: new Date("2020-03-17"),
      pageCount: 396,
      genres: ["Fantasy", "Cozy Fantasy", "Romance"],
      tags: ["cozy", "found family", "magical creatures", "slow romance"],
      avgRating: 4.3,
      ratingsCount: 341872,
      dimensions: { pace: 0.3, tone: 0.15, focus: 0.85, emotionalIntensity: 0.5, romanceLevel: 0.65, complexity: 0.3, worldbuildingDepth: 0.5, discussionPotential: 0.55 },
    }),
    createBook(prisma, {
      title: "A Little Life",
      author: "Hanya Yanagihara",
      authors: ["Hanya Yanagihara"],
      cover: "https://covers.openlibrary.org/b/id/8737138-L.jpg",
      description: "A shattering portrait of a chosen family and the limits of human endurance.",
      publishedAt: new Date("2015-03-10"),
      pageCount: 720,
      genres: ["Literary Fiction", "Contemporary Fiction"],
      tags: ["trauma", "friendship", "grief", "devastating"],
      avgRating: 4.3,
      ratingsCount: 412903,
      dimensions: { pace: 0.2, tone: 0.95, focus: 1.0, emotionalIntensity: 1.0, romanceLevel: 0.3, complexity: 0.75, worldbuildingDepth: 0.1, discussionPotential: 0.95 },
    }),
    createBook(prisma, {
      title: "The Seven Husbands of Evelyn Hugo",
      author: "Taylor Jenkins Reid",
      authors: ["Taylor Jenkins Reid"],
      cover: "https://covers.openlibrary.org/b/id/10437060-L.jpg",
      description: "A reclusive Hollywood actress finally agrees to tell her incredible, scandalous story to a young journalist.",
      publishedAt: new Date("2017-06-13"),
      pageCount: 389,
      genres: ["Historical Fiction", "Romance", "Contemporary Fiction"],
      tags: ["Hollywood", "bisexual", "scandal", "ambition"],
      avgRating: 4.5,
      ratingsCount: 1023411,
      dimensions: { pace: 0.55, tone: 0.5, focus: 0.9, emotionalIntensity: 0.8, romanceLevel: 0.75, complexity: 0.5, worldbuildingDepth: 0.1, discussionPotential: 0.8 },
    }),
    createBook(prisma, {
      title: "Project Hail Mary",
      author: "Andy Weir",
      authors: ["Andy Weir"],
      cover: "https://covers.openlibrary.org/b/id/12008718-L.jpg",
      description: "A lone astronaut must save the earth from disaster. But first, he has to remember who he is.",
      publishedAt: new Date("2021-05-04"),
      pageCount: 476,
      genres: ["Science Fiction", "Adventure"],
      tags: ["science", "space", "first contact", "problem-solving"],
      avgRating: 4.5,
      ratingsCount: 587231,
      dimensions: { pace: 0.8, tone: 0.3, focus: 0.65, emotionalIntensity: 0.5, romanceLevel: 0.05, complexity: 0.7, worldbuildingDepth: 0.8, discussionPotential: 0.75 },
    }),
    createBook(prisma, {
      title: "The Midnight Library",
      author: "Matt Haig",
      authors: ["Matt Haig"],
      cover: "https://covers.openlibrary.org/b/id/10521463-L.jpg",
      description: "Between life and death there is a library, and within that library, the shelves go on forever.",
      publishedAt: new Date("2020-08-13"),
      pageCount: 304,
      genres: ["Contemporary Fiction", "Fantasy"],
      tags: ["regret", "choices", "mental health", "hope"],
      avgRating: 3.9,
      ratingsCount: 876543,
      dimensions: { pace: 0.45, tone: 0.4, focus: 0.8, emotionalIntensity: 0.7, romanceLevel: 0.2, complexity: 0.4, worldbuildingDepth: 0.3, discussionPotential: 0.7 },
    }),
    createBook(prisma, {
      title: "Pachinko",
      author: "Min Jin Lee",
      authors: ["Min Jin Lee"],
      cover: "https://covers.openlibrary.org/b/id/8371512-L.jpg",
      description: "A sweeping saga about a Korean family that begins with a forbidden love and follows its generations through Japan.",
      publishedAt: new Date("2017-02-07"),
      pageCount: 485,
      genres: ["Historical Fiction", "Literary Fiction"],
      tags: ["family saga", "immigration", "identity", "Korea", "Japan"],
      avgRating: 4.2,
      ratingsCount: 312088,
      dimensions: { pace: 0.2, tone: 0.7, focus: 0.85, emotionalIntensity: 0.8, romanceLevel: 0.4, complexity: 0.6, worldbuildingDepth: 0.2, discussionPotential: 0.9 },
    }),
    createBook(prisma, {
      title: "The Thursday Murder Club",
      author: "Richard Osman",
      authors: ["Richard Osman"],
      cover: "https://covers.openlibrary.org/b/id/10521465-L.jpg",
      description: "Four retirees in a peaceful retirement village challenge each other with cold cases — until a real murder turns up on their doorstep.",
      publishedAt: new Date("2020-09-03"),
      pageCount: 382,
      genres: ["Mystery", "Cozy Mystery", "Crime"],
      tags: ["humorous", "elderly protagonists", "cozy", "British"],
      avgRating: 4.0,
      ratingsCount: 298761,
      dimensions: { pace: 0.5, tone: 0.2, focus: 0.7, emotionalIntensity: 0.3, romanceLevel: 0.2, complexity: 0.4, worldbuildingDepth: 0.1, discussionPotential: 0.7 },
    }),
    createBook(prisma, {
      title: "Fourth Wing",
      author: "Rebecca Yarros",
      authors: ["Rebecca Yarros"],
      cover: "https://covers.openlibrary.org/b/id/12808718-L.jpg",
      description: "Twenty-year-old Violet Sorrengail was supposed to enter the Scribe Quadrant, until the commanding general — her mother — decides she should attend the brutal Riders Quadrant.",
      publishedAt: new Date("2023-05-02"),
      pageCount: 517,
      genres: ["Fantasy", "Romance", "Romantasy"],
      tags: ["dragons", "enemies to lovers", "war", "magic"],
      avgRating: 4.3,
      ratingsCount: 1231456,
      dimensions: { pace: 0.75, tone: 0.55, focus: 0.6, emotionalIntensity: 0.75, romanceLevel: 0.85, complexity: 0.5, worldbuildingDepth: 0.7, discussionPotential: 0.65 },
    }),
    createBook(prisma, {
      title: "Tomorrow, and Tomorrow, and Tomorrow",
      author: "Gabrielle Zevin",
      authors: ["Gabrielle Zevin"],
      cover: "https://covers.openlibrary.org/b/id/12808719-L.jpg",
      description: "A dazzling and immersive novel about three decades of friendship, art, grief, and love — through the lens of making video games.",
      publishedAt: new Date("2022-07-05"),
      pageCount: 403,
      genres: ["Literary Fiction", "Contemporary Fiction"],
      tags: ["friendship", "creativity", "video games", "grief", "art"],
      avgRating: 4.2,
      ratingsCount: 412876,
      dimensions: { pace: 0.4, tone: 0.5, focus: 0.9, emotionalIntensity: 0.75, romanceLevel: 0.3, complexity: 0.55, worldbuildingDepth: 0.1, discussionPotential: 0.85 },
    }),
    createBook(prisma, {
      title: "The Atlas Six",
      author: "Olivie Blake",
      authors: ["Olivie Blake"],
      cover: "https://covers.openlibrary.org/b/id/12008720-L.jpg",
      description: "Six of the world's most powerful magicians are invited to compete for a place in the Alexandrian Society, a secret society with access to lost knowledge.",
      publishedAt: new Date("2020-01-01"),
      pageCount: 448,
      genres: ["Dark Academia", "Fantasy"],
      tags: ["magic", "academia", "dark", "morally grey", "competition"],
      avgRating: 3.8,
      ratingsCount: 287631,
      dimensions: { pace: 0.5, tone: 0.8, focus: 0.7, emotionalIntensity: 0.7, romanceLevel: 0.3, complexity: 0.85, worldbuildingDepth: 0.6, discussionPotential: 0.9 },
    }),
    createBook(prisma, {
      title: "Beach Read",
      author: "Emily Henry",
      authors: ["Emily Henry"],
      cover: "https://covers.openlibrary.org/b/id/10521466-L.jpg",
      description: "A romance writer who no longer believes in love and a literary fiction writer in need of inspiration force themselves to swap genres for the summer.",
      publishedAt: new Date("2020-05-19"),
      pageCount: 352,
      genres: ["Romance", "Contemporary Romance"],
      tags: ["enemies to lovers", "summer", "writers", "beachy"],
      avgRating: 3.9,
      ratingsCount: 621873,
      dimensions: { pace: 0.6, tone: 0.2, focus: 0.85, emotionalIntensity: 0.5, romanceLevel: 0.9, complexity: 0.2, worldbuildingDepth: 0.0, discussionPotential: 0.5 },
    }),
    createBook(prisma, {
      title: "The Poppy War",
      author: "RF Kuang",
      authors: ["RF Kuang"],
      cover: "https://covers.openlibrary.org/b/id/8737139-L.jpg",
      description: "A young orphan girl wins a place at a prestigious military academy, where she discovers she possesses a mysterious power that could alter the course of history.",
      publishedAt: new Date("2018-05-01"),
      pageCount: 545,
      genres: ["Fantasy", "Grimdark", "Historical Fantasy"],
      tags: ["war", "dark", "colonialism", "opium", "China-inspired"],
      avgRating: 4.1,
      ratingsCount: 198761,
      dimensions: { pace: 0.6, tone: 0.95, focus: 0.65, emotionalIntensity: 0.95, romanceLevel: 0.15, complexity: 0.75, worldbuildingDepth: 0.8, discussionPotential: 0.85 },
    }),
    createBook(prisma, {
      title: "Mexican Gothic",
      author: "Silvia Moreno-Garcia",
      authors: ["Silvia Moreno-Garcia"],
      cover: "https://covers.openlibrary.org/b/id/10437061-L.jpg",
      description: "A socialite goes to rescue her cousin from a mysterious house in the Mexican countryside — and finds horrors older than she imagined.",
      publishedAt: new Date("2020-06-30"),
      pageCount: 301,
      genres: ["Gothic Horror", "Mystery", "Historical Fiction"],
      tags: ["gothic", "horror", "1950s Mexico", "fungi", "atmosphere"],
      avgRating: 4.0,
      ratingsCount: 234561,
      dimensions: { pace: 0.4, tone: 0.85, focus: 0.75, emotionalIntensity: 0.8, romanceLevel: 0.3, complexity: 0.6, worldbuildingDepth: 0.45, discussionPotential: 0.75 },
    }),
    createBook(prisma, {
      title: "Normal People",
      author: "Sally Rooney",
      authors: ["Sally Rooney"],
      cover: "https://covers.openlibrary.org/b/id/9282540-L.jpg",
      description: "Connell and Marianne grow up in the same small Irish town. When they meet again at university, their relationship transforms both their lives.",
      publishedAt: new Date("2018-08-30"),
      pageCount: 273,
      genres: ["Literary Fiction", "Contemporary Fiction", "Romance"],
      tags: ["relationships", "class", "Ireland", "university", "intimate"],
      avgRating: 3.8,
      ratingsCount: 821341,
      dimensions: { pace: 0.3, tone: 0.5, focus: 0.95, emotionalIntensity: 0.75, romanceLevel: 0.8, complexity: 0.45, worldbuildingDepth: 0.0, discussionPotential: 0.8 },
    }),
    createBook(prisma, {
      title: "Piranesi",
      author: "Susanna Clarke",
      authors: ["Susanna Clarke"],
      cover: "https://covers.openlibrary.org/b/id/10521467-L.jpg",
      description: "Piranesi lives in a House, which is also the World. Its halls are lined with statues, its lower floors are flooded by the tides. Then he discovers another person is also trapped.",
      publishedAt: new Date("2020-09-15"),
      pageCount: 272,
      genres: ["Fantasy", "Mystery"],
      tags: ["unique", "atmosphere", "puzzle", "labyrinth", "literary"],
      avgRating: 4.2,
      ratingsCount: 298761,
      dimensions: { pace: 0.35, tone: 0.6, focus: 0.75, emotionalIntensity: 0.6, romanceLevel: 0.05, complexity: 0.75, worldbuildingDepth: 0.85, discussionPotential: 0.95 },
    }),
    createBook(prisma, {
      title: "The Priory of the Orange Tree",
      author: "Samantha Shannon",
      authors: ["Samantha Shannon"],
      cover: "https://covers.openlibrary.org/b/id/8737140-L.jpg",
      description: "An epic standalone fantasy about a world on the brink of a cataclysm, three women determined to protect it, and a wyrm bent on its destruction.",
      publishedAt: new Date("2019-02-26"),
      pageCount: 848,
      genres: ["Fantasy", "Epic Fantasy"],
      tags: ["dragons", "female protagonists", "politics", "queer", "standalone"],
      avgRating: 4.0,
      ratingsCount: 176543,
      dimensions: { pace: 0.3, tone: 0.5, focus: 0.75, emotionalIntensity: 0.6, romanceLevel: 0.4, complexity: 0.9, worldbuildingDepth: 1.0, discussionPotential: 0.75 },
    }),
    createBook(prisma, {
      title: "Iron Flame",
      author: "Rebecca Yarros",
      authors: ["Rebecca Yarros"],
      cover: "https://covers.openlibrary.org/b/id/12808720-L.jpg",
      description: "The highly anticipated sequel to Fourth Wing — Violet Sorrengail's next chapter in the Riders Quadrant.",
      publishedAt: new Date("2023-11-07"),
      pageCount: 623,
      genres: ["Fantasy", "Romance", "Romantasy"],
      tags: ["dragons", "war", "magic academy", "enemies to lovers"],
      avgRating: 4.0,
      ratingsCount: 876234,
      dimensions: { pace: 0.75, tone: 0.55, focus: 0.6, emotionalIntensity: 0.75, romanceLevel: 0.85, complexity: 0.5, worldbuildingDepth: 0.7, discussionPotential: 0.65 },
    }),
  ]);

  // ── Users ───────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("password123", 10);

  const sarah = await upsertUser(prisma, {
    email: "sarah@folio.dev",
    name: "Sarah Chen",
    username: "sarahreads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    bio: "Fantasy and dark academia obsessed. Book club organiser. 📚",
    location: "London, UK",
    userType: "ORGANISER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const marcus = await upsertUser(prisma, {
    email: "marcus@folio.dev",
    name: "Marcus Williams",
    username: "marcusreads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
    bio: "Literary fiction devotee. I read to understand the world.",
    location: "New York, USA",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const luna = await upsertUser(prisma, {
    email: "luna@folio.dev",
    name: "Luna Park",
    username: "lunapark_reads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=luna",
    bio: "Dark academia aesthetic. Mystery obsessed. Night reader.",
    location: "Seoul, South Korea",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const james = await upsertUser(prisma, {
    email: "james@folio.dev",
    name: "James Okafor",
    username: "jamesokafor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=james",
    bio: "Sci-fi and thriller enthusiast. Reading at the speed of light ⚡",
    location: "Lagos, Nigeria",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const priya = await upsertUser(prisma, {
    email: "priya@folio.dev",
    name: "Priya Sharma",
    username: "priyareads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
    bio: "Romance and contemporary fiction lover. TBR pile height: alarming 💕",
    location: "Mumbai, India",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const alex = await upsertUser(prisma, {
    email: "alex@folio.dev",
    name: "Alex Rivera",
    username: "alexrivera",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    bio: "Epic fantasy is life. Map appreciator. Lore enthusiast.",
    location: "Madrid, Spain",
    userType: "ORGANISER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const elena = await upsertUser(prisma, {
    email: "elena@folio.dev",
    name: "Elena Vasquez",
    username: "elenareads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=elena",
    bio: "Slow reader, deep feeler. Literary fiction and historical fiction.",
    location: "Buenos Aires, Argentina",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  // Current user (test account)
  const currentUser = await upsertUser(prisma, {
    email: "stormbreaker128@gmail.com",
    name: "Connor",
    username: "connor_reads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=connor",
    bio: "Currently building Folio 🚀 Loves fantasy and literary fiction.",
    location: "Online",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const allUsers = [sarah, marcus, luna, james, priya, alex, elena, currentUser];

  // ── Book indices for easy access ─────────────────────────────────────────
  const notw = books[0]!;     // Name of the Wind
  const soc = books[1]!;      // Six of Crows
  const cerulean = books[2]!; // House in Cerulean Sea
  const littleLife = books[3]!;
  const evelyn = books[4]!;
  const hailMary = books[5]!;
  const midnight = books[6]!;
  const pachinko = books[7]!;
  const thursday = books[8]!;
  const fourthWing = books[9]!;
  const tomorrow = books[10]!;
  const atlasSix = books[11]!;
  const beachRead = books[12]!;
  const poppyWar = books[13]!;
  const mexicanGothic = books[14]!;
  const normalPeople = books[15]!;
  const piranesi = books[16]!;
  const priory = books[17]!;
  const ironFlame = books[18]!;

  // ── User Libraries ────────────────────────────────────────────────────────
  // Sarah - fantasy/dark academia
  await addBooksToLibrary(prisma, sarah.id, [
    { book: notw, status: "READ", rating: 5 },
    { book: soc, status: "READ", rating: 5 },
    { book: atlasSix, status: "READ", rating: 4 },
    { book: poppyWar, status: "READ", rating: 4 },
    { book: priory, status: "READ", rating: 4 },
    { book: piranesi, status: "READ", rating: 5 },
    { book: mexicanGothic, status: "READ", rating: 4 },
    { book: fourthWing, status: "CURRENTLY_READING", progress: 210 },
    { book: littleLife, status: "WANT_TO_READ", rating: null },
    { book: beachRead, status: "ABANDONED" },
  ]);

  // Marcus - literary fiction
  await addBooksToLibrary(prisma, marcus.id, [
    { book: littleLife, status: "READ", rating: 5 },
    { book: pachinko, status: "READ", rating: 5 },
    { book: tomorrow, status: "READ", rating: 4 },
    { book: normalPeople, status: "READ", rating: 4 },
    { book: evelyn, status: "READ", rating: 4 },
    { book: midnight, status: "READ", rating: 3 },
    { book: piranesi, status: "READ", rating: 4 },
    { book: notw, status: "ABANDONED" },
    { book: fourthWing, status: "WANT_TO_READ" },
  ]);

  // Luna - dark academia/mystery
  await addBooksToLibrary(prisma, luna.id, [
    { book: atlasSix, status: "READ", rating: 5 },
    { book: mexicanGothic, status: "READ", rating: 5 },
    { book: poppyWar, status: "READ", rating: 4 },
    { book: thursday, status: "READ", rating: 4 },
    { book: piranesi, status: "READ", rating: 5 },
    { book: soc, status: "READ", rating: 4 },
    { book: pachinko, status: "CURRENTLY_READING", progress: 180 },
    { book: notw, status: "WANT_TO_READ" },
    { book: beachRead, status: "ABANDONED" },
  ]);

  // James - sci-fi/thriller
  await addBooksToLibrary(prisma, james.id, [
    { book: hailMary, status: "READ", rating: 5 },
    { book: thursday, status: "READ", rating: 4 },
    { book: soc, status: "READ", rating: 4 },
    { book: poppyWar, status: "READ", rating: 3 },
    { book: notw, status: "READ", rating: 3 },
    { book: midnight, status: "READ", rating: 3 },
    { book: atlasSix, status: "WANT_TO_READ" },
    { book: tomorrow, status: "CURRENTLY_READING", progress: 120 },
    { book: normalPeople, status: "ABANDONED" },
  ]);

  // Priya - romance/contemporary
  await addBooksToLibrary(prisma, priya.id, [
    { book: evelyn, status: "READ", rating: 5 },
    { book: fourthWing, status: "READ", rating: 5 },
    { book: ironFlame, status: "READ", rating: 4 },
    { book: beachRead, status: "READ", rating: 4 },
    { book: cerulean, status: "READ", rating: 5 },
    { book: normalPeople, status: "READ", rating: 4 },
    { book: midnight, status: "READ", rating: 3 },
    { book: tomorrow, status: "CURRENTLY_READING", progress: 200 },
    { book: pachinko, status: "WANT_TO_READ" },
    { book: poppyWar, status: "ABANDONED" },
  ]);

  // Alex - epic fantasy
  await addBooksToLibrary(prisma, alex.id, [
    { book: notw, status: "READ", rating: 5 },
    { book: priory, status: "READ", rating: 5 },
    { book: poppyWar, status: "READ", rating: 5 },
    { book: soc, status: "READ", rating: 4 },
    { book: fourthWing, status: "READ", rating: 4 },
    { book: ironFlame, status: "READ", rating: 4 },
    { book: atlasSix, status: "READ", rating: 3 },
    { book: piranesi, status: "CURRENTLY_READING", progress: 100 },
    { book: littleLife, status: "WANT_TO_READ" },
    { book: beachRead, status: "ABANDONED" },
  ]);

  // Elena - literary fiction/historical
  await addBooksToLibrary(prisma, elena.id, [
    { book: pachinko, status: "READ", rating: 5 },
    { book: littleLife, status: "READ", rating: 5 },
    { book: evelyn, status: "READ", rating: 4 },
    { book: tomorrow, status: "READ", rating: 5 },
    { book: normalPeople, status: "READ", rating: 4 },
    { book: midnight, status: "READ", rating: 3 },
    { book: piranesi, status: "READ", rating: 4 },
    { book: notw, status: "WANT_TO_READ" },
    { book: cerulean, status: "CURRENTLY_READING", progress: 150 },
  ]);

  // Connor (current user) - mixed
  await addBooksToLibrary(prisma, currentUser.id, [
    { book: notw, status: "READ", rating: 5 },
    { book: soc, status: "READ", rating: 5 },
    { book: piranesi, status: "READ", rating: 4 },
    { book: poppyWar, status: "READ", rating: 4 },
    { book: hailMary, status: "READ", rating: 5 },
    { book: tomorrow, status: "READ", rating: 4 },
    { book: fourthWing, status: "CURRENTLY_READING", progress: 180 },
    { book: atlasSix, status: "WANT_TO_READ" },
    { book: littleLife, status: "WANT_TO_READ" },
    { book: pachinko, status: "WANT_TO_READ" },
  ]);

  // ── Taste Profiles ────────────────────────────────────────────────────────
  await upsertTasteProfile(prisma, sarah.id, {
    topGenres: ["Fantasy", "Dark Academia", "Gothic Horror"],
    topAuthors: ["Leigh Bardugo", "Olivie Blake", "Patrick Rothfuss"],
    topThemes: ["magic", "academia", "mystery", "dark atmosphere"],
    topMoods: ["immersive", "atmospheric", "intense"],
    pace: 0.55, tone: 0.72, focus: 0.72, emotionalIntensity: 0.72,
    romanceLevel: 0.35, complexity: 0.78, worldbuildingDepth: 0.78, discussionPotential: 0.82,
    cluster: "dark_academia",
    dislikedGenres: ["Romance", "Contemporary Romance"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, marcus.id, {
    topGenres: ["Literary Fiction", "Contemporary Fiction", "Historical Fiction"],
    topAuthors: ["Hanya Yanagihara", "Min Jin Lee", "Gabrielle Zevin"],
    topThemes: ["identity", "grief", "friendship", "society"],
    topMoods: ["contemplative", "emotional", "literary"],
    pace: 0.25, tone: 0.64, focus: 0.92, emotionalIntensity: 0.86,
    romanceLevel: 0.36, complexity: 0.6, worldbuildingDepth: 0.1, discussionPotential: 0.92,
    cluster: "literary_fiction",
    dislikedGenres: ["Epic Fantasy", "Romantasy"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, luna.id, {
    topGenres: ["Dark Academia", "Mystery", "Gothic Horror"],
    topAuthors: ["Olivie Blake", "Silvia Moreno-Garcia", "Susanna Clarke"],
    topThemes: ["academia", "secrets", "atmosphere", "the macabre"],
    topMoods: ["atmospheric", "tense", "intellectual"],
    pace: 0.46, tone: 0.82, focus: 0.72, emotionalIntensity: 0.72,
    romanceLevel: 0.2, complexity: 0.78, worldbuildingDepth: 0.62, discussionPotential: 0.88,
    cluster: "dark_academia",
    dislikedGenres: ["Contemporary Romance"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, james.id, {
    topGenres: ["Science Fiction", "Thriller", "Mystery"],
    topAuthors: ["Andy Weir", "Richard Osman"],
    topThemes: ["science", "puzzles", "adventure", "problem-solving"],
    topMoods: ["fast-paced", "exciting", "curious"],
    pace: 0.72, tone: 0.35, focus: 0.62, emotionalIntensity: 0.5,
    romanceLevel: 0.15, complexity: 0.65, worldbuildingDepth: 0.72, discussionPotential: 0.72,
    cluster: "thriller_reader",
    dislikedGenres: ["Romance", "Literary Fiction"],
    confidence: "MEDIUM" as const,
  });

  await upsertTasteProfile(prisma, priya.id, {
    topGenres: ["Romance", "Contemporary Romance", "Romantasy"],
    topAuthors: ["Taylor Jenkins Reid", "Rebecca Yarros", "Emily Henry"],
    topThemes: ["love", "ambition", "chosen one", "healing"],
    topMoods: ["romantic", "emotional", "feel-good"],
    pace: 0.62, tone: 0.35, focus: 0.82, emotionalIntensity: 0.7,
    romanceLevel: 0.82, complexity: 0.38, worldbuildingDepth: 0.3, discussionPotential: 0.62,
    cluster: "cozy_romance",
    dislikedGenres: ["Grimdark", "Horror"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, alex.id, {
    topGenres: ["Epic Fantasy", "Fantasy", "Romantasy"],
    topAuthors: ["Patrick Rothfuss", "Samantha Shannon", "Rebecca Yarros"],
    topThemes: ["magic systems", "world-building", "war", "dragons"],
    topMoods: ["epic", "immersive", "adventurous"],
    pace: 0.5, tone: 0.58, focus: 0.72, emotionalIntensity: 0.68,
    romanceLevel: 0.5, complexity: 0.82, worldbuildingDepth: 0.92, discussionPotential: 0.72,
    cluster: "epic_fantasy",
    dislikedGenres: ["Contemporary Romance", "Cozy Mystery"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, elena.id, {
    topGenres: ["Literary Fiction", "Historical Fiction", "Contemporary Fiction"],
    topAuthors: ["Min Jin Lee", "Hanya Yanagihara", "Gabrielle Zevin"],
    topThemes: ["family", "history", "identity", "memory"],
    topMoods: ["contemplative", "emotional", "rich"],
    pace: 0.26, tone: 0.64, focus: 0.9, emotionalIntensity: 0.82,
    romanceLevel: 0.38, complexity: 0.58, worldbuildingDepth: 0.12, discussionPotential: 0.9,
    cluster: "literary_fiction",
    dislikedGenres: ["Thriller", "Horror"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, currentUser.id, {
    topGenres: ["Fantasy", "Science Fiction", "Literary Fiction"],
    topAuthors: ["Patrick Rothfuss", "Leigh Bardugo", "Andy Weir"],
    topThemes: ["magic", "adventure", "character-driven", "world-building"],
    topMoods: ["immersive", "exciting", "thoughtful"],
    pace: 0.58, tone: 0.55, focus: 0.75, emotionalIntensity: 0.65,
    romanceLevel: 0.3, complexity: 0.72, worldbuildingDepth: 0.8, discussionPotential: 0.78,
    cluster: "epic_fantasy",
    dislikedGenres: ["Contemporary Romance"],
    confidence: "HIGH" as const,
  });

  // ── User Scores ───────────────────────────────────────────────────────────
  await prisma.userScore.upsert({
    where: { userId: sarah.id },
    update: {},
    create: { userId: sarah.id, totalPoints: 1240, streakDays: 14, lastReadAt: new Date(Date.now() - 86400000) },
  });
  await prisma.userScore.upsert({
    where: { userId: marcus.id },
    update: {},
    create: { userId: marcus.id, totalPoints: 980, streakDays: 7, lastReadAt: new Date(Date.now() - 86400000 * 2) },
  });
  await prisma.userScore.upsert({
    where: { userId: luna.id },
    update: {},
    create: { userId: luna.id, totalPoints: 1450, streakDays: 21, lastReadAt: new Date(Date.now() - 3600000) },
  });
  await prisma.userScore.upsert({
    where: { userId: james.id },
    update: {},
    create: { userId: james.id, totalPoints: 720, streakDays: 3, lastReadAt: new Date(Date.now() - 86400000 * 3) },
  });
  await prisma.userScore.upsert({
    where: { userId: priya.id },
    update: {},
    create: { userId: priya.id, totalPoints: 1620, streakDays: 30, lastReadAt: new Date() },
  });
  await prisma.userScore.upsert({
    where: { userId: alex.id },
    update: {},
    create: { userId: alex.id, totalPoints: 890, streakDays: 5, lastReadAt: new Date(Date.now() - 86400000) },
  });
  await prisma.userScore.upsert({
    where: { userId: currentUser.id },
    update: {},
    create: { userId: currentUser.id, totalPoints: 340, streakDays: 2, lastReadAt: new Date() },
  });

  // ── Reviews ───────────────────────────────────────────────────────────────
  await upsertReview(prisma, sarah.id, notw.id, 5, "An absolute masterpiece. Rothfuss writes with the precision of a poet and the heart of a storyteller. Kvothe's voice is unforgettable.");
  await upsertReview(prisma, sarah.id, soc.id, 5, "The found family. The heist. The tension. Six of Crows does everything perfectly. Kaz Brekker is criminally compelling.");
  await upsertReview(prisma, sarah.id, atlasSix.id, 4, "Dark academia at its finest. The prose is dense but rewarding — every character has secrets. Perfect for long nights with tea.");
  await upsertReview(prisma, marcus.id, littleLife.id, 5, "The most devastatingly beautiful book I have ever read. It broke me and put me back together differently. Everyone should read this.");
  await upsertReview(prisma, marcus.id, pachinko.id, 5, "Multigenerational saga done perfectly. Min Jin Lee captures the quiet tragedy of immigrant identity with such grace and precision.");
  await upsertReview(prisma, luna.id, atlasSix.id, 5, "This is my roman empire. Morally grey characters, devastating philosophy, atmosphere that drips off every page. Reread immediately.");
  await upsertReview(prisma, luna.id, mexicanGothic.id, 5, "Gothic masterpiece. The atmosphere is suffocating in the best way. Noemí is an incredible protagonist and the house is terrifying.");
  await upsertReview(prisma, james.id, hailMary.id, 5, "The most fun I have had reading science fiction in years. Rocky and Ryland's friendship made me ugly cry. Pure joy.");
  await upsertReview(prisma, priya.id, evelyn.id, 5, "My all-time favourite. The structure is genius, the love story is heartbreaking, and Evelyn Hugo is one of fiction's greatest characters.");
  await upsertReview(prisma, priya.id, fourthWing.id, 5, "I know it is not literary fiction but I do not care. Violet and Xaden set my brain on fire. Perfect romantasy.");
  await upsertReview(prisma, alex.id, notw.id, 5, "The world-building in Kingkiller Chronicle is unmatched. The University, the Adem, the Fae — Rothfuss built something astonishing.");
  await upsertReview(prisma, alex.id, priory.id, 5, "The most ambitious standalone fantasy. Samantha Shannon built an entire world, mythology, and three distinct storylines. Stunning achievement.");
  await upsertReview(prisma, elena.id, pachinko.id, 5, "I think about this book constantly. The intersection of history, identity, and family over generations. Min Jin Lee is a genius.");
  await upsertReview(prisma, elena.id, tomorrow.id, 5, "Gabrielle Zevin writes about friendship and art with such tenderness. Tomorrow is not about video games — it is about everything that matters.");
  await upsertReview(prisma, currentUser.id, notw.id, 5, "My favourite book of all time. The prose is music. Kvothe's story is all myth and memory. I think about this book every single day.");
  await upsertReview(prisma, currentUser.id, soc.id, 5, "Six of Crows is the gold standard for ensemble fantasy. The heist plotting is meticulous. I care so deeply about every single character.");

  // ── Reading Sessions ──────────────────────────────────────────────────────
  const now = new Date();
  const day = 86400000;

  for (const user of [sarah, luna, currentUser]) {
    for (let i = 0; i < 14; i++) {
      await prisma.readingSession.create({
        data: {
          userId: user.id,
          bookId: fourthWing.id,
          date: new Date(now.getTime() - i * day),
          pagesRead: Math.floor(Math.random() * 30) + 10,
          minutesRead: Math.floor(Math.random() * 60) + 20,
        },
      });
    }
  }

  // ── Clubs ─────────────────────────────────────────────────────────────────
  const dragonClub = await upsertClub(prisma, {
    name: "The Dragon's Bookshelf",
    description: "A passionate community of epic fantasy readers. We love intricate magic systems, complex world-building, and sprawling multi-book sagas. Monthly reads with weekly discussion threads.",
    ownerId: alex.id,
    genres: ["Fantasy", "Epic Fantasy"],
    themes: ["magic", "dragons", "world-building", "adventure"],
    isOnline: true,
    meetingCadence: "monthly",
    membershipType: "OPEN" as const,
    currentBookId: priory.id,
    upcomingBookId: notw.id,
  });

  const literaryMinds = await upsertClub(prisma, {
    name: "Literary Minds",
    description: "A thoughtful book club for lovers of literary and contemporary fiction. We read deeply, discuss widely, and value prose quality and thematic depth above all.",
    ownerId: marcus.id,
    genres: ["Literary Fiction", "Contemporary Fiction", "Historical Fiction"],
    themes: ["identity", "society", "family", "grief"],
    isOnline: false,
    location: "New York, USA",
    meetingCadence: "monthly",
    membershipType: "APPLICATION" as const,
    currentBookId: pachinko.id,
    upcomingBookId: tomorrow.id,
  });

  const cozyReaders = await upsertClub(prisma, {
    name: "The Cozy Corner",
    description: "For readers who love their books warm, their vibes immaculate, and their endings happy. Cozy fantasy, feel-good romance, and gentle mysteries welcome.",
    ownerId: priya.id,
    genres: ["Romance", "Cozy Fantasy", "Cozy Mystery"],
    themes: ["found family", "love", "community", "comfort"],
    isOnline: true,
    meetingCadence: "biweekly",
    membershipType: "OPEN" as const,
    currentBookId: cerulean.id,
    upcomingBookId: beachRead.id,
  });

  const darkAcademySociety = await upsertClub(prisma, {
    name: "Dark Academia Society",
    description: "Aesthetes, scholars, and lovers of the macabre. We read dark academia, gothic fiction, atmospheric mysteries, and morally complicated literary fiction.",
    ownerId: sarah.id,
    genres: ["Dark Academia", "Gothic", "Mystery", "Literary Fiction"],
    themes: ["academia", "power", "knowledge", "the macabre"],
    isOnline: true,
    meetingCadence: "biweekly",
    membershipType: "APPLICATION" as const,
    currentBookId: atlasSix.id,
    upcomingBookId: mexicanGothic.id,
  });

  const scifiCollective = await upsertClub(prisma, {
    name: "The Sci-Fi Collective",
    description: "We explore the stars, bend time, and argue about whether the science checks out. Science fiction from classic to contemporary.",
    ownerId: james.id,
    genres: ["Science Fiction", "Space Opera", "Hard Sci-Fi"],
    themes: ["space", "technology", "first contact", "future"],
    isOnline: true,
    meetingCadence: "biweekly",
    membershipType: "OPEN" as const,
    currentBookId: hailMary.id,
    upcomingBookId: null,
  });

  // ── Club Members ──────────────────────────────────────────────────────────
  await addClubMembers(prisma, dragonClub.id, [
    { userId: alex.id, role: "OWNER" as ClubRole },
    { userId: sarah.id, role: "ORGANISER" as ClubRole },
    { userId: luna.id, role: "MEMBER" as ClubRole },
    { userId: currentUser.id, role: "MEMBER" as ClubRole },
    { userId: james.id, role: "MEMBER" as ClubRole },
  ]);

  await addClubMembers(prisma, literaryMinds.id, [
    { userId: marcus.id, role: "OWNER" as ClubRole },
    { userId: elena.id, role: "ORGANISER" as ClubRole },
    { userId: priya.id, role: "MEMBER" as ClubRole },
  ]);

  await addClubMembers(prisma, cozyReaders.id, [
    { userId: priya.id, role: "OWNER" as ClubRole },
    { userId: cerulean && currentUser ? currentUser.id : currentUser.id, role: "MEMBER" as ClubRole },
    { userId: elena.id, role: "MEMBER" as ClubRole },
    { userId: marcus.id, role: "MEMBER" as ClubRole },
  ]);

  await addClubMembers(prisma, darkAcademySociety.id, [
    { userId: sarah.id, role: "OWNER" as ClubRole },
    { userId: luna.id, role: "ORGANISER" as ClubRole },
    { userId: alex.id, role: "MEMBER" as ClubRole },
    { userId: currentUser.id, role: "MEMBER" as ClubRole },
  ]);

  await addClubMembers(prisma, scifiCollective.id, [
    { userId: james.id, role: "OWNER" as ClubRole },
    { userId: currentUser.id, role: "MEMBER" as ClubRole },
    { userId: marcus.id, role: "MEMBER" as ClubRole },
  ]);

  // ── Club Reading History ──────────────────────────────────────────────────
  await prisma.clubReadingHistory.createMany({
    skipDuplicates: true,
    data: [
      { clubId: dragonClub.id, bookId: soc.id, startedAt: new Date("2024-10-01"), finishedAt: new Date("2024-10-31"), avgRating: 4.6 },
      { clubId: dragonClub.id, bookId: poppyWar.id, startedAt: new Date("2024-11-01"), finishedAt: new Date("2024-11-30"), avgRating: 4.2 },
      { clubId: dragonClub.id, bookId: ironFlame.id, startedAt: new Date("2024-12-01"), finishedAt: new Date("2024-12-31"), avgRating: 4.0 },
      { clubId: literaryMinds.id, bookId: littleLife.id, startedAt: new Date("2024-10-01"), finishedAt: new Date("2024-10-31"), avgRating: 4.8 },
      { clubId: literaryMinds.id, bookId: tomorrow.id, startedAt: new Date("2024-11-01"), finishedAt: new Date("2024-11-30"), avgRating: 4.3 },
      { clubId: darkAcademySociety.id, bookId: piranesi.id, startedAt: new Date("2024-11-01"), finishedAt: new Date("2024-11-30"), avgRating: 4.7 },
      { clubId: darkAcademySociety.id, bookId: mexicanGothic.id, startedAt: new Date("2024-12-01"), finishedAt: new Date("2024-12-31"), avgRating: 4.4 },
    ],
  });

  // ── Club Posts ────────────────────────────────────────────────────────────
  await prisma.clubPost.createMany({
    skipDuplicates: true,
    data: [
      {
        clubId: darkAcademySociety.id,
        authorId: sarah.id,
        title: "📚 This Month: The Atlas Six",
        content: "Welcome to our February read! The Atlas Six is peak dark academia — six morally grey magicians competing for a place in a secret society. Discussion questions posted below. Reminder: spoilers allowed after the 15th!",
        isPinned: true,
      },
      {
        clubId: darkAcademySociety.id,
        authorId: luna.id,
        title: "Callum vs. Parisa: Who is the real villain?",
        content: "I cannot stop thinking about this. Callum manipulates emotions, Parisa manipulates thoughts — but which power is more corrosive? I think Callum is more dangerous because he doesn't need to try.",
        isPinned: false,
      },
      {
        clubId: dragonClub.id,
        authorId: alex.id,
        title: "🐉 February Read: The Priory of the Orange Tree",
        content: "This month we're tackling Samantha Shannon's epic standalone. At 848 pages it's a commitment — but the world-building and the female-led cast are extraordinary. See you at the discussion on the 28th!",
        isPinned: true,
      },
      {
        clubId: literaryMinds.id,
        authorId: marcus.id,
        title: "Pachinko Discussion — February",
        content: "Min Jin Lee said she wanted to write about 'the burden of belonging' — did she succeed? I would argue Pachinko is the most important novel about the immigrant experience in decades.",
        isPinned: true,
      },
    ],
  });

  // ── Club Polls ────────────────────────────────────────────────────────────
  const dragonPoll = await prisma.clubPoll.create({
    data: {
      clubId: dragonClub.id,
      title: "Vote: What should we read in March?",
      description: "Three options based on our club taste profile. Vote by the 20th!",
      status: PollStatus.ACTIVE,
      voteMode: "SINGLE",
      resultsVisible: false,
      endsAt: new Date(now.getTime() + 7 * day),
    },
  });

  const dragonOpts = await prisma.clubPollOption.createMany({
    data: [
      { pollId: dragonPoll.id, bookId: fourthWing.id, label: "Fourth Wing", matchScore: 87, matchReasons: ["9 members enjoy romantasy", "Strong world-building matches club taste", "High re-read discussions potential"] },
      { pollId: dragonPoll.id, bookId: poppyWar.id, label: "The Poppy War (re-read)", matchScore: 82, matchReasons: ["7 members rated it 4-5 stars", "Grimdark fantasy is in club DNA", "Excellent discussion material"] },
      { pollId: dragonPoll.id, bookId: atlasSix.id, label: "The Atlas Six", matchScore: 74, matchReasons: ["Dark and complex matches tone", "7 members haven't read it yet", "High discussion potential"] },
    ],
  });

  // ── Reading Challenges ────────────────────────────────────────────────────
  const marchChallenge = await prisma.readingChallenge.create({
    data: {
      title: "Dragon's Bookshelf March Sprint",
      description: "Finish The Priory of the Orange Tree before the end of March. All 848 pages. You got this.",
      type: ChallengeType.FASTEST_FINISH,
      creatorId: alex.id,
      clubId: dragonClub.id,
      bookId: priory.id,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-31"),
      isPublic: true,
    },
  });

  const globalPageChallenge = await prisma.readingChallenge.create({
    data: {
      title: "April Pages Challenge",
      description: "Who can read the most pages in April? Global leaderboard — everyone welcome!",
      type: ChallengeType.MOST_PAGES_WEEK,
      creatorId: priya.id,
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-04-30"),
      target: 1000,
      isPublic: true,
    },
  });

  await prisma.challengeParticipant.createMany({
    skipDuplicates: true,
    data: [
      { challengeId: marchChallenge.id, userId: alex.id, progress: 848 },
      { challengeId: marchChallenge.id, userId: sarah.id, progress: 620 },
      { challengeId: marchChallenge.id, userId: luna.id, progress: 440 },
      { challengeId: marchChallenge.id, userId: currentUser.id, progress: 210 },
      { challengeId: globalPageChallenge.id, userId: priya.id, progress: 876 },
      { challengeId: globalPageChallenge.id, userId: luna.id, progress: 743 },
      { challengeId: globalPageChallenge.id, userId: sarah.id, progress: 621 },
      { challengeId: globalPageChallenge.id, userId: marcus.id, progress: 590 },
      { challengeId: globalPageChallenge.id, userId: currentUser.id, progress: 412 },
      { challengeId: globalPageChallenge.id, userId: alex.id, progress: 380 },
      { challengeId: globalPageChallenge.id, userId: james.id, progress: 298 },
    ],
  });

  // ── Follows ───────────────────────────────────────────────────────────────
  const followPairs = [
    [currentUser.id, sarah.id],
    [currentUser.id, luna.id],
    [currentUser.id, marcus.id],
    [currentUser.id, alex.id],
    [sarah.id, luna.id],
    [sarah.id, alex.id],
    [marcus.id, elena.id],
    [luna.id, sarah.id],
    [priya.id, currentUser.id],
    [james.id, currentUser.id],
  ];

  for (const [followerId, followingId] of followPairs) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: followerId!, followingId: followingId! } },
      update: {},
      create: { followerId: followerId!, followingId: followingId! },
    });
  }

  // ── User Achievements ─────────────────────────────────────────────────────
  await prisma.userAchievement.createMany({
    skipDuplicates: true,
    data: [
      { userId: sarah.id, achievementId: achievements[0]!.id },
      { userId: sarah.id, achievementId: achievements[1]!.id },
      { userId: sarah.id, achievementId: achievements[3]!.id },
      { userId: sarah.id, achievementId: achievements[4]!.id },
      { userId: luna.id, achievementId: achievements[0]!.id },
      { userId: luna.id, achievementId: achievements[1]!.id },
      { userId: luna.id, achievementId: achievements[5]!.id },
      { userId: luna.id, achievementId: achievements[6]!.id },
      { userId: priya.id, achievementId: achievements[0]!.id },
      { userId: priya.id, achievementId: achievements[1]!.id },
      { userId: priya.id, achievementId: achievements[7]!.id },
      { userId: currentUser.id, achievementId: achievements[0]!.id },
    ],
  });

  // ── Onboarding Data ───────────────────────────────────────────────────────
  await prisma.onboardingData.upsert({
    where: { userId: currentUser.id },
    update: {},
    create: {
      userId: currentUser.id,
      favoriteGenres: ["Fantasy", "Science Fiction", "Literary Fiction"],
      favoriteBookIds: [notw.id, soc.id, hailMary.id],
      dislikedBookIds: [],
      favoriteAuthors: ["Patrick Rothfuss", "Leigh Bardugo"],
      preferredMoods: ["immersive", "character-driven"],
      preferredThemes: ["magic", "adventure", "friendship"],
      readingGoalBooksPerYear: 24,
      clubPreference: "online",
      interestedInClubs: true,
      interestedInChallenges: true,
      userType: "READER" as const,
      completedAt: new Date(),
    },
  });

  console.log("✅ Folio database seeded successfully!");
  console.log(`  📚 ${books.length} books`);
  console.log(`  👤 ${allUsers.length} users`);
  console.log(`  🏛️  5 clubs`);
  console.log(`  🏆 ${achievements.length} achievements`);
  console.log(`  🌱 5 taste clusters`);
}

// ── Helper functions ─────────────────────────────────────────────────────────

async function createBook(
  prisma: PrismaClient,
  data: {
    title: string; author: string; authors: string[]; cover?: string;
    description?: string; publishedAt?: Date; pageCount?: number;
    genres: string[]; tags: string[]; avgRating?: number; ratingsCount?: number;
    dimensions: {
      pace: number; tone: number; focus: number; emotionalIntensity: number;
      romanceLevel: number; complexity: number; worldbuildingDepth: number;
      discussionPotential: number;
    };
  }
) {
  const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const book = await prisma.book.upsert({
    where: { isbn: slug },
    update: {},
    create: {
      title: data.title,
      author: data.author,
      authors: data.authors,
      cover: data.cover,
      description: data.description,
      publishedAt: data.publishedAt,
      pageCount: data.pageCount,
      genres: data.genres,
      tags: data.tags,
      avgRating: data.avgRating,
      ratingsCount: data.ratingsCount ?? 0,
      isbn: slug,
    },
  });
  await prisma.bookTasteDimension.upsert({
    where: { bookId: book.id },
    update: {},
    create: { bookId: book.id, ...data.dimensions },
  });
  return book;
}

async function upsertUser(
  prisma: PrismaClient,
  data: {
    email: string; name: string; username: string; avatar?: string;
    bio?: string; location?: string; userType: "READER" | "ORGANISER" | "MEMBER" | "INFLUENCER";
    passwordHash: string; onboarded: boolean;
  }
) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: {},
    create: data,
  });
}

async function addBooksToLibrary(
  prisma: PrismaClient,
  userId: string,
  entries: Array<{ book: { id: string }; status: string; rating?: number | null; progress?: number }>
) {
  for (const entry of entries) {
    await prisma.userBook.upsert({
      where: { userId_bookId: { userId, bookId: entry.book.id } },
      update: {},
      create: {
        userId,
        bookId: entry.book.id,
        status: entry.status as ReadingStatus,
        rating: entry.rating ?? null,
        progress: entry.progress ?? 0,
        startedAt: entry.status === "CURRENTLY_READING" ? new Date(Date.now() - 14 * 86400000) : undefined,
        finishedAt: entry.status === "READ" ? new Date(Date.now() - Math.floor(Math.random() * 90) * 86400000) : undefined,
      },
    });
  }
}

async function upsertTasteProfile(
  prisma: PrismaClient,
  userId: string,
  data: {
    topGenres: string[]; topAuthors: string[]; topThemes: string[]; topMoods: string[];
    pace: number; tone: number; focus: number; emotionalIntensity: number;
    romanceLevel: number; complexity: number; worldbuildingDepth: number; discussionPotential: number;
    cluster?: string; dislikedGenres: string[];
    confidence: "LOW" | "MEDIUM" | "HIGH";
  }
) {
  return prisma.tasteProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      topGenres: data.topGenres,
      topAuthors: data.topAuthors,
      topThemes: data.topThemes,
      topMoods: data.topMoods,
      pace: data.pace,
      tone: data.tone,
      focus: data.focus,
      emotionalIntensity: data.emotionalIntensity,
      romanceLevel: data.romanceLevel,
      complexity: data.complexity,
      worldbuildingDepth: data.worldbuildingDepth,
      discussionPotential: data.discussionPotential,
      cluster: data.cluster,
      dislikedGenres: data.dislikedGenres,
      dislikedThemes: [],
      dislikedAuthors: [],
      confidence: data.confidence,
      lastCalculated: new Date(),
    },
  });
}

async function upsertReview(
  prisma: PrismaClient,
  userId: string,
  bookId: string,
  rating: number,
  content: string
) {
  return prisma.review.upsert({
    where: { userId_bookId: { userId, bookId } },
    update: {},
    create: { userId, bookId, rating, content, isPublic: true },
  });
}

async function upsertClub(
  prisma: PrismaClient,
  data: {
    name: string; description: string; ownerId: string; genres: string[];
    themes: string[]; isOnline: boolean; location?: string; meetingCadence: string;
    membershipType: "OPEN" | "APPLICATION" | "PRIVATE";
    currentBookId?: string | null; upcomingBookId?: string | null;
  }
) {
  const existing = await prisma.club.findFirst({ where: { name: data.name } });
  if (existing) return existing;
  return prisma.club.create({
    data: {
      name: data.name,
      description: data.description,
      ownerId: data.ownerId,
      genres: data.genres,
      themes: data.themes,
      isOnline: data.isOnline,
      location: data.location,
      meetingCadence: data.meetingCadence,
      membershipType: data.membershipType,
      currentBookId: data.currentBookId,
      upcomingBookId: data.upcomingBookId,
    },
  });
}

async function addClubMembers(
  prisma: PrismaClient,
  clubId: string,
  members: Array<{ userId: string; role: ClubRole }>
) {
  for (const member of members) {
    await prisma.clubMember.upsert({
      where: { clubId_userId: { clubId, userId: member.userId } },
      update: {},
      create: { clubId, userId: member.userId, role: member.role },
    });
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add comprehensive seed data (20 books, 8 users, 5 clubs, challenges)"
```

---

### Task 7: Run the seed

**Files:** No new files — populates the database.

- [ ] **Step 1: Run seed**

```bash
npx prisma db seed
```

Expected output:
```
🌱 Seeding Folio database...
✅ Folio database seeded successfully!
  📚 20 books
  👤 8 users
  🏛️  5 clubs
  🏆 8 achievements
  🌱 5 taste clusters
```

- [ ] **Step 2: Verify in Prisma Studio**

```bash
npx prisma studio
```

Navigate to User model — should show 8 users. Book model — 20 books. Club — 5 clubs. Press Ctrl+C.

---

### Task 8: Configure NextAuth

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Modify: `.env`

- [ ] **Step 1: Create `lib/auth.ts`**

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
    newUser: "/onboarding",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.passwordHash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          username: user.username,
          onboarded: user.onboarded,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.onboarded = (user as any).onboarded;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.onboarded = token.onboarded as boolean;
      }
      return session;
    },
  },
};
```

- [ ] **Step 2: Create `app/api/auth/[...nextauth]/route.ts`**

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 3: Create `types/next-auth.d.ts` to extend session types**

Create the file `types/next-auth.d.ts`:

```typescript
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      onboarded: boolean;
    } & DefaultSession["user"];
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/auth.ts app/api/ types/
git commit -m "feat: configure NextAuth with credentials provider and JWT session"
```

---

### Task 9: Create auth helpers and route protection

**Files:**
- Create: `lib/auth-helpers.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Create `lib/auth-helpers.ts`**

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

export async function requireOnboarding() {
  const session = await requireAuth();
  if (!session.user.onboarded) redirect("/onboarding");
  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}
```

- [ ] **Step 2: Create `middleware.ts`**

```typescript
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/home/:path*",
    "/discover/:path*",
    "/clubs/:path*",
    "/library/:path*",
    "/tracker/:path*",
    "/challenges/:path*",
    "/feed/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};
```

- [ ] **Step 3: Create `types/index.ts` with shared types**

```typescript
export type MatchOutput = {
  score: number;
  confidence: "low" | "medium" | "high";
  matchReasons: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  sharedBooks: string[];
  sharedGenres: string[];
  sharedAuthors: string[];
  sharedThemes: string[];
  sharedTasteDimensions: string[];
};

export type TasteDimensions = {
  pace: number;
  tone: number;
  focus: number;
  emotionalIntensity: number;
  romanceLevel: number;
  complexity: number;
  worldbuildingDepth: number;
  discussionPotential: number;
};

export const DIMENSION_LABELS: Record<keyof TasteDimensions, [string, string]> = {
  pace: ["Slow-paced", "Fast-paced"],
  tone: ["Light-hearted", "Dark"],
  focus: ["Character-driven", "Plot-driven"],
  emotionalIntensity: ["Low emotional intensity", "High emotional intensity"],
  romanceLevel: ["No romance", "Romance-heavy"],
  complexity: ["Simple", "Complex"],
  worldbuildingDepth: ["Minimal world-building", "Deep world-building"],
  discussionPotential: ["Light read", "Great for discussion"],
};
```

- [ ] **Step 4: Commit**

```bash
git add lib/auth-helpers.ts middleware.ts types/index.ts
git commit -m "feat: add auth helpers, route middleware protection, and shared types"
```

---

### Task 10: Verify full auth flow

**Files:** No new files.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000 with no errors.

- [ ] **Step 2: Test sign-in API directly**

In a new terminal:

```bash
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah@folio.dev","password":"password123"}'
```

Expected: Response with session token or redirect.

- [ ] **Step 3: Test protected route redirect**

```bash
curl -I http://localhost:3000/home
```

Expected: `Location: http://localhost:3000/sign-in` (302 redirect since no session).

- [ ] **Step 4: Commit final Phase 1 state**

```bash
git add .
git commit -m "feat: complete Phase 1 — foundation, schema, seed data, auth"
```

---

## Phase 1 Complete

**What's working:**
- Next.js 14 App Router project with TypeScript + Tailwind
- shadcn/ui components installed with dark Folio theme
- Full Prisma schema (20 models, all relationships)
- PostgreSQL database migrated
- 20 books, 8 users, 5 clubs, challenges, achievements seeded
- NextAuth with credentials provider and JWT sessions
- Route protection middleware

**Next:** Phase 2 — Landing page, app shell, and onboarding flow.
