"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen, Home, Compass, Users, Library,
  Trophy, Rss, Sparkles, PanelLeftClose, PanelLeftOpen
} from "lucide-react";

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/clubs", icon: Users, label: "Clubs" },
  { href: "/library", icon: Library, label: "My Library" },
  { href: "/challenges", icon: Trophy, label: "Challenges" },
  { href: "/feed", icon: Rss, label: "Feed" },
  { href: "/showcase", icon: Sparkles, label: "Showcase" },
];

export function Sidebar({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 flex h-screen w-20 flex-col border-r border-border bg-card transition-[width] duration-200",
      collapsed ? "md:w-20" : "md:w-60"
    )}>
      {/* Logo */}
      <div className={cn("h-16 flex items-center border-b border-border justify-center px-3", !collapsed && "md:justify-start md:px-6")}>
        <Link href="/home" className="flex items-center gap-2 font-bold text-lg text-foreground" title="Folio">
          <BookOpen className="h-5 w-5 text-primary" />
          {!collapsed && <span className="hidden md:inline">Folio</span>}
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "folio-press flex items-center rounded-lg text-sm font-medium",
                collapsed ? "justify-center px-2 py-2.5" : "justify-center px-2 py-2.5 md:justify-start md:gap-3 md:px-3",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="hidden md:inline">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-3 pb-4 pt-4">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={cn(
            "folio-press hidden w-full items-center rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground md:flex",
            collapsed ? "justify-center px-2 py-2.5" : "justify-start gap-3 px-3 py-2.5"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span className="hidden md:inline">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
