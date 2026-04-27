import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.onboarded) redirect("/home");

  return <OnboardingWizard />;
}
