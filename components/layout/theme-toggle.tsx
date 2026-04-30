"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [night, setNight] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("folio-theme");
    const shouldUseNight = stored === "night";
    setNight(shouldUseNight);
    document.documentElement.classList.toggle("dark", shouldUseNight);
  }, []);

  function toggle() {
    setNight((current) => {
      const next = !current;
      localStorage.setItem("folio-theme", next ? "night" : "day");
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="group inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground"
      aria-label={night ? "Switch to day mode" : "Switch to night mode"}
      title={night ? "Day mode" : "Night mode"}
    >
      <span className="relative h-4 w-4 overflow-hidden">
        <Sun className={`absolute inset-0 h-4 w-4 transition-all duration-200 ${night ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`} />
        <Moon className={`absolute inset-0 h-4 w-4 transition-all duration-200 ${night ? "-translate-y-4 opacity-0" : "translate-y-0 opacity-100"}`} />
      </span>
    </button>
  );
}
