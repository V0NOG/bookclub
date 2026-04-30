"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Settings, User } from "lucide-react";

type Props = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function ProfileMenu({ name, email, image }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = name?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? "U";

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="folio-cover flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-secondary/20 ring-2 ring-transparent transition-all hover:ring-secondary/50"
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        {image ? (
          <Image src={image} alt="" width={32} height={32} unoptimized className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-secondary">{initial}</span>
        )}
      </button>

      {open && (
        <div className="folio-soft-enter absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-foreground">{name ?? "Reader"}</p>
            {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
          </div>
          <div className="p-2">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
