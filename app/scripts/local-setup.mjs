import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const state = path.join(root, ".local");
const bin = process.env.PG_BIN || "/opt/homebrew/opt/postgresql@17/bin";
const run = (cmd, args) =>
  execFileSync(path.join(bin, cmd), args, { stdio: "pipe" }).toString();
mkdirSync(state, { recursive: true, mode: 0o700 });
const data = path.join(state, "postgres");
if (!existsSync(path.join(data, "PG_VERSION")))
  run("initdb", [
    "-D",
    data,
    "-U",
    "descomplica_local",
    "--auth=trust",
    "--encoding=UTF8",
    "--locale=C",
  ]);
try {
  run("pg_ctl", ["-D", data, "status"]);
} catch {
  run("pg_ctl", [
    "-D",
    data,
    "-l",
    path.join(state, "postgres.log"),
    "-o",
    `-h 127.0.0.1 -p 54339 -c unix_socket_directories=''`,
    "-w",
    "start",
  ]);
}
const connection = [
  "-h",
  "127.0.0.1",
  "-p",
  "54339",
  "-U",
  "descomplica_local",
];
const dbs = run("psql", [
  ...connection,
  "-d",
  "postgres",
  "-Atc",
  "SELECT datname FROM pg_database WHERE datname IN ('descomplica_local','descomplica_test')",
]);
for (const name of ["descomplica_local", "descomplica_test"])
  if (!dbs.split("\n").includes(name)) run("createdb", [...connection, name]);
if (!existsSync(path.join(root, ".env.local")))
  writeFileSync(
    path.join(root, ".env.local"),
    `APP_MODE=local-test\nAPP_ORIGIN=http://127.0.0.1:3001\nDATABASE_URL=postgres://descomplica_local@127.0.0.1:54339/descomplica_local\nTEST_DATABASE_URL=postgres://descomplica_local@127.0.0.1:54339/descomplica_test\nLOCAL_ACCESS_CODE=${randomBytes(12).toString("hex")}\nLOCAL_SECRET=${randomBytes(32).toString("hex")}\n`,
    { mode: 0o600 },
  );
console.log(
  "PostgreSQL isolado iniciado em 127.0.0.1:54339. Não usa o Supabase existente.",
);
console.log(
  "Código para login: consulte LOCAL_ACCESS_CODE em app/.env.local (não compartilhe o arquivo).",
);
console.log("Próximo: npm run db:migrate && npm run dev");
