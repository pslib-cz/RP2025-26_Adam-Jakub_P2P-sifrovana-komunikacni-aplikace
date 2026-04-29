import bcrypt from "bcryptjs";
import db from "./db";

async function migratePasswords() {
  await db.initialize();

  const { db: drizzleDb, schema } = await import("./db");
  const { users } = schema;

  const allUsers = await drizzleDb.select().from(users);

  console.log(`Nalezeno ${allUsers.length} uživatelů.`);

  let migrated = 0;
  let alreadyHashed = 0;

  for (const user of allUsers) {
    if (user.password.startsWith("$2")) {
      alreadyHashed++;
      console.log(`✅ ${user.userId}: již zahashováno, přeskakuji`);
      continue;
    }

    console.log(`🔄 ${user.userId}: hashuju heslo...`);
    const hashed = await bcrypt.hash(user.password, 10);

    await drizzleDb
      .update(users)
      .set({ password: hashed })
      .where((await import("drizzle-orm")).eq(users.id, user.id));

    migrated++;
    console.log(`✅ ${user.userId}: hotovo`);
  }

  console.log(`\nMigrace dokončena:`);
  console.log(`  Zahashováno:          ${migrated}`);
  console.log(`  Již bylo zahashováno: ${alreadyHashed}`);

  await db.close();
}

migratePasswords().catch((err) => {
  console.error("Chyba migrace:", err);
  process.exit(1);
});
