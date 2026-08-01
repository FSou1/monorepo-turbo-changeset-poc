// package-d depends on package-e.
import { run as e } from "@repo/package-e";

export function run() {
  return `package-d -> ${e()}`;
}
