import { readFile } from "node:fs/promises";
import { sendWhatsAppTest } from "../lib/whatsapp";
import { db } from "../lib/db";
// Explicit operator action only. Input JSON lives outside Git and includes a stable requestKey.
try {
  const file = process.argv[2];
  if (!file) throw Error("Informe o caminho do JSON privado de teste.");
  const input = JSON.parse(await readFile(file, "utf8"));
  const result = await sendWhatsAppTest(input);
  console.log(JSON.stringify({ state: result.state, repeated: result.repeated }));
  if (result.state !== "accepted") process.exitCode = 1;
} catch (e) {
  console.error(e instanceof Error ? e.message : "Falha no teste.");
  process.exitCode = 1;
} finally { await db.end(); }
