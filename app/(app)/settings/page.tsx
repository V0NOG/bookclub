import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { Bell, BookOpen, Lock, Settings, User } from "lucide-react";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { UserType } from "@/lib/generated/prisma/enums";
import { PageContainer } from "@/components/layout/page-container";

function SettingRow({
  title,
  description,
  value,
}: {
  title: string;
  description: string;
  value?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 py-4 last:border-b-0">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
      {value && (
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground whitespace-nowrap">
          {value}
        </span>
      )}
    </div>
  );
}

export default async function SettingsPage() {
  const session = await getSession();
  const userId = session!.user.id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      username: true,
      userType: true,
      onboarded: true,
      onboardingData: {
        select: {
          readingGoalBooksPerYear: true,
          clubPreference: true,
          interestedInClubs: true,
          interestedInChallenges: true,
        },
      },
    },
  });

  return (
    <PageContainer>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Account</p>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Review the profile and preference signals Folio is currently using.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <PreferencesForm
          userType={user?.userType ?? UserType.READER}
          readingGoal={user?.onboardingData?.readingGoalBooksPerYear}
          clubPreference={user?.onboardingData?.clubPreference}
          interestedInClubs={Boolean(user?.onboardingData?.interestedInClubs)}
          interestedInChallenges={Boolean(user?.onboardingData?.interestedInChallenges)}
        />

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Profile details
          </h2>
          <SettingRow title="Display name" description="Shown on your profile, clubs, and social activity." value={user?.name ?? "Not set"} />
          <SettingRow title="Username" description="Used by other readers to recognise you." value={user?.username ? `@${user.username}` : "Not set"} />
          <SettingRow title="Email" description="Used for account access and important product updates." value={user?.email ?? "Unknown"} />
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Reading preferences
          </h2>
          <SettingRow
            title="Reader type"
            description="Helps shape the shortcuts and recommendations shown in Folio."
            value={user?.userType?.toLowerCase() ?? "reader"}
          />
          <SettingRow
            title="Annual reading goal"
            description="Used by the library and tracker to frame your yearly progress."
            value={user?.onboardingData?.readingGoalBooksPerYear ? `${user.onboardingData.readingGoalBooksPerYear} books` : "Not set"}
          />
          <SettingRow
            title="Club preference"
            description="Guides whether discovery emphasises local, online, or mixed clubs."
            value={user?.onboardingData?.clubPreference ?? "Not set"}
          />
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Discovery signals
          </h2>
          <SettingRow
            title="Book clubs"
            description="Club recommendations are included in discovery when this is enabled during onboarding."
            value={user?.onboardingData?.interestedInClubs ? "Included" : "Quiet"}
          />
          <SettingRow
            title="Challenges"
            description="Challenge prompts are included when you want reading goals to be more social."
            value={user?.onboardingData?.interestedInChallenges ? "Included" : "Quiet"}
          />
          <SettingRow
            title="Onboarding"
            description="Your onboarding answers seed your initial taste profile."
            value={user?.onboarded ? "Complete" : "Incomplete"}
          />
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Privacy
          </h2>
          <SettingRow
            title="Taste profile"
            description="Recommendations use ratings, saved books, onboarding preferences, follows, and club membership. Raw passwords are never stored."
            value="Private"
          />
          <SettingRow
            title="Account controls"
            description="Profile editing, notification toggles, and export controls can be wired here when those actions are added."
            value="Read-only"
          />
        </section>
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <Settings className="h-3.5 w-3.5" />
        Settings are currently a read-only view of existing account data.
      </div>
    </PageContainer>
  );
}
