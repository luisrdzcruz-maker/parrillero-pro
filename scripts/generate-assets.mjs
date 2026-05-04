import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";

const SUPPORTED_CATEGORIES = ["setup", "cuts", "vegetables", "icons", "steps", "hero"];
const dryRun = parseDryRun(process.env.DRY_RUN);
const maxImagesPerRun = parseMaxImagesPerRun(process.env.MAX_IMAGES_PER_RUN);
const onlyAssetId = parseOnlyAssetId(process.env.ONLY_ASSET_ID);
const maxAttempts = 3;
const baseRetryDelayMs = 1000;

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

function getPromptsPath(category) {
  return path.join(process.cwd(), "data", "assets", `${category}-prompts.json`);
}

function getOutputDir(category) {
  return path.join(process.cwd(), "assets", "raw", category);
}

function assertSafeId(id) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error(`Invalid asset id: ${id}`);
  }
}

function readAssetPrompts(category) {
  const promptsPath = getPromptsPath(category);
  if (!fs.existsSync(promptsPath)) {
    throw new Error(`Prompt file not found: ${path.relative(process.cwd(), promptsPath)}`);
  }

  const prompts = JSON.parse(fs.readFileSync(promptsPath, "utf8"));
  if (!Array.isArray(prompts)) {
    throw new Error(`${path.relative(process.cwd(), promptsPath)} must contain an array.`);
  }

  return prompts.map((item, index) => {
    if (!item || typeof item.id !== "string" || typeof item.prompt !== "string") {
      throw new Error(
        `Invalid prompt item at index ${index} in ${path.relative(
          process.cwd(),
          promptsPath
        )}. Expected { id, prompt }.`
      );
    }

    assertSafeId(item.id);
    return { id: item.id, prompt: item.prompt };
  });
}

function decodeBase64Image(responseJson) {
  const image = responseJson?.data?.[0];
  if (typeof image?.b64_json === "string") {
    return Buffer.from(image.b64_json, "base64");
  }
  throw new Error("Image API response did not include data[0].b64_json.");
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

function parseMaxImagesPerRun(rawValue) {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") {
    return Number.POSITIVE_INFINITY;
  }

  const value = String(rawValue).trim();
  if (!/^\d+$/.test(value)) {
    throw new Error("MAX_IMAGES_PER_RUN must be a non-negative integer.");
  }
  const parsed = Number.parseInt(value, 10);
  return parsed;
}

