import { getSession } from "@/lib/auth-helpers";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-2">
        Good reading, {session?.user.name?.split(" ")[0]} 👋
      </h1>
      <p className="text-muted-foreground">Your personalised reading dashboard is coming in Phase 5.</p>
    </div>
  );
}
