"use client";

import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export function AppShell({
  children,
  topBar,
  bottomBar,
}: {
  children: ReactNode;
  topBar: ReactNode;
  bottomBar: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("folio-sidebar-collapsed") === "true");
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem("folio-sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <button
        type="button"
        onClick={() => setMobileSidebarOpen((open) => !open)}
        className="folio-press fixed left-4 top-4 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground md:hidden"
        aria-label={mobileSidebarOpen ? "Close navigation" : "Open navigation"}
      >
        {mobileSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onToggleCollapsed={toggleCollapsed}
      />
      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-col transition-[margin] duration-200 md:ml-[var(--sidebar-width)]",
          collapsed && "md:ml-[var(--sidebar-collapsed-width)]"
        )}
      >
        {topBar}
        <main className="folio-soft-enter min-w-0 flex-1 overflow-x-clip">
          {children}
        </main>
      </div>
      {bottomBar && (
        <div
          data-layout-part="mini-player"
          className={cn(
            "fixed bottom-0 left-0 right-0 z-40 transition-[left] duration-200 md:left-[var(--sidebar-width)]",
            collapsed && "md:left-[var(--sidebar-collapsed-width)]"
          )}
        >
          {bottomBar}
        </div>
      )}
    </div>
  );
}
