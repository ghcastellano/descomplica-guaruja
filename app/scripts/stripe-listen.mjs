// Local Stripe sandbox only. Keep signing secrets out of terminal output.
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const profile = path.join(root, ".local/stripe.toml");
const envPath = path.join(root, ".env.local");
if (!existsSync(profile))
  throw Error(
    "Crie o sandbox e salve o perfil em .local/stripe.toml primeiro.",
  );
const env = readFileSync(envPath, "utf8");
const origin = env.match(/^APP_ORIGIN=(.+)$/m)?.[1];
if (
  !env.match(/^APP_MODE=local-(test|neon)$/m) ||
  !["http://127.0.0.1:3001", "http://127.0.0.1:3002"].includes(origin)
)
  throw Error("Somente prévia local.");
const child = spawn(
  "npm",
  [
    "exec",
    "--yes",
    "--package=@stripe/cli",
    "--",
    "stripe",
    "listen",
    "--config",
    profile,
    "--project-name",
    "descomplica-local",
    "--events",
    "checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.expired",
    "--forward-to",
    origin + "/api/stripe/webhook",
  ],
  { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
);
let buffer = "";
function output(chunk) {
  buffer += chunk.toString();
  const lines = buffer.split(/\r?\n/);
  buffer = lines.pop() || "";
  for (const line of lines) {
    const m = line.match(/whsec_[A-Za-z0-9]+/);
    if (m) {
      const current = readFileSync(envPath, "utf8")
        .split("\n")
        .filter((l) => !l.startsWith("STRIPE_WEBHOOK_SECRET="));
      writeFileSync(
        envPath,
        current.join("\n").trimEnd() + "\nSTRIPE_WEBHOOK_SECRET=" + m[0] + "\n",
        { mode: 0o600 },
      );
      console.log(
        "Webhook de teste conectado. Segredo salvo em .env.local; reinicie o app se a configuração mudou.",
      );
    } else {
      console.log(
        line.replace(/\b[A-Za-z]+_(?:test|live)_[A-Za-z0-9]+/g, "[credencial]"),
      );
    }
  }
}
child.stdout.on("data", output);
child.stderr.on("data", output);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code || 0));
