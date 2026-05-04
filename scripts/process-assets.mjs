import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import sharp from "sharp";
import fs from "fs";
import path from "path";

const SUPPORTED_CATEGORIES = ["setup", "cuts", "vegetables", "icons", "steps", "hero"];
const IMAGE_EXTENSIONS = new Set([".png"]);
const QUALITY = 86;

const CATEGORY_CONFIG = {
  setup: { outputDir: ["public", "setup"], width: 1200, height: 1600, fit: "cover" },
  cuts: { outputDir: ["public", "cuts"], width: 1200, height: 1200, fit: "cover" },
  vegetables: { outputDir: ["public", "vegetables"], width: 1200, height: 1200, fit: "cover" },
  icons: {
    outputDir: ["public", "brand", "icons"],
    width: 512,
    height: 512,
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
  steps: { outputDir: ["public", "steps"], width: 1200, height: 1600, fit: "cover" },
  hero: { outputDir: ["public", "hero"], width: 1200, height: 1600, fit: "cover" },
};

function getCategoriesFromArgs() {
  const category = process.argv[2];
  if (!category) {
    return SUPPORTED_CATEGORIES;
  }
  if (category === "all") {
    return SUPPORTED_CATEGORIES;
  }
  if (!SUPPORTED_CATEGORIES.includes(category)) {
    throw new Error(
      `Unsupported category "${category}". Use one of: ${SUPPORTED_CATEGORIES.join(", ")}, all`
    );
  }
  return [category];
}

function getInputDir(category) {
  return path.join(process.cwd(), "assets", "raw", category);
}

function getOutputDir(category) {
  return path.join(process.cwd(), ...CATEGORY_CONFIG[category].outputDir);
}

function relativePath(filePath) {
  return path.relative(process.cwd(), filePath).replaceAll(path.sep, "/");
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function slugifyFileName(fileName) {
  const slug = fileName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^[-_]+|[-_]+$/g, "")
    .replace(/_{2,}/g, "_")
    .replace(/-{2,}/g, "-");

  if (!slug) {
    throw new Error(`Unable to create slug-safe filename for "${fileName}"`);
  }

  return slug;
}

function shouldSkip(inputPath, outputPath) {
  if (!fs.existsSync(outputPath)) {
    return false;
  }

  const inputStat = fs.statSync(inputPath);
  const outputStat = fs.statSync(outputPath);
  return outputStat.mtimeMs >= inputStat.mtimeMs;
}

function getFileSize(filePath) {
  return fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
}

async function processCategory(category) {
  const config = CATEGORY_CONFIG[category];
  const inputDir = getInputDir(category);
  const outputDir = getOutputDir(category);

  console.log(`\nAsset processing run (${category})`);
  console.log(`source: ${relativePath(inputDir)}`);
  console.log(`output: ${relativePath(outputDir)}`);

  if (!fs.existsSync(inputDir)) {
    console.log(`Skipped: source directory does not exist (${relativePath(inputDir)})`);
    return { processed: 0, skipped: 0, missingSource: true };
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs
    .readdirSync(inputDir)
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()));

  console.log(`files found: ${files.length}`);

  if (files.length === 0) {
    console.log("No source images found.");
    return { processed: 0, skipped: 0, missingSource: false };
  }

  let processed = 0;
  let skipped = 0;
  const outputNames = new Set();

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const baseName = slugifyFileName(path.parse(file).name);
    const outputPath = path.join(outputDir, `${baseName}.webp`);
    const outputName = path.basename(outputPath);

    if (outputNames.has(outputName)) {
      throw new Error(
        `Filename collision after slugging in ${relativePath(inputDir)}: ${outputName}`
      );
    }
    outputNames.add(outputName);

    const inputSize = getFileSize(inputPath);
    if (shouldSkip(inputPath, outputPath)) {
      skipped += 1;
      const outputSize = getFileSize(outputPath);
      console.log(
        `Skipped up-to-date: ${relativePath(inputPath)} -> ${relativePath(outputPath)} ` +
          `(${formatBytes(inputSize)} -> ${formatBytes(outputSize)})`
      );
      continue;
    }

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

    processed += 1;
    const outputSize = getFileSize(outputPath);
    console.log(
      `Processed: ${relativePath(inputPath)} -> ${relativePath(outputPath)} ` +
        `(${formatBytes(inputSize)} -> ${formatBytes(outputSize)})`
    );
  }

  console.log(`Completed ${category}: ${processed} processed, ${skipped} skipped.`);
  return { processed, skipped, missingSource: false };
}

async function run() {
  const categories = getCategoriesFromArgs();
  let processed = 0;
  let skipped = 0;
  let missingSource = 0;

  for (const category of categories) {
    const result = await processCategory(category);
    processed += result.processed;
    skipped += result.skipped;
    if (result.missingSource) {
      missingSource += 1;
    }
  }

  console.log(
    `\nAsset processing completed: ${processed} processed, ${skipped} skipped, ` +
      `${missingSource} missing source folder(s).`
  );
}

run().catch((error) => {
  console.error("Asset processing failed:", error);
  process.exit(1);
});
