# Interaction System

## Purpose

Folio uses interaction feedback to make user actions feel acknowledged without making the interface noisy. Feedback should clarify that the system responded, not compete with the reading-focused aesthetic.

## Feedback Primitives

### Toasts

Toasts are used for mutation outcomes:

- successful saves
- failed actions
- milestone moments
- join/leave confirmation
- like/follow confirmation when the visible UI change may be subtle

Toasts should be short and concrete. Prefer “Progress updated.” over explanatory copy.

### `folio-updated`

`folio-updated` is a short-lived highlight used when an item or row has just changed. It works well for:

- feed rows after like/follow/save actions
- recently added library items
- club or challenge join confirmation
- activity rows that need a visible acknowledgement

Use it when the affected element remains on screen and the user benefits from knowing exactly what changed.

### `folio-milestone`

`folio-milestone` is reserved for stronger but still calm feedback. It is used when progress reaches a meaningful threshold, such as:

- 25%
- 50%
- 75%
- 100%

It should not be used for routine button clicks or small state changes.

### Progress Animation

Progress bars use `folio-progress-fill` to animate width changes and add a brief glow. This is appropriate for reading progress, annual goals, mini-player progress, and challenge progress.

Progress animation should only appear where the numeric progress itself is meaningful. Avoid applying it to decorative bars.

## Decision Rules

Each action should use only one primary feedback type. Do not stack toast, highlight, and animation unless the action is a true milestone.

Prefer the smallest feedback that makes the result clear.

Use `folio-updated` when a specific visible element changed and the user should be able to locate that change. Examples: a feed row after liking, a newly added library item, or a join/leave control after success.

Use `folio-milestone` when progress crosses a meaningful threshold. Examples: 25%, 50%, 75%, 100%, completing a book, or reaching challenge progress. Do not use it for routine saves.

Use only a toast when the action succeeds but the visible UI already communicates the result, or when the changed data is elsewhere. Examples: saving settings, updating profile fields, or a background revalidation.

Use no animation when the interaction already has an obvious spatial response. Examples: opening menus, navigating routes, switching tabs, or revealing a panel.

## Motion Hierarchy

Primary interactions are progress and milestones. They may use progress animation, milestone copy, and a brief container highlight because they reinforce reading momentum.

Secondary interactions are likes, follows, saves, joins, and leaves. They should use small inline confirmations, subtle row highlights, and toasts only when helpful.

Tertiary interactions are hover states, menus, search overlays, and navigation affordances. They should feel responsive but quiet.

Not everything should animate equally. Primary content should draw attention; side panels, repeated rows, and supporting controls should remain calmer to avoid visual noise.

## Feedback Strength

Use subtle feedback for frequent actions:

- liking a post
- following a user
- saving a book
- changing a filter or tab

Use stronger feedback for milestone actions:

- completing a book
- crossing reading progress thresholds
- joining a challenge
- logging a meaningful reading session

Use no animation when the UI change is already obvious, such as opening a modal, switching routes, or expanding a dropdown.

## Animation Guidelines

Animations should be fast, small, and purposeful.

- Prefer fades, small highlights, and progress movement.
- Avoid repeated shimmer except for large covers and loading states.
- Avoid stacking toast, highlight, and large motion unless the event is a true milestone.
- Do not animate every row or sidebar element equally.
- Keep secondary UI quieter than primary content.

The goal is to make Folio feel responsive and alive while preserving the calm editorial Stacks direction.

### What NOT to do

- Do not use `folio-milestone` for normal saves.
- Do not apply `folio-updated` to entire pages.
- Do not animate every repeated list item.
- Do not use shimmer outside loading states.
