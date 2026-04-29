import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";

const SUPPORTED_CATEGORIES = ["setup", "cuts", "vegetables", "icons", "steps"];

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

function assertArray(value, filePath) {
  if (!Array.isArray(value)) {
    throw new Error(`${filePath} must contain an array.`);
  }
}

function toPascalCase(value) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

function buildKey(item) {
  if (typeof item.equipment === "string" && typeof item.setup === "string") {
    return `${item.equipment}:${item.setup}`;
  }
  if (typeof item.animal === "string" && typeof item.cut === "string") {
    return `${item.animal}:${item.cut}`;
  }
  if (typeof item.id === "string") {
    return item.id;
  }
  throw new Error(`Unable to derive key for item: ${JSON.stringify(item)}`);
}

function readPromptItems(root, category) {
  const promptsPath = path.join(root, "data", "assets", `${category}-prompts.json`);
  if (!fs.existsSync(promptsPath)) {
    throw new Error(`Prompt file not found: ${path.relative(root, promptsPath)}`);
  }

  const raw = fs.readFileSync(promptsPath, "utf8");
  const items = JSON.parse(raw);
  assertArray(items, path.relative(root, promptsPath));
  return { promptsPath, items };
}

function buildMapFileContent({ category, items, promptsPath }) {
  const pascalCategory = toPascalCase(category);
  const mapName = `${category}VisualMap`;
  const fallbackConstName = `${category.toUpperCase()}_VISUAL_FALLBACK`;
  const getterName = `get${pascalCategory}Visual`;
  const defaultFallback = items.length > 0 ? `/${category}/${items[0].id}.webp` : `/${category}/fallback.webp`;

  const entries = items.map((item) => {
    if (typeof item.id !== "string") {
      throw new Error(`Each item must include id: ${JSON.stringify(item)}`);
    }
    const key = buildKey(item);
    return `  "${key}": "/${category}/${item.id}.webp"`;
  });

  return `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: ${path.relative(process.cwd(), promptsPath)}

export const ${mapName}: Record<string, string> = {
${entries.join(",\n")}
};

export const ${fallbackConstName} = "${defaultFallback}";

export function ${getterName}(key?: string): string {
  if (!key) {
    return ${fallbackConstName};
  }
  return ${mapName}[key] ?? ${fallbackConstName};
}
`;
}

function buildLegacySetupMapContent(items) {
  const setupItems = items.filter(
    (item) => typeof item.equipment === "string" && typeof item.setup === "string"
  );
  const firstSetupItem = setupItems[0];
  const fallbackPath = firstSetupItem
    ? `/setup/${firstSetupItem.id}.webp`
    : "/setup/setup_gas_two_zone.webp";

  const entries = setupItems.map(
    (item) => `  "${item.equipment}:${item.setup}": "/setup/${item.id}.webp"`
  );

  return `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data/assets/setup-prompts.json

export const setupVisualMap: Record<string, string> = {
${entries.join(",\n")}
};

export const SETUP_VISUAL_FALLBACK = "${fallbackPath}";

export function getSetupVisual(equipment?: string, setup?: string): string {
  const key = \`\${equipment}:\${setup}\`;
  return setupVisualMap[key] ?? SETUP_VISUAL_FALLBACK;
}
`;
}

function main() {
  const root = process.cwd();
  const category = getCategoryFromArgs();
  const { promptsPath, items } = readPromptItems(root, category);

  const generatedDir = path.join(root, "lib", "generated");
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }

  const outputPath = path.join(generatedDir, `${category}VisualMap.ts`);
  const content = buildMapFileContent({ category, items, promptsPath });
  fs.writeFileSync(outputPath, content);
  console.log(`Generated ${path.relative(root, outputPath)}`);

  if (category === "setup") {
    const legacyPath = path.join(root, "lib", "setupVisualMap.ts");
    const legacyContent = buildLegacySetupMapContent(items);
    fs.writeFileSync(legacyPath, legacyContent);
    console.log(`Updated legacy map ${path.relative(root, legacyPath)}`);
  }
}

main();
