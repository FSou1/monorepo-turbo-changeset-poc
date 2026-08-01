// package-a depends on package-b (which depends on package-c).
import { run as b } from "@repo/package-b";

export function run() {
  console.log("package-a is running");

  return `package-a -> ${b()}`;
}
