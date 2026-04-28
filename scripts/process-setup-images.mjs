import sharp from "sharp";
import fs from "fs";
import path from "path";

const inputDir = path.join(process.cwd(), "assets", "raw", "setup");
const outputDir = path.join(process.cwd(), "public", "setup");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputDir);

console.log("Input directory:", inputDir);
console.log("Files found:", files);

const filteredFiles = files.filter((file) =>
  [".png", ".jpg", ".jpeg"].includes(path.extname(file).toLowerCase())
);

async function run() {
  if (filteredFiles.length === 0) {
    console.log("⚠️ No hay imágenes en assets/raw/setup");
    return;
  }

  for (const file of filteredFiles) {
    const inputPath = path.join(inputDir, file);
    const baseName = path.parse(file).name;
    const outputPath = path.join(outputDir, `${baseName}.webp`);

    await sharp(inputPath)
      .resize({
        width: 1200,
        height: 1600,
        fit: "cover",
        position: "center",
      })
      .webp({
        quality: 86,
        effort: 6,
      })
      .toFile(outputPath);

    console.log(`✅ ${file} → ${baseName}.webp`);
  }

  console.log("🔥 Imágenes setup procesadas.");
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});