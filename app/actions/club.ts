"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";

export async function createClubAction(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const meetingCadence = String(formData.get("meetingCadence") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const genres = String(formData.get("genres") ?? "")
    .split(",")
    .map((genre) => genre.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (!name) redirect("/clubs/create?error=name");

  const club = await db.club.create({
    data: {
      name,
      description: description || undefined,
      meetingCadence: meetingCadence || undefined,
      location: location || undefined,
      genres,
      themes: [],
      ownerId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
  });

  revalidatePath("/clubs");
  redirect(`/clubs/${club.id}`);
}
