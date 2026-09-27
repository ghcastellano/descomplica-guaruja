/** Owner-only migration process. Never import from the app or run destructive tests here. */
import { readFile, readdir } from "node:fs/promises";
import postgres from "postgres";
const url = new URL(process.env.DATABASE_MIGRATION_URL || "invalid");
if (
  url.pathname !== "/descomplica_staging" ||
  url.hostname !== "ep-lucky-bar-b60e6y11.c-2.sa-east-1.aws.neon.tech" ||
  url.username !== "descomplica_owner"
)
  throw Error("Destino de migração não autorizado.");
const sql = postgres(url.toString(), {
  ssl: { rejectUnauthorized: true },
  max: 1,
  prepare: false,
  connect_timeout: 30,
  onnotice: () => {},
});
try {
  for (const name of (await readdir(new URL("../db/", import.meta.url)))
    .filter((x) => x.endsWith(".sql"))
    .sort()) {
    const migration = await readFile(
      new URL("../db/" + name, import.meta.url),
      "utf8",
    );
    await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(846521)`;
      if (
        (await tx`SELECT name FROM schema_migrations WHERE name=${name}`).length
      )
        return;
      await tx.unsafe(migration);
      await tx`INSERT INTO schema_migrations(name) VALUES(${name})`;
      console.log("Migração aplicada:", name);
    });
  }
  await sql.begin(async (tx) => {
    await tx`GRANT SELECT,INSERT,UPDATE ON city_requests,ai_interpretations TO descomplica_app`;
    await tx`GRANT SELECT,INSERT ON city_request_events TO descomplica_app`;
    await tx`GRANT USAGE,SELECT ON SEQUENCE city_requests_number_seq,city_request_events_id_seq TO descomplica_app`;
  });
  console.log("Migrações e permissões verificadas.");
} catch (e) {
  console.error(
    "Migração não concluída:",
    (e as { code?: string }).code || "verificar conexão",
  );
  process.exitCode = 1;
} finally {
  await sql.end();
}
