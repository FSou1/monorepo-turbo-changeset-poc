// Generic "build": compile src/ -> dist/ (a copy here, since this POC needs no
// bundler). Turbo caches the `dist/**` output declared in turbo.json.
import { readFileSync } from "node:fs";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();
const pkg = JSON.parse(readFileSync(path.join(cwd, "package.json"), "utf8"));

await rm(path.join(cwd, "dist"), { recursive: true, force: true });
await mkdir(path.join(cwd, "dist"), { recursive: true });
await cp(path.join(cwd, "src"), path.join(cwd, "dist"), { recursive: true });

console.log(`✓ built ${pkg.name}`);
