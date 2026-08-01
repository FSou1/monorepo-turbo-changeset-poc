// Generic "test": import the built entrypoint and assert the run() contract.
// Because A/C import package-b, this also proves cross-package resolution works
// (Turbo builds package-b first via the `^build` dependency).
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const cwd = process.cwd();
const pkg = JSON.parse(readFileSync(path.join(cwd, "package.json"), "utf8"));

const entry = pathToFileURL(path.join(cwd, "dist", "index.js"));
const mod = await import(entry);

assert.equal(typeof mod.run, "function", `${pkg.name} must export run()`);
const out = mod.run();
assert.ok(
  typeof out === "string" && out.length > 0,
  `${pkg.name}.run() must return a non-empty string`,
);

console.log(`✓ tested ${pkg.name} -> run() = "${out}"`);
