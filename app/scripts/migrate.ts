import { readFile, readdir } from "node:fs/promises";
import { db } from "../lib/db";
export async function migrate() {
  await db`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
  for (const name of (await readdir(new URL("../db", import.meta.url)))
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    const sql = await readFile(
      new URL("../db/" + name, import.meta.url),
      "utf8",
    );
    await db.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(846521)`;
      if (
        (await tx`SELECT name FROM schema_migrations WHERE name=${name}`).length
      )
        return;
      await tx.unsafe(sql);
      await tx`INSERT INTO schema_migrations(name) VALUES(${name})`;
    });
  }
}
if (process.argv[1]?.endsWith("/migrate.ts")) {
  try {
    await migrate();
    console.log("Migrações aplicadas.");
  } finally {
    await db.end();
  }
}
