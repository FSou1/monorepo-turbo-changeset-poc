// package-a depends on package-b (which depends on package-c).
import { run as b } from "@repo/package-b";

export function run() {
  return `package-a -> ${b()}`;
}
