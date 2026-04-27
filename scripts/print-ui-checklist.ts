/**
 * Prints the UI validation checklist to stdout (manual + semi-automated instructions).
 * Run: npx tsx scripts/print-ui-checklist.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const CHECKLIST = join(process.cwd(), "scripts", "ui-validation-checklist.md");

function main() {
  try {
    const body = readFileSync(CHECKLIST, "utf8");
    console.log(body);
  } catch {
    console.error("Could not read:", CHECKLIST);
    process.exitCode = 1;
  }
  console.log("\n---");
  console.log("Semi-automated: open the app in a browser, DevTools → Console, paste the");
  console.log("contents of: scripts/ui-audit.paste-in-console.js");
}

main();
