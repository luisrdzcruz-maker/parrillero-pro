import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";


const promptsPath = path.join(process.cwd(), "data", "setup-prompts.json");
const outputDir = path.join(process.cwd(), "assets", "raw", "setup");
const dryRun = ["1", "true", "yes"].includes(String(process.env.DRY_RUN ?? "").toLowerCase());
const maxImagesPerRun = parseMaxImagesPerRun(process.env.MAX_IMAGES_PER_RUN);
const maxAttempts = 3;
const baseRetryDelayMs = 1000;

function assertSafeId(id) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error(`Invalid setup image id: ${id}`);
  }
}

function readSetupPrompts() {
  const prompts = JSON.parse(fs.readFileSync(promptsPath, "utf8"));

  if (!Array.isArray(prompts)) {
    throw new Error("data/setup-prompts.json must contain an array.");
  }

  return prompts.map((item, index) => {
    if (!item || typeof item.id !== "string" || typeof item.prompt !== "string") {
      throw new Error(`Invalid prompt item at index ${index}. Expected { id, prompt }.`);
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

function parseMaxImagesPerRun(rawValue) {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = Number.parseInt(String(rawValue), 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 0) {
    throw new Error("MAX_IMAGES_PER_RUN must be a non-negative integer.");
  }

  return parsed;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
  const prompts = readSetupPrompts();
  const summary = {
    totalPrompts: prompts.length,
    generated: [],
    skipped: [],
    failed: [],
    remaining: [],
  };

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const pending = [];
  for (const item of prompts) {
    const outputPath = path.join(outputDir, `${item.id}.png`);
    if (fs.existsSync(outputPath)) {
      summary.skipped.push(item.id);
    } else {
      pending.push(item);
    }
  }

  const selectedToProcess = pending.slice(0, maxImagesPerRun);
  const deferred = pending.slice(selectedToProcess.length);
  summary.remaining.push(...deferred.map((item) => item.id));

  console.log("Setup image generation run");
  console.log(`total prompts: ${summary.totalPrompts}`);
  console.log(`skipped: ${summary.skipped.length}`);
  console.log(`selected this run: ${selectedToProcess.length}`);
  console.log(`remaining: ${summary.remaining.length}`);
  console.log(`dry run: ${dryRun ? "yes" : "no"}`);
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

    if (dryRun) {
      console.log(`[DRY_RUN] Would generate: ${item.id}.png`);
      continue;
    }

    try {
      const image = await generateImageWithRetry(item);
      fs.writeFileSync(outputPath, image);
      summary.generated.push(item.id);
      console.log(`Generated image: ${item.id}.png`);
    } catch (error) {
      summary.failed.push(item.id);
      summary.remaining.push(item.id);
      console.error(`Failed image: ${item.id}.png`);
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
    throw new Error(`Image generation failed for ${summary.failed.length} item(s).`);
  }
}

run().catch((error) => {
  console.error("Setup image generation failed:", error);
  process.exit(1);
});
