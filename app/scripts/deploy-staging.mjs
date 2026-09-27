import { spawnSync } from "node:child_process";
import path from "node:path";
const cwd = path.resolve(import.meta.dirname, "..");
function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
const branch = spawnSync("git", ["branch", "--show-current"], {
  cwd,
  encoding: "utf8",
}).stdout.trim();
if (branch !== "feat/descomplica-v2-aprovacao")
  throw Error("Use a branch de homologação feat/descomplica-v2-aprovacao.");
run("npm", ["test"]);
run("npm", ["run", "build"]);
run(process.execPath, ["scripts/stage-deploy.mjs"]);
run("vercel", [
  "deploy",
  path.join(cwd, ".local/deploy"),
  "--prod",
  "--yes",
  "--scope",
  "gustavo-s",
]);
