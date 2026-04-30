import { getSession } from "@/lib/auth-helpers";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export async function TopBar() {
  const session = await getSession();
  const initial = session?.user?.name?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur flex items-center px-6 gap-4">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search books, clubs, readers..."
          className="pl-9 bg-muted/50 border-border focus:bg-background"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
        <Link href="/profile">
          <div className="h-8 w-8 rounded-full bg-secondary/20 ring-2 ring-transparent hover:ring-secondary/50 transition-all flex items-center justify-center cursor-pointer overflow-hidden">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="text-xs text-secondary font-semibold">{initial}</span>
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
