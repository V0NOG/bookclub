import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { CurrentlyReadingBar } from "@/components/layout/currently-reading-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) redirect("/sign-in");
  if (!session.user.onboarded) redirect("/onboarding");

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-60 min-h-screen">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-16">
          {children}
        </main>
        <CurrentlyReadingBar />
      </div>
    </div>
  );
}
