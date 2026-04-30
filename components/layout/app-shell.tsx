"use client";

import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

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
      <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      <div
        className={cn(
          "ml-20 flex min-h-screen flex-col transition-[margin] duration-200 md:ml-60",
          collapsed && "md:ml-20"
        )}
      >
        {topBar}
        <main className="folio-soft-enter flex flex-1 justify-center overflow-y-auto pb-24">
          {children}
        </main>
      </div>
      {bottomBar && (
        <div
          className={cn(
            "fixed bottom-0 right-0 z-30 left-20 transition-[left] duration-200 md:left-60",
            collapsed && "md:left-20"
          )}
        >
          {bottomBar}
        </div>
      )}
    </div>
  );
}
