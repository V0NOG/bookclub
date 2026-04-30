"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Activity, Bell, Heart, Loader2, UserPlus, Users, X } from "lucide-react";
import { getShellNotifications, ShellNotification } from "@/app/actions/shell";

const iconMap = {
  like: Heart,
  follow: UserPlus,
  club: Users,
  challenge: Activity,
};

function formatRelative(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [notifications, setNotifications] = useState<ShellNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const requestClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 180);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") requestClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, requestClose]);

  useEffect(() => {
    if (!open || loaded) return;
    startTransition(async () => {
      const nextNotifications = await getShellNotifications();
      setNotifications(nextNotifications);
      setLoaded(true);
    });
  }, [loaded, open, startTransition]);

  if (!open && !closing) return null;

  return (
    <div className="fixed inset-0 z-50 bg-foreground/10 backdrop-blur-[2px]" onMouseDown={requestClose}>
      <aside
        className={`${closing ? "folio-slide-out-right" : "folio-slide-in-right"} ml-auto flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <p className="text-xs text-muted-foreground">Recent reading and social signals</p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {isPending && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading updates...
            </div>
          )}

          {!isPending && notifications.length === 0 && (
            <div className="px-4 py-16 text-center">
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-background">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Nothing new yet</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Likes, follows, club posts, polls, and challenge updates will collect here.
              </p>
            </div>
          )}

          {notifications.map((notification) => {
            const Icon = iconMap[notification.type];
            return (
              <Link
                key={notification.id}
                href={notification.href}
                onClick={requestClose}
                className="block rounded-xl px-3 py-3 hover:bg-accent"
              >
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-background">
                    <Icon className="h-4 w-4 text-primary" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{notification.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{notification.body}</span>
                    <span className="mt-2 block text-[11px] text-muted-foreground/80">{formatRelative(notification.createdAt)}</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
