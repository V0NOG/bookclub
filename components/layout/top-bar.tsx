import { getSession } from "@/lib/auth-helpers";
import { TopBarActions } from "@/components/layout/top-bar-actions";

export async function TopBar() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 pl-16 pr-4 backdrop-blur md:px-6">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Folio</p>
      </div>
      <TopBarActions
        user={{
          name: session?.user?.name,
          email: session?.user?.email,
          image: session?.user?.image,
        }}
      />
    </header>
  );
}
