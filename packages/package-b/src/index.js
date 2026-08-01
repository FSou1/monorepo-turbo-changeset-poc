// package-b depends on package-c.
import { run as c } from "@fsou1/package-c";

export function run() {
  return `package-b -> ${c()}`;
}
