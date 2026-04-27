"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen, Home, Compass, Users, Library, Activity,
  Trophy, Rss, User, Settings, LogOut
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/clubs", icon: Users, label: "Clubs" },
  { href: "/library", icon: Library, label: "My Library" },
  { href: "/tracker", icon: Activity, label: "Tracker" },
  { href: "/challenges", icon: Trophy, label: "Challenges" },
  { href: "/feed", icon: Rss, label: "Feed" },
];

const bottomNavItems = [
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-border bg-card flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/home" className="flex items-center gap-2 font-bold text-lg text-white">
          <BookOpen className="h-5 w-5 text-emerald-500" />
          Folio
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-muted-foreground hover:text-white hover:bg-accent"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="px-3 pb-4 border-t border-border pt-4 space-y-1">
        {bottomNavItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-muted-foreground hover:text-white hover:bg-accent"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-white hover:bg-accent transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
