import Link from "next/link";
import { createClubAction } from "@/app/actions/club";
import { PageContainer } from "@/components/layout/page-container";

export default function CreateClubPage({ searchParams }: { searchParams?: { error?: string } }) {
  return (
    <PageContainer maxWidth="narrow">
      <Link href="/clubs" className="folio-press inline-flex rounded-full px-2 py-1 text-sm text-primary hover:bg-primary/10">
        Back to clubs
      </Link>

      <div className="mt-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">New club</p>
        <h1 className="text-3xl font-bold text-foreground">Create a club</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set up a lightweight reading club. You can add richer club activity after it exists.
        </p>
      </div>

      <form action={createClubAction} className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Club name
            </label>
            <input
              id="name"
              name="name"
              required
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              placeholder="Sunday Paperbacks"
            />
            {searchParams?.error === "name" && (
              <p className="mt-1 text-xs text-destructive">Club name is required.</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              placeholder="A calm club for thoughtful fiction and good discussion."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="meetingCadence" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Cadence
              </label>
              <input
                id="meetingCadence"
                name="meetingCadence"
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Monthly"
              />
            </div>
            <div>
              <label htmlFor="location" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Location
              </label>
              <input
                id="location"
                name="location"
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Online or city"
              />
            </div>
          </div>

          <div>
            <label htmlFor="genres" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Genres
            </label>
            <input
              id="genres"
              name="genres"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              placeholder="Literary fiction, mystery, memoir"
            />
          </div>

          <button
            type="submit"
            className="folio-press folio-cta rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Create club
          </button>
        </div>
      </form>
    </PageContainer>
  );
}
