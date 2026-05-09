import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const roots = ["server.js", "public", "src", "scripts", "test"];
const files = roots.flatMap((root) => collectJavaScriptFiles(root)).sort();

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`Syntax lint passed for ${files.length} JavaScript files.`);

function collectJavaScriptFiles(target) {
  if (!fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return target.endsWith(".js") ? [target] : [];

  return fs.readdirSync(target).flatMap((entry) => {
    const fullPath = path.join(target, entry);
    if (fullPath.includes(`node_modules${path.sep}`)) return [];
    return collectJavaScriptFiles(fullPath);
  });
}

