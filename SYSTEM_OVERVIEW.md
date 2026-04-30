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
6. The client component calls `router.refresh()` after success so the current server-rendered page reflects the new data immediately.
7. The user sees a toast and, where useful, a local visual confirmation.

## `revalidatePath()` and `router.refresh()`

`revalidatePath()` and `router.refresh()` solve different parts of the same problem.

`revalidatePath()` is used inside server actions. It invalidates cached server-rendered data for one or more routes affected by the mutation. For example, changing a book status can affect `/library`, `/tracker`, `/home`, `/feed`, and `/books/[bookId]`.

`router.refresh()` is used inside client components after a successful server action. It asks the current route to refetch and re-render its server component tree. This is what makes a book visibly move between Library sections or a newly logged session appear without manual navigation.

Use both when a mutation changes data currently visible on screen. Use `revalidatePath()` alone only when the current client does not need an immediate visual refresh.

## Interaction Ownership

Server components own durable data and page composition. Client components own transient interaction state:

- pending labels such as `Saving...`
- optimistic toggles for likes/follows/joins
- short-lived success messages
- toast notifications
- subtle visual feedback classes

This split keeps the app responsive while preserving server-rendered correctness after refresh.
