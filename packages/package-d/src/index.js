// package-d depends on package-e.
import { run as e } from "@fsou1/package-e";

export function run() {
  return `package-d -> ${e()}`;
}