function parseOnlyAssetId(rawValue) {
  if (rawValue === undefined || rawValue === null) {
    return null;
  }

  const value = String(rawValue).trim();
  if (value === "") {
    return null;
  }

  assertSafeId(value);
  return value;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatOutputFilename(category, id) {
  return path.join("assets", "raw", category, `${id}.png`);
}

function logAssetDecision(action, item, outputFilename, detail) {
  console.log(`${action}: ${item.id}`);
  console.log(`  output filename: ${outputFilename}`);
  if (detail) {
    console.log(`  ${detail}`);
  }
}

async function generateImage(prompt) {
  const apiKey = process.env.IMAGE_API_KEY;
  if (!apiKey) {
    throw new Error("IMAGE_API_KEY is required when DRY_RUN is not enabled.");
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.IMAGE_MODEL ?? "gpt-image-1",
      prompt,
      size: "1024x1536",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Image API failed with ${response.status}: ${body}`);
  }

  return decodeBase64Image(await response.json());
}

async function generateImageWithRetry(item) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await generateImage(item.prompt);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) {
        break;
      }
      const delayMs = baseRetryDelayMs * 2 ** (attempt - 1);
      console.warn(
        `Retrying ${item.id}.png (${attempt}/${maxAttempts}) after ${delayMs}ms: ${error.message}`
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
}

async function run() {
  const category = getCategoryFromArgs();
  const prompts = readAssetPrompts(category);
  const outputDir = getOutputDir(category);
  const promptIds = new Set(prompts.map((item) => item.id));

  const summary = {
    category,
    totalPrompts: prompts.length,
    skipped: [],
    generated: [],
    failed: [],
    remaining: [],
  };

  if (onlyAssetId && !promptIds.has(onlyAssetId)) {
    throw new Error(`ONLY_ASSET_ID "${onlyAssetId}" not found in ${category} prompts.`);
  }

  if (!dryRun && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const pending = [];
  for (const item of prompts) {
    const outputPath = path.join(outputDir, `${item.id}.png`);
    const outputFilename = formatOutputFilename(category, item.id);

    if (onlyAssetId && item.id !== onlyAssetId) {
      summary.skipped.push(item.id);
      logAssetDecision("Skipped asset", item, outputFilename, `reason: ONLY_ASSET_ID=${onlyAssetId}`);
      continue;
    }

    if (fs.existsSync(outputPath)) {
      summary.skipped.push(item.id);
      logAssetDecision("Skipped asset", item, outputFilename, "reason: output file already exists");
    } else {
      pending.push(item);
    }
  }

  const selectedToProcess = pending.slice(0, maxImagesPerRun);
  const deferred = pending.slice(selectedToProcess.length);
  summary.remaining.push(...deferred.map((item) => item.id));

  for (const item of selectedToProcess) {
    const outputFilename = formatOutputFilename(category, item.id);
    logAssetDecision("Selected asset", item, outputFilename, "reason: scheduled for this run");
  }

  for (const item of deferred) {
    const outputFilename = formatOutputFilename(category, item.id);
    logAssetDecision(
      "Skipped asset",
      item,
      outputFilename,
      `reason: MAX_IMAGES_PER_RUN=${maxImagesPerRun}`
    );
  }

  console.log(`Asset generation run (${category})`);
  console.log(`total prompts: ${summary.totalPrompts}`);
  console.log(`skipped: ${summary.skipped.length}`);
  console.log(`selected this run: ${selectedToProcess.length}`);
  console.log(`remaining: ${summary.remaining.length}`);
  console.log(`dry run: ${dryRun ? "yes" : "no"}`);
  console.log(`only asset id: ${onlyAssetId ?? "none"}`);
  console.log(
    `max images per run: ${
      Number.isFinite(maxImagesPerRun) ? maxImagesPerRun : "unlimited"
    }\n`
  );

  if (!dryRun && selectedToProcess.length > 0 && !process.env.IMAGE_API_KEY) {
    throw new Error("IMAGE_API_KEY is required when DRY_RUN is not enabled.");
  }

  for (const item of selectedToProcess) {
    const outputPath = path.join(outputDir, `${item.id}.png`);
    const outputFilename = formatOutputFilename(category, item.id);

    if (dryRun) {
      logAssetDecision("DRY_RUN would generate asset", item, outputFilename, "reason: DRY_RUN=true");
      continue;
    }

    try {
      const image = await generateImageWithRetry(item);
      fs.writeFileSync(outputPath, image);
      summary.generated.push(item.id);
      logAssetDecision("Generated asset", item, outputFilename);
    } catch (error) {
      summary.failed.push(item.id);
      summary.remaining.push(item.id);
      console.error(`Failed asset: ${item.id}`);
      console.error(`  output filename: ${outputFilename}`);
      console.error(error);
    }
  }

  console.log("\nSummary");
  console.log(`total prompts: ${summary.totalPrompts}`);
  console.log(`skipped: ${summary.skipped.length}`);
  console.log(`generated: ${summary.generated.length}`);
  console.log(`failed: ${summary.failed.length}`);
  console.log(`remaining: ${summary.remaining.length}`);

  if (summary.failed.length > 0) {
    throw new Error(
      `Asset generation failed for ${summary.failed.length} ${category} item(s).`
    );
  }
}

run().catch((error) => {
  console.error("Asset generation failed:", error);
  process.exit(1);
});
