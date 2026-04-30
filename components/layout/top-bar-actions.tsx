"use client";

import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { SiteSearchOverlay } from "@/components/layout/site-search-overlay";
import { NotificationPanel } from "@/components/layout/notification-panel";

type Props = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

export function TopBarActions({ user }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    function openSearch() {
      setSearchOpen(true);
    }

    window.addEventListener("folio:open-search", openSearch);
    return () => window.removeEventListener("folio:open-search", openSearch);
  }, []);

  return (
    <>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="folio-press inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground"
          aria-label="Search Folio"
        >
          <Search className="h-4 w-4" />
        </button>
        <ThemeToggle />
        <button
          type="button"
          onClick={() => setNotificationsOpen(true)}
          className="folio-press inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground"
          aria-label="Open notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <ProfileMenu name={user.name} email={user.email} image={user.image} />
      </div>

      <SiteSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
}
