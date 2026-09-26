export function config() {
  const origin = process.env.APP_ORIGIN || "";
  const database = process.env.DATABASE_URL || "";
  const secret = process.env.LOCAL_SECRET || "";
  const accessCode = process.env.LOCAL_ACCESS_CODE || "";
  if (
    process.env.APP_MODE !== "local-test" ||
    origin !== "http://127.0.0.1:3001" ||
    secret.length < 64 ||
    accessCode.length < 20
  )
    throw new Error(
      "Ambiente local não configurado. Rode npm run local:setup.",
    );
  const url = new URL(database);
  if (
    url.hostname !== "127.0.0.1" ||
    url.port !== "54339" ||
    !["/descomplica_local", "/descomplica_test"].includes(url.pathname)
  )
    throw new Error("Esta etapa só permite o banco local isolado.");
  return { origin, database, secret, accessCode };
}
