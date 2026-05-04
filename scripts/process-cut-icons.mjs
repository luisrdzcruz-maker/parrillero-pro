import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import sharp from "sharp";

const SOURCE_DIR = path.join(process.cwd(), "assets", "raw", "cut-icons");
const OUTPUT_DIR = path.join(process.cwd(), "public", "cut-icons");
const IMAGE_EXTENSIONS = new Set([".png"]);
const ICON_SIZE = 256;
const WEBP_QUALITY = 80;

function relativePath(filePath) {
  return path.relative(process.cwd(), filePath).replaceAll(path.sep, "/");
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
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

function getPngFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getPngFiles(entryPath));
      continue;
    }

    if (entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(entryPath);
    }
  }

  return files.sort((a, b) => relativePath(a).localeCompare(relativePath(b)));
}

function shouldSkip(inputPath, outputPath) {
  if (!fs.existsSync(outputPath)) {
    return false;
  }

  const inputStat = fs.statSync(inputPath);
  const outputStat = fs.statSync(outputPath);
  return outputStat.mtimeMs >= inputStat.mtimeMs;
}

function getOutputPath(inputPath) {
  const relativeInput = path.relative(SOURCE_DIR, inputPath);
  const outputRelativeDir = path.dirname(relativeInput);
  const outputName = `${slugifyFileName(path.parse(inputPath).name)}.webp`;

  return outputRelativeDir === "."
    ? path.join(OUTPUT_DIR, outputName)
    : path.join(OUTPUT_DIR, outputRelativeDir, outputName);
}

function getFileSize(filePath) {
  return fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
}

async function processCutIcons() {
  console.log("\nCut icon processing run");
  console.log(`source: ${relativePath(SOURCE_DIR)}`);
  console.log(`output: ${relativePath(OUTPUT_DIR)}`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  if (!fs.existsSync(SOURCE_DIR)) {
    console.log(`Skipped: source directory does not exist (${relativePath(SOURCE_DIR)})`);
    return { processed: 0, skipped: 0, missingSource: true };
  }

  const files = getPngFiles(SOURCE_DIR);
  const outputPaths = new Set();
  let processed = 0;
  let skipped = 0;

  console.log(`files found: ${files.length}`);

  if (files.length === 0) {
    console.log("No source icons found.");
    return { processed, skipped, missingSource: false };
  }

  for (const inputPath of files) {
    const outputPath = getOutputPath(inputPath);
    const outputKey = path.relative(OUTPUT_DIR, outputPath).replaceAll(path.sep, "/");

    if (outputPaths.has(outputKey)) {
      throw new Error(`Filename collision after slugging: ${outputKey}`);
    }
    outputPaths.add(outputKey);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

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

    processed += 1;
    const outputSize = getFileSize(outputPath);
    console.log(
      `Processed: ${relativePath(inputPath)} -> ${relativePath(outputPath)} ` +
        `(${formatBytes(inputSize)} -> ${formatBytes(outputSize)})`
    );
  }

  console.log(`Completed cut icons: ${processed} processed, ${skipped} skipped.`);
  return { processed, skipped, missingSource: false };
}

processCutIcons()
  .then(({ processed, skipped, missingSource }) => {
    console.log(
      `\nCut icon processing completed: ${processed} processed, ${skipped} skipped, ` +
        `${missingSource ? 1 : 0} missing source folder(s).`
    );
  })
  .catch((error) => {
    console.error("Cut icon processing failed:", error);
    process.exit(1);
  });
