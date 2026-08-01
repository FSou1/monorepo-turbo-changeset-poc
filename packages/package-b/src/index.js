// package-b depends on package-c.
import { run as c } from "@repo/package-c";

export function run() {
  return `package-b -> ${c()}`;
}
