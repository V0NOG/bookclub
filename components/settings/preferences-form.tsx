"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePreferencesAction } from "@/app/actions/profile";

type UserType = "READER" | "ORGANISER" | "MEMBER" | "INFLUENCER";

export function PreferencesForm({
  userType,
  readingGoal,
  clubPreference,
  interestedInClubs,
  interestedInChallenges,
}: {
  userType: UserType;
  readingGoal?: number | null;
  clubPreference?: string | null;
  interestedInClubs: boolean;
  interestedInChallenges: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await updatePreferencesAction(formData);
      if (result.success) {
        setMessage("Preferences updated.");
        toast.success("Preferences updated.");
      } else {
        setMessage(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={submit} className="folio-lift rounded-xl border border-border bg-card p-5">
      <h2 className="text-base font-semibold text-foreground mb-4">Edit reading preferences</h2>
      <div className="space-y-3">
        <select name="userType" defaultValue={userType} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15">
          <option value="READER">Reader</option>
          <option value="ORGANISER">Club organiser</option>
          <option value="MEMBER">Club member</option>
          <option value="INFLUENCER">Book creator</option>
        </select>
        <input
          name="readingGoalBooksPerYear"
          type="number"
          min="1"
          defaultValue={readingGoal ?? ""}
          placeholder="Annual reading goal"
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
        <select name="clubPreference" defaultValue={clubPreference ?? "online"} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15">
          <option value="online">Online clubs</option>
          <option value="local">Local clubs</option>
          <option value="both">Both</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input name="interestedInClubs" type="checkbox" defaultChecked={interestedInClubs} className="h-4 w-4 accent-primary" />
          Include club recommendations
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input name="interestedInChallenges" type="checkbox" defaultChecked={interestedInChallenges} className="h-4 w-4 accent-primary" />
          Include challenge prompts
        </label>
        <button
          type="submit"
          disabled={pending}
          className="folio-press w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save preferences"}
        </button>
        {message && (
          <p className={`text-xs ${message === "Preferences updated." ? "text-secondary" : "text-destructive"}`}>{message}</p>
        )}
      </div>
    </form>
  );
}
