import fs from "node:fs/promises";
import path from "node:path";
const app = path.resolve(import.meta.dirname, ".."),
  repo = path.resolve(app, "..");
const project = JSON.parse(
  await fs.readFile(path.join(app, ".local/vercel-project.json"), "utf8"),
);
if (project.name !== "descomplica-guaruja-homolog")
  throw Error("Projeto de homologação obrigatório.");
const target = path.join(app, ".local/deploy");
await fs.rm(target, { recursive: true, force: true });
await fs.mkdir(path.join(target, "app"), { recursive: true });
const allowed = [
  "app",
  "components",
  "lib",
  "public",
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "proxy.ts",
  "next-env.d.ts",
  "tsconfig.json",
];
for (const entry of allowed)
  await fs.cp(path.join(app, entry), path.join(target, "app", entry), {
    recursive: true,
  });
await fs.cp(
  path.join(repo, "design-system"),
  path.join(target, "design-system"),
  { recursive: true },
);
await fs.mkdir(path.join(target, ".vercel"), { recursive: true });
await fs.writeFile(
  path.join(target, ".vercel/project.json"),
  JSON.stringify({
    projectId: project.id,
    orgId: project.accountId,
    projectName: project.name,
  }),
);
await fs.writeFile(
  path.join(target, "vercel.json"),
  JSON.stringify({ framework: "nextjs", regions: ["gru1"] }),
);
await fs.writeFile(
  path.join(target, ".vercelignore"),
  "**/.env*\n**/.local/**\n**/node_modules/**\n**/.next/**\n",
);
console.log(
  "Pacote de homologação preparado: código e assets permitidos, sem segredos ou documentos privados.",
);
