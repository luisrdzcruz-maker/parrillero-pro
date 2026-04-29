import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { spawn } from "child_process";

const SUPPORTED_CATEGORIES = ["setup", "cuts", "vegetables", "icons", "steps", "hero"];

function getCategoryFromArgs() {
  const category = process.argv[2];
  if (!category) {
    throw new Error(
      `Missing category argument. Use one of: ${SUPPORTED_CATEGORIES.join(", ")}, all`
    );
  }
  if (category !== "all" && !SUPPORTED_CATEGORIES.includes(category)) {
    throw new Error(
      `Unsupported category "${category}". Use one of: ${SUPPORTED_CATEGORIES.join(", ")}, all`
    );
  }
  return category;
}

function run(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
      }
    });
  });
}

async function runCategory(category) {
  console.log(`\nAsset pipeline started (${category})\n`);

  await run("npm", ["run", "generate:assets", "--", category]);
  await run("npm", ["run", "process:assets", "--", category]);
  await run("npm", ["run", "build:asset-map", "--", category]);

  console.log(`\nAsset pipeline completed (${category})`);
}

async function main() {
  const category = getCategoryFromArgs();
  const categories = category === "all" ? SUPPORTED_CATEGORIES : [category];

  for (const currentCategory of categories) {
    await runCategory(currentCategory);
  }
}

main().catch((error) => {
  console.error("\nAsset pipeline failed");
  console.error(error.message);
  process.exit(1);
});
