import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { spawn } from "child_process";

function main() {
  const child = spawn("node", ["scripts/process-assets.mjs", "setup"], {
    stdio: "inherit",
    shell: true,
  });

  child.on("close", (code) => {
    process.exit(code ?? 1);
  });
}

main();