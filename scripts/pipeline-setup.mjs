import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { spawn } from "child_process";

async function main() {
  const child = spawn("node", ["scripts/pipeline-assets.mjs", "setup"], {
    stdio: "inherit",
    shell: true,
  });

  child.on("close", (code) => {
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error("\nPipeline failed");
  console.error(error.message);
  process.exit(1);
});