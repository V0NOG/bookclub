import "dotenv/config";
import { db } from "./lib/db";

async function main() {
  const users = await db.user.findMany({
    select: {
      email: true,
      name: true,
      passwordHash: true,
    },
  });

  console.log(
    users.map((user) => ({
      email: user.email,
      name: user.name,
      hasPasswordHash: Boolean(user.passwordHash),
    }))
  );
}

main().catch(console.error).finally(() => process.exit(0));
