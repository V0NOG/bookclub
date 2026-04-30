"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "@/app/actions/profile";

type ProfileValues = {
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  location?: string | null;
  avatar?: string | null;
};

export function ProfileEditForm({ profile }: { profile: ProfileValues }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      setMessage(result.success ? "Profile updated." : result.error);
    });
  }

  return (
    <form action={submit} className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4">Edit profile</h2>
      <div className="space-y-3">
        <input name="name" defaultValue={profile.name ?? ""} placeholder="Display name" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm" />
        <input name="username" defaultValue={profile.username ?? ""} placeholder="Username" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm" />
        <input name="location" defaultValue={profile.location ?? ""} placeholder="Location" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm" />
        <input name="avatar" defaultValue={profile.avatar ?? ""} placeholder="Avatar URL" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm" />
        <textarea name="bio" defaultValue={profile.bio ?? ""} placeholder="Bio" className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save profile"}
        </button>
        {message && (
          <p className={`text-xs ${message.endsWith(".") ? "text-secondary" : "text-destructive"}`}>{message}</p>
        )}
      </div>
    </form>
  );
}
