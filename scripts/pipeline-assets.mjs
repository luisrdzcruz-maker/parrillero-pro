import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { spawn } from "child_process";

const SUPPORTED_CATEGORIES = ["setup", "cuts", "vegetables", "icons", "steps", "hero"];
const dryRun = parseDryRun(process.env.DRY_RUN);
const maxImagesPerRun = process.env.MAX_IMAGES_PER_RUN?.trim() || "unlimited";
const onlyAssetId = process.env.ONLY_ASSET_ID?.trim() || "none";

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

function parseDryRun(rawValue) {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") {
    return false;
  }

  const value = String(rawValue).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(value)) {
    return true;
  }
  if (["0", "false", "no", "n", "off"].includes(value)) {
    return false;
  }

  throw new Error(
    'DRY_RUN must be a boolean value (accepted: "true/false", "1/0", "yes/no", "on/off").'
  );
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
  console.log(`  dry run: ${dryRun ? "yes" : "no"}`);
  console.log(`  only asset id: ${onlyAssetId}`);
  console.log(`  max images per run: ${maxImagesPerRun}\n`);

  await run("npm", ["run", "generate:assets", "--", category]);
  if (dryRun) {
    console.log(
      `Skipping post-processing for ${category}: reason DRY_RUN=true (process:assets, build:asset-map)`
    );
  } else {
    await run("npm", ["run", "process:assets", "--", category]);
    await run("npm", ["run", "build:asset-map", "--", category]);
  }

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
