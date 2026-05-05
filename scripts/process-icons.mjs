import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import sharp from "sharp";

const ICON_CATEGORIES = [
  "ui",
  "animals",
  "cuts",
  "equipment",
  "methods",
  "warnings",
  "live",
  "setup",
];

const SOURCE_ROOT = path.join(process.cwd(), "assets", "raw", "icons");
const OUTPUT_ROOT = path.join(process.cwd(), "public", "icons");
const IMAGE_EXTENSIONS = new Set([".png"]);
const ICON_SIZE = 512;
const WEBP_QUALITY = 84;
const KEBAB_CASE_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/;

function relativePath(filePath) {
  return path.relative(process.cwd(), filePath).replaceAll(path.sep, "/");
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getPngFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(dir, entry.name))
    .sort((a, b) => relativePath(a).localeCompare(relativePath(b)));
}

function getRootPngFiles() {
  return getPngFiles(SOURCE_ROOT);
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

async function processIcon(inputPath, outputPath) {
  const inputSize = getFileSize(inputPath);

  if (shouldSkip(inputPath, outputPath)) {
    const outputSize = getFileSize(outputPath);
    console.log(
      `Skipped up-to-date: ${relativePath(inputPath)} -> ${relativePath(outputPath)} ` +
        `(${formatBytes(inputSize)} -> ${formatBytes(outputSize)})`,
    );
    return "skipped";
  }

  await sharp(inputPath)
    .rotate()
    .resize({
      width: ICON_SIZE,
      height: ICON_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: WEBP_QUALITY,
      effort: 6,
    })
    .toFile(outputPath);

  const outputSize = getFileSize(outputPath);
  console.log(
    `Processed: ${relativePath(inputPath)} -> ${relativePath(outputPath)} ` +
      `(${formatBytes(inputSize)} -> ${formatBytes(outputSize)})`,
  );
  return "processed";
}

async function processCategory(category) {
  const sourceDir = path.join(SOURCE_ROOT, category);
  const outputDir = path.join(OUTPUT_ROOT, category);
  const files = getPngFiles(sourceDir);

  console.log(`\nIcon processing run (${category})`);
  console.log(`source: ${relativePath(sourceDir)}`);
  console.log(`output: ${relativePath(outputDir)}`);
  console.log(`files found: ${files.length}`);

  if (files.length === 0) {
    console.log("No source icons found.");
    return { processed: 0, skipped: 0 };
  }

  fs.mkdirSync(outputDir, { recursive: true });

  let processed = 0;
  let skipped = 0;

  for (const inputPath of files) {
    const fileName = path.basename(inputPath);

    if (!KEBAB_CASE_FILE.test(fileName)) {
      throw new Error(
        `Invalid icon filename: ${relativePath(inputPath)}. Use lowercase kebab-case PNG names.`,
      );
    }

    const outputPath = path.join(outputDir, `${path.parse(fileName).name}.webp`);
    const result = await processIcon(inputPath, outputPath);

    if (result === "processed") processed += 1;
    if (result === "skipped") skipped += 1;
  }

  console.log(`Completed ${category}: ${processed} processed, ${skipped} skipped.`);
  return { processed, skipped };
}

async function run() {
  console.log("\nIcon processing run");
  console.log(`source root: ${relativePath(SOURCE_ROOT)}`);
  console.log(`output root: ${relativePath(OUTPUT_ROOT)}`);

  const rootFiles = getRootPngFiles();
  if (rootFiles.length > 0) {
    console.log("\nSkipped root-level PNG files outside category folders:");
    for (const file of rootFiles) {
      console.log(`- ${relativePath(file)}`);
    }
  }

  let processed = 0;
  let skipped = 0;

  for (const category of ICON_CATEGORIES) {
    const result = await processCategory(category);
    processed += result.processed;
    skipped += result.skipped;
  }

  console.log(`\nIcon processing completed: ${processed} processed, ${skipped} skipped.`);
}

run().catch((error) => {
  console.error("Icon processing failed:", error);
  process.exit(1);
});
