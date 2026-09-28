import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
const u = new URL(process.env.TEST_DATABASE_URL || "invalid");
if (
  u.hostname !== "127.0.0.1" ||
  u.port !== "54339" ||
  u.pathname !== "/descomplica_test"
)
  throw Error("Testes exigem banco local isolado.");
const result = spawnSync(
  process.execPath,
  [
    "--import",
    "tsx",
    "--test",
    "--test-concurrency=1",
    ...readdirSync("tests")
      .filter((f) => f.endsWith(".test.ts"))
      .map((f) => "tests/" + f),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      OPENAI_API_KEY: "",
      AI_ENABLED: "false",
      WHATSAPP_MODE: "disabled",
      WHATSAPP_ACCESS_TOKEN: "",
      WHATSAPP_APP_SECRET: "",
      WHATSAPP_VERIFY_TOKEN: "",
      WHATSAPP_PHONE_NUMBER_ID: "",
      WHATSAPP_WABA_ID: "",
      WHATSAPP_TEST_RECIPIENTS: "",
      APP_MODE: "local-test",
      DATABASE_URL: process.env.TEST_DATABASE_URL,
    },
  },
);
process.exit(result.status ?? 1);
