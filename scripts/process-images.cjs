const sharp = require("sharp");
const fs = require("fs-extra");
const path = require("path");

const INPUT_DIR = path.join(__dirname, "../assets/raw");
const OUTPUT_DIR = path.join(__dirname, "../public/images");

const SIZE = 800;
const QUALITY = 75;
const EFFORT = 4;

const VALID_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

async function walk(dir, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath, baseDir)));
    } else {
      const ext = path.extname(entry.name).toLowerCase();

      if (VALID_EXTENSIONS.includes(ext)) {
        files.push({
          inputPath: fullPath,
          relativePath: path.relative(baseDir, fullPath),
        });
      }
    }
  }

  return files;
}

async function processImage(inputPath, relativePath) {
  const parsed = path.parse(relativePath);
  const outputFolder = path.join(OUTPUT_DIR, parsed.dir);
  const outputPath = path.join(outputFolder, `${parsed.name}.webp`);

  await fs.ensureDir(outputFolder);

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

  console.log(`✅ ${relativePath} -> ${path.relative(OUTPUT_DIR, outputPath)}`);
}

async function run() {
  console.log("📂 INPUT_DIR:", INPUT_DIR);
  console.log("📂 OUTPUT_DIR:", OUTPUT_DIR);

  const inputExists = await fs.pathExists(INPUT_DIR);
  console.log("📁 Existe assets/raw:", inputExists);

  if (!inputExists) {
    console.log("❌ No existe /assets/raw");
    return;
  }

  await fs.ensureDir(OUTPUT_DIR);

  const files = await walk(INPUT_DIR);

  console.log("📸 Imágenes encontradas:", files.length);

  if (files.length === 0) {
    console.log("⚠️ No se encontraron imágenes .jpg, .jpeg, .png o .webp");
    return;
  }

  for (const file of files) {
    try {
      await processImage(file.inputPath, file.relativePath);
    } catch (error) {
      console.error(`❌ Error procesando ${file.relativePath}`);
      console.error(error.message);
    }
  }

  console.log("🔥 Proceso terminado.");
}

run();