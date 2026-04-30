# Folio System Overview

## Architecture

Folio is a Next.js App Router application. Route segments under `app/` define the product surfaces: authenticated app pages, auth pages, onboarding, and server-rendered detail routes. Most pages fetch their initial data directly on the server, then pass only the interactive pieces to client components.

The app is organized around four layers:

- **Pages and layouts**: Server components in `app/` compose data, route structure, and page-level layout.
- **Server actions**: Mutations live in `app/actions/`. They are the primary boundary for user-initiated writes such as rating books, updating progress, joining clubs, following users, and liking activity.
- **Database access**: Prisma is accessed through `lib/db.ts`. Pages and server actions query existing models directly; no client component talks to the database.
- **UI components**: Reusable interactive controls live in `components/`. Client components handle optimistic UI, pending states, toasts, and `router.refresh()` after server actions complete.

## Architectural Intent

Folio is server-first because the same user action often affects several product areas at once. A book status change can alter Library sections, Tracker state, Home recommendations, Feed activity, and the book detail page. Treating the server as the source of truth keeps those surfaces consistent without requiring a large client cache to coordinate them.

Server actions, `revalidatePath()`, and `router.refresh()` are used instead of React Query, SWR, or heavy global state because the product depends more on cross-page correctness than on maintaining long-lived client-side data. Client state is intentionally short-lived: pending labels, optimistic toggles, highlights, and toasts.

The tradeoff is deliberate:

- **Simplicity over maximum instant UI**: client components can feel responsive, but server-rendered data is refreshed after writes.
- **Consistency over cache complexity**: shared data is re-read from the server rather than synchronized across multiple client caches.
- **Clear ownership over global state**: server actions own durable mutations; client components own interaction feedback.

This keeps the mental model small: write through a server action, invalidate affected routes, refresh the current view when the user needs to see the result immediately.

## Data Flow

Most read flows are server-first:

1. A route renders on the server.
2. The page queries Prisma through `db`.
3. Server data is passed into presentational components and small client controls.
4. The client controls handle local pending/optimistic state.

Most write flows follow this pattern:

1. The user triggers a client component action.
2. The client component updates local UI optimistically where safe.
3. The client component calls a server action.
4. The server action validates the session and writes through Prisma.
5. The server action calls `revalidatePath()` for affected routes.
6. The client component calls `router.refresh()` after success.
7. The current server-rendered UI updates with fresh data.
8. The user sees a toast or inline confirmation where useful.

In short: user action -> server action -> database write -> `revalidatePath()` -> `router.refresh()` -> visible UI update.

## `revalidatePath()` and `router.refresh()`

`revalidatePath()` and `router.refresh()` solve different parts of the same problem.

`revalidatePath()` is used inside server actions. It invalidates cached server-rendered data globally for one or more routes affected by the mutation.

`router.refresh()` is used inside client components after a successful server action. It updates the current UI immediately by asking the active route to refetch and re-render its server component tree.

Example: updating a book status writes to `UserBook`, revalidates Library, Feed, and the Book page, then refreshes the current screen so the book visibly moves or updates without manual navigation.

Use both when a mutation changes data currently visible on screen. Use `revalidatePath()` alone only when the current client does not need an immediate visual refresh.

## External Book Search

External book search is a search-time integration, not a catalogue import system.

### Ingestion Strategy

Folio does not store a global book catalogue. External APIs are queried only when a user searches for a real book by title, author, or ISBN.

Books are created lazily, only when a user chooses to add a result to their Library. The `Book` table should be treated as a curated dataset of user-selected books, not a mirror of Open Library, Google Books, or any other provider.

Future implementations should not bulk import provider catalogues. Search results may be displayed transiently, but only user-selected books should become durable `Book` records.

### Data Ownership

External APIs are read-only sources. They provide candidate metadata for search and creation, but they do not own any persisted Folio records.

Folio owns all stored `Book` records. Once a book is created in the database, its in-app representation is controlled by Folio and should not be continuously synced from external providers.

### Source of Truth

The `Book` table is the single source of truth for all in-app book data.

External APIs are used only to bootstrap missing book data at creation time. After a book is stored, Folio should render from its own database and should not depend on external APIs for normal page loads, Library views, Feed items, Tracker state, or book detail pages.

### Mutation Rules

External data is written once when a user-selected book is created.

Do not automatically overwrite existing `Book` records with provider updates. Provider metadata can change, conflict, or disappear, so automatic sync would make Folio's in-app data unstable.

Any future enrichment should be explicit: a background job, admin flow, or user-triggered update with clear merge rules. User-generated data such as ratings, progress, notes, reviews, and reading history always takes priority over provider metadata.

### Search vs Storage

Search results are ephemeral. They may be shown in the UI, but they are not persisted until the user explicitly adds a book.

Only user-selected books become durable records. The UI should clearly distinguish external search results from internal Library books so users and developers do not treat transient provider data as stored Folio data.

### Deduplication Guarantees

Deduplication should be conservative and ordered by identifier strength:

1. Match by ISBN first. ISBN is the strongest available identifier and should win when present.
2. Match by `externalSource` and `externalId` second. This identifies the provider record when ISBN is missing.
3. Match by normalized title and author last. This is a heuristic and may produce collisions, so it should be used conservatively.

Title and author fallback should avoid aggressive fuzzy matching. Prefer missing a duplicate over incorrectly merging distinct editions or books with similar names.

### Failure Handling

If an external API fails, the UI should show an empty state with a retry option rather than creating placeholder records.

If an external result contains partial data, Folio should still allow adding the book when the minimum fields are present: title and author. Optional fields such as cover, description, page count, and publication year can remain empty.

If no cover image is available, use the standard book placeholder. Do not block adding a book because media is missing.

### Performance Notes

Search should be debounced on the client before calling the server-side search helper.

Open Library should be queried first. Google Books should be used only as a fallback or enrichment path when Open Library results are missing or incomplete enough to justify the extra request.

Avoid calling both APIs for every keystroke. If provider limits become a problem, add server-side rate limiting or short-lived query caching before increasing provider usage.

### Extensibility

`externalSource` and `externalId` allow additional providers to be added later without new models.

The existing `Book` schema can support future enrichment such as descriptions, covers, page counts, categories, ratings, or review metadata. Enrichment can happen asynchronously later, but it should not change the core rule: durable `Book` records are created from user intent, not provider catalogue sync.

## Interaction Ownership

Server components own durable data and page composition. Client components own transient interaction state:

- pending labels such as `Saving...`
- optimistic toggles for likes/follows/joins
- short-lived success messages
- toast notifications
- subtle visual feedback classes

This split keeps the app responsive while preserving server-rendered correctness after refresh.
