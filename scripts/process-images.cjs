const sharp = require("sharp");
const fs = require("fs-extra");
const path = require("path");

const INPUT_DIR = path.join(__dirname, "../assets/raw/verduras");
const OUTPUT_DIR = path.join(__dirname, "../public/cuts");

const SIZE = 800;
const QUALITY = 75;
const EFFORT = 4;

const REQUIRED_FILES = [
  "maiz.png",
  "berenjena.png",
  "patata.png",
  "esparragos.png",
  "pimientos.png",
  "setas.png",
  "cebolla.png",
  "zanahoria.png",
  "calabacin.png",
];

function toSafeFilename(filename) {
  const parsed = path.parse(filename);

  return parsed.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function processImage(filename) {
  const inputPath = path.join(INPUT_DIR, filename);
  const safeName = toSafeFilename(filename);
  const outputPath = path.join(OUTPUT_DIR, `${safeName}.webp`);

  await fs.ensureDir(OUTPUT_DIR);

  await sharp(inputPath)
    .rotate()
    .resize(SIZE, SIZE, {
      fit: "cover",
      position: "attention",
    })
    .webp({
      quality: QUALITY,
      effort: EFFORT,
    })
    .toFile(outputPath);

  console.log(`✅ ${filename} -> ${path.relative(OUTPUT_DIR, outputPath)}`);
}

async function run() {
  console.log("📂 INPUT_DIR:", INPUT_DIR);
  console.log("📂 OUTPUT_DIR:", OUTPUT_DIR);

  const inputExists = await fs.pathExists(INPUT_DIR);
  console.log("📁 assets/raw/verduras exists:", inputExists);

  if (!inputExists) {
    console.log("❌ /assets/raw/verduras does not exist");
    return;
  }

  await fs.ensureDir(OUTPUT_DIR);

  const files = [];
  const missingFiles = [];

  for (const filename of REQUIRED_FILES) {
    const inputPath = path.join(INPUT_DIR, filename);

    if (await fs.pathExists(inputPath)) {
      files.push(filename);
    } else {
      missingFiles.push(filename);
    }
  }

  console.log("📸 Vegetable images found:", files.length);

  if (missingFiles.length > 0) {
    console.log("⚠️ Missing required images:");
    for (const filename of missingFiles) {
      console.log(`   - ${filename}`);
    }
  }

  if (files.length === 0) {
    console.log("⚠️ No .png images found in assets/raw/verduras");
    return;
  }

  for (const filename of files) {
    try {
      await processImage(filename);
    } catch (error) {
      console.error(`❌ Error processing ${filename}`);
      console.error(error.message);
    }
  }

  console.log("🔥 Process finished.");
}

run();