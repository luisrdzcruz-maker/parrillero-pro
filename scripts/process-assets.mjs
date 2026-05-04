import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import sharp from "sharp";
import fs from "fs";
import path from "path";

const SUPPORTED_CATEGORIES = ["setup", "cuts", "vegetables", "icons", "steps", "hero"];
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);
const QUALITY = 86;

const CATEGORY_CONFIG = {
  setup: { width: 1200, height: 1600, fit: "cover" },
  cuts: { width: 1200, height: 1200, fit: "cover" },
  vegetables: { width: 1200, height: 1200, fit: "cover" },
  icons: {
    width: 512,
    height: 512,
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
  steps: { width: 1200, height: 1600, fit: "cover" },
  hero: { width: 1200, height: 1600, fit: "cover" },
};

function getCategoryFromArgs() {
  const category = process.argv[2];
  if (!category) {
    throw new Error(
      `Missing category argument. Use one of: ${SUPPORTED_CATEGORIES.join(", ")}`
    );
  }
  if (!SUPPORTED_CATEGORIES.includes(category)) {
    throw new Error(
      `Unsupported category "${category}". Use one of: ${SUPPORTED_CATEGORIES.join(", ")}`
    );
  }
  return category;
}

function getInputDir(category) {
  return path.join(process.cwd(), "assets", "raw", category);
}

function getOutputDir(category) {
  return path.join(process.cwd(), "public", category);
}

async function run() {
  const category = getCategoryFromArgs();
  const config = CATEGORY_CONFIG[category];
  const inputDir = getInputDir(category);
  const outputDir = getOutputDir(category);

  if (!fs.existsSync(inputDir)) {
    throw new Error(`Input directory does not exist: ${path.relative(process.cwd(), inputDir)}`);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs
    .readdirSync(inputDir)
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()));

  console.log(`Asset processing run (${category})`);
  console.log(`input: ${path.relative(process.cwd(), inputDir)}`);
  console.log(`output: ${path.relative(process.cwd(), outputDir)}`);
  console.log(`files found: ${files.length}`);

  if (files.length === 0) {
    console.log("No source images found.");
    return;
  }

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const baseName = path.parse(file).name;
    const outputPath = path.join(outputDir, `${baseName}.webp`);

    const transformer = sharp(inputPath).resize({
      width: config.width,
      height: config.height,
      fit: config.fit,
      position: "center",
      background: config.background,
    });

    await transformer
      .webp({
        quality: QUALITY,
        effort: 6,
      })
      .toFile(outputPath);

    console.log(`Processed: ${file} -> ${baseName}.webp`);
  }

  console.log(`Completed processing ${files.length} ${category} image(s).`);
}

run().catch((error) => {
  console.error("Asset processing failed:", error);
  process.exit(1);
});
