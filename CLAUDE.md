# CLAUDE.md

## Project

Folio is a Spotify-style social reading platform for book discovery, taste-matched readers, book clubs, reading progress, and friendly reading challenges.

Core tagline:

> Find your next favourite book — and the people to read it with.

---

## Product direction

Folio should not feel like a Goodreads clone.

It should feel like:

- Spotify for book discovery
- Letterboxd for social reviews
- Strava for reading challenges
- Modern book club management software for organisers

The main differentiator is taste matching.

Taste matching is not a side feature. It is the core product engine.

It powers:

- book recommendations
- user-to-user matching
- user-to-club matching
- club-to-book matching
- book voting
- social discovery
- club discovery
- recommendation rows
- organiser insights

---

## Design principles

Prioritise:

- polished consumer-grade UI
- dark Spotify-inspired layout
- intuitive navigation
- personalised recommendation rows
- strong visual hierarchy
- responsive mobile experience
- smooth hover states
- attractive cards and carousels
- clear empty states
- minimal friction
- explainable recommendations

Do not copy Spotify directly. Use it only as inspiration.

---

## Tech stack

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL
- NextAuth or clean custom auth

---

## App routes

Important routes:

- `/`
- `/sign-in`
- `/sign-up`
- `/onboarding`
- `/home`
- `/discover`
- `/clubs`
- `/clubs/[id]`
- `/clubs/create`
- `/library`
- `/tracker`
- `/challenges`
- `/feed`
- `/profile/[id]`
- `/settings`

---

## Core product experience

A user should be able to:

1. Sign up
2. Complete onboarding
3. Build a taste profile
4. Add books to their library
5. Track reading progress
6. Get personalised recommendations
7. Discover compatible readers
8. Discover compatible book clubs
9. Join/apply to clubs
10. Vote on club books
11. Join reading challenges
12. View progress, points, and achievements

---

## Authentication

Users should be able to:

- sign up
- sign in
- sign out
- access protected routes

---

## Onboarding

Collect:

- favourite genres
- favourite books
- disliked books
- favourite authors
- preferred moods/themes
- reading goals
- local/online club preference
- user type
- interest in clubs
- interest in reading challenges

---

## Personal library

Users can track books as:

- Read
- Want to Read
- Currently Reading
- Abandoned

Users can:

- rate books
- review books
- add books to shelves
- filter library
- view reading progress

---

## Taste matching philosophy

Taste matching must feel intelligent, human, and explainable.

Do not simplify it into basic genre overlap.

Every match must:
- use multiple signals
- include negative preferences
- include taste dimensions
- include explanation output

Bad:

> You are a 92% match.

Good:

> You are a 92% match because you both enjoy slow-burn fantasy, character-driven stories, mythology retellings, and darker emotional themes.

---

## Taste profile inputs

Derive user taste from:

- book ratings
- reading status
- completed books
- abandoned books
- genre distribution
- author preferences
- shelves and curated lists
- reviews
- explicit onboarding preferences
- negative preferences
- disliked books

---

## Taste dimensions

Model deeper preference dimensions beyond genre.

- Pace: slow ↔ fast  
- Tone: light ↔ dark  
- Focus: character ↔ plot  
- Emotional intensity  
- Romance level  
- Complexity  
- Worldbuilding depth  
- Discussion potential  

These can be seeded initially.

---

## Taste matching types

The system must support:

1. User-to-user matching
2. User-to-book matching
3. User-to-club matching
4. Club-to-book matching

---

## Matching signals

Use:

- overlap in highly rated books
- genre similarity
- author similarity
- taste dimension similarity
- rating pattern consistency
- shared shelves/themes
- negative preference alignment
- abandoned/disliked penalties
- recency weighting

---

## Weighting rules

- 5⭐ = strongest signal  
- 4⭐ = medium  
- 3⭐ = weak/neutral  
- 1–2⭐ = negative  
- abandoned = negative  
- completed = positive  
- recent activity > old activity  
- disliked genres reduce compatibility  
- weak data reduces confidence  

---

## Match output

Every match must return:

- score (0–100)
- confidence (low/medium/high)
- matchReasons
- positiveSignals
- negativeSignals
- sharedBooks
- sharedGenres
- sharedAuthors
- sharedThemes
- sharedTasteDimensions

Example:

```ts
{
  score: 89,
  confidence: "high",
  matchReasons: [
    "You both rated Six of Crows and The Name of the Wind highly.",
    "You both prefer character-driven fantasy.",
    "You both enjoy darker, slower-paced stories.",
    "You both tend to avoid action-heavy thrillers."
  ]
}