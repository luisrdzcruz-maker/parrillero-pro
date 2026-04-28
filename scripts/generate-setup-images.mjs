import fs from "fs";
import path from "path";

const promptsPath = path.join(process.cwd(), "data", "setup-prompts.json");
const outputDir = path.join(process.cwd(), "assets", "raw", "setup");
const dryRun = ["1", "true", "yes"].includes(String(process.env.DRY_RUN ?? "").toLowerCase());

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

async function run() {
  const prompts = readSetupPrompts();
  const summary = {
    generated: [],
    skipped: [],
    failed: [],
  };

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const item of prompts) {
    const outputPath = path.join(outputDir, `${item.id}.png`);

    if (fs.existsSync(outputPath)) {
      summary.skipped.push(item.id);
      console.log(`Skipped existing image: ${item.id}.png`);
      continue;
    }

    if (dryRun) {
      summary.generated.push(item.id);
      console.log(`[DRY_RUN] Would generate: ${item.id}.png`);
      continue;
    }

    try {
      const image = await generateImage(item.prompt);
      fs.writeFileSync(outputPath, image);
      summary.generated.push(item.id);
      console.log(`Generated image: ${item.id}.png`);
    } catch (error) {
      summary.failed.push(item.id);
      console.error(`Failed image: ${item.id}.png`);
      console.error(error);
    }
  }

  console.log("\nSummary");
  console.log(`generated: ${summary.generated.length}`);
  console.log(`skipped: ${summary.skipped.length}`);
  console.log(`failed: ${summary.failed.length}`);

  if (summary.failed.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("Setup image generation failed:", error);
  process.exit(1);
});
