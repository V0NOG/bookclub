# Product Flows

## Library Flow

Books enter the Library through actions such as Want to Read, Currently Reading, Read, rating, or direct status changes.

Experience intent:

The Library should feel like a growing personal collection. Every add or status change should make the shelf feel more complete and more organized, without requiring the user to understand where the data moved.

Flow:

1. User chooses a book action.
2. Client component updates local state and shows a pending label.
3. Server action writes to `UserBook`.
4. Server action revalidates affected routes.
5. Client calls `router.refresh()`.
6. The book appears in the correct Library section.
7. Toast and inline feedback confirm the change.

The Library also surfaces a small Recently Added section using existing `UserBook.createdAt`, giving users visible confirmation that their collection is growing.

## Tracker Flow

Tracker turns reading activity into visible progress.

Experience intent:

Tracker should reinforce habit. Logging a session should feel like a small act of momentum: progress moves, recent history grows, and milestones acknowledge meaningful steps without turning reading into a noisy game.

Flow:

1. User logs pages, minutes, or current page.
2. `logReadingSession` creates a `ReadingSession`.
3. The same action updates `UserBook.progress` when progress can be derived.
4. Affected routes are revalidated.
5. Client refreshes the Tracker page.
6. Recent sessions, progress history, and current book progress update.
7. Milestone feedback appears when progress reaches 25%, 50%, 75%, or 100%.

Tracker feedback should emphasize progress, not gamification noise.

## Clubs Flow

Clubs use existing club, membership, post, poll, challenge, and activity data.

Experience intent:

Clubs should feel active even with minimal data. Member presence, recent activity, and join feedback are meant to suggest a living group rather than an empty directory entry.

Flow:

1. User creates a club through the create route.
2. Server action creates the `Club` and owner `ClubMember`.
3. User lands on the club detail page.
4. Users can join or leave open clubs.
5. Join actions create `ClubMember` rows and activity events.
6. Club detail shows members, reading list, and derived recent activity.
7. Feed and notifications can reference club activity through existing records.

Club detail should feel active through member presence and recent activity, even when the club has limited content.

## Feed Flow

Feed interactions are optimistic where safe.

Experience intent:

Feed should feel alive but calm. Likes, follows, and saves should respond quickly, while the overall stream remains editorial and readable rather than social-media noisy.

Flow:

1. User likes activity, follows a reader, or saves a book.
2. Client updates local UI immediately.
3. Server action persists the change.
4. On success, the row shows a small confirmation and toast.
5. On failure, local state rolls back and an error toast appears.

The Feed supports two modes:

- **For you**: broader recommendation-oriented activity.
- **Social feed**: current user plus followed readers.

## Challenges Flow

Challenges build motivation from existing participation data.

Experience intent:

Challenges should motivate without gamification overload. Joining should feel like a lightweight commitment, and progress should be clear enough to encourage return visits without overwhelming the reading experience.

Flow:

1. User joins a public challenge.
2. Server action creates `ChallengeParticipant`.
3. Page refreshes after success.
4. Joined challenges show participant count and user progress.
5. Progress bars and milestone labels reflect progress where a target exists.
6. Leave actions remove participation and refresh the page.

Challenge feedback should make participation feel acknowledged while keeping the interface lightweight.
