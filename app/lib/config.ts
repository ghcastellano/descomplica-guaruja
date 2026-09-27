export function config() {
  const origin = process.env.APP_ORIGIN || "";
  const database = process.env.DATABASE_URL || "";
  const secret = process.env.LOCAL_SECRET || "";
  const accessCode = process.env.LOCAL_ACCESS_CODE || "";
  const mode = process.env.APP_MODE;
  if (
    !["local-test", "local-neon", "staging-test"].includes(mode || "") ||
    !(mode === "staging-test"
      ? origin === "https://descomplica-guaruja-homolog.vercel.app"
      : ["http://127.0.0.1:3001", "http://127.0.0.1:3002"].includes(origin)) ||
    secret.length < 64 ||
    accessCode.length < 20
  )
    throw new Error(
      "Ambiente de teste não configurado. Consulte o guia de configuração.",
    );
  const url = new URL(database);
  const invalidLocal =
    url.hostname !== "127.0.0.1" ||
    url.port !== "54339" ||
    !["/descomplica_local", "/descomplica_test"].includes(url.pathname);
  const neon =
    url.hostname ===
      "ep-lucky-bar-b60e6y11-pooler.c-2.sa-east-1.aws.neon.tech" &&
    url.pathname === "/descomplica_staging" &&
    url.username === "descomplica_app";
  if (
    (mode === "local-test" && invalidLocal) ||
    (mode !== "local-test" && !neon)
  )
    throw new Error("Banco fora do ambiente autorizado.");
  if (
    mode === "staging-test" &&
    (process.env.PREVIEW_ACCESS_CODE || "").length < 20
  )
    throw new Error("Código de acesso de homologação não configurado.");
  return {
    origin,
    host: new URL(origin).host,
    database,
    secret,
    accessCode,
    remote: mode !== "local-test",
    hosted: mode === "staging-test",
  };
}
