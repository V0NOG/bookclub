import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";
import { TopBar } from "@/components/layout/top-bar";
import { CurrentlyReadingBar } from "@/components/layout/currently-reading-bar";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) redirect("/sign-in");
  if (!session.user.onboarded) redirect("/onboarding");

  return (
    <AppShell topBar={<TopBar />} bottomBar={<CurrentlyReadingBar />}>
      {children}
    </AppShell>
  );
}
