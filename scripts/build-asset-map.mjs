import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";

const SUPPORTED_CATEGORIES = ["setup", "cuts", "vegetables", "icons", "steps", "hero"];
const CATEGORY_OUTPUT_PATHS = {
  setup: "/setup",
  cuts: "/cuts",
  vegetables: "/vegetables",
  icons: "/brand/icons",
  steps: "/steps",
  hero: "/hero",
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

function relativePath(root, filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
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
  if (category === "setup") {
    return buildGeneratedSetupMapContent({ items, promptsPath });
  }

  const pascalCategory = toPascalCase(category);
  const mapName = `${category}VisualMap`;
  const fallbackConstName = `${category.toUpperCase()}_VISUAL_FALLBACK`;
  const getterName = `get${pascalCategory}Visual`;
  const publicPath = CATEGORY_OUTPUT_PATHS[category];
  const defaultFallback = items.length > 0 ? `${publicPath}/${items[0].id}.webp` : `${publicPath}/fallback.webp`;

  const visualEntries = new Map();
  items.forEach((item) => {
    if (typeof item.id !== "string") {
      throw new Error(`Each item must include id: ${JSON.stringify(item)}`);
    }
    const key = buildKey(item);
    visualEntries.set(key, `${publicPath}/${item.id}.webp`);
  });
  const entries = Array.from(visualEntries.entries()).map(
    ([key, visualPath]) => `  "${key}": "${visualPath}"`
  );

  return `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: ${relativePath(process.cwd(), promptsPath)}

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

function buildGeneratedSetupMapContent({ items, promptsPath }) {
  const setupItems = items.filter(
    (item) => typeof item.equipment === "string" && typeof item.setup === "string"
  );
  const visualEntries = new Map();
  setupItems.forEach((item) => {
    visualEntries.set(`${item.equipment}:${item.setup}`, `/setup/${item.id}.webp`);
  });
  const entries = Array.from(visualEntries.entries()).map(
    ([key, visualPath]) => `  "${key}": "${visualPath}"`
  );

  return `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: ${relativePath(process.cwd(), promptsPath)}

export const setupVisualMap: Record<string, string> = {
${entries.join(",\n")}
};

export const SETUP_VISUAL_FALLBACK = "/setup/setup_two_zone.webp";

function normalizeLookupText(text = ""): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .trim();
}

function normalizeSetupKey(setup?: string): string {
  const normalized = normalizeLookupText(setup).replace(/[_\\s]+/g, "-");

  if (!normalized) return "two_zone";
  if (normalized === "two-zone") return "two_zone";
  if (normalized === "reverse-sear") return "reverse_sear";
  if (normalized === "low-slow" || normalized === "low-and-slow") return "low_slow";
  if (normalized === "pan-oven") return "pan_oven";
  if (normalized === "direct-heat") return "direct";

  return normalized.replace(/-/g, "_");
}

function normalizeEquipmentKey(equipment?: string): string {
  const normalized = normalizeLookupText(equipment);

  if (
    normalized.includes("gas") ||
    normalized.includes("charcoal") ||
    normalized.includes("carbon") ||
    normalized.includes("kamado") ||
    normalized.includes("indoor") ||
    normalized.includes("interior") ||
    normalized.includes("grill")
  ) {
    return "grill";
  }

  return normalized || "grill";
}

export function getSetupVisual(equipment?: string, setup?: string): string {
  const equipmentKey = normalizeEquipmentKey(equipment);
  const setupKey = normalizeSetupKey(setup);
  const candidates = [
    \`\${equipmentKey}:\${setupKey}\`,
    \`grill:\${setupKey}\`,
  ];

  for (const key of candidates) {
    const visual = setupVisualMap[key];
    if (visual) return visual;
  }

  return SETUP_VISUAL_FALLBACK;
}
`;
}

function getSetupAssetFiles(root) {
  const setupDir = path.join(root, "public", "setup");
  if (!fs.existsSync(setupDir)) {
    return [];
  }

  return fs
    .readdirSync(setupDir)
    .filter((file) => path.extname(file).toLowerCase() === ".webp")
    .sort((a, b) => a.localeCompare(b));
}

function buildLegacySetupMapContent(items, root) {
  const setupItems = items.filter(
    (item) => typeof item.equipment === "string" && typeof item.setup === "string"
  );
  const setupAssetFiles = getSetupAssetFiles(root);
  const assetSetEntries = setupAssetFiles.map((file) => `  "${file}"`);
  const fallbackFile = setupAssetFiles.includes("setup_two_zone.webp")
    ? "setup_two_zone.webp"
    : setupAssetFiles[0] ?? "setup_two_zone.webp";
  const fallbackPath = `/setup/${fallbackFile}`;

  const visualEntries = new Map();
  setupItems.forEach((item) => {
    visualEntries.set(`${item.equipment}:${item.setup}`, `/setup/${item.id}.webp`);
  });
  const entries = Array.from(visualEntries.entries()).map(
    ([key, visualPath]) => `  "${key}": "${visualPath}"`
  );

  return `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data/assets/setup-prompts.json

export type SetupEquipment = string;
export type SetupType = string;

export const setupVisualMap: Record<string, string> = {
${entries.join(",\n")}
};

export const SETUP_VISUAL_FALLBACK = "${fallbackPath}";

const SETUP_VISUAL_ASSETS = new Set([
${assetSetEntries.join(",\n")}
]);

function normalizeLookupText(text = ""): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .trim();
}

function normalizeSetupKey(setup?: string): string {
  const normalized = normalizeLookupText(setup).replace(/[_\\s]+/g, "-");

  if (!normalized) return "two_zone";
  if (normalized === "direct" || normalized === "direct-heat") return "direct_heat";
  if (normalized === "indirect" || normalized === "indirect-heat") return "indirect_heat";
  if (normalized === "two-zone") return "two_zone";
  if (
    normalized === "reverse-sear" ||
    normalized === "reverse-searing" ||
    normalized === "sear-reverse"
  ) {
    return "reverse_sear";
  }
  if (normalized === "low-slow" || normalized === "low-and-slow") return "indirect_heat";
  if (normalized === "pan-oven") return "pan_oven";

  return normalized.replace(/-/g, "_");
}

function normalizeEquipmentKey(equipment?: string): string {
  const normalized = normalizeLookupText(equipment);

  if (normalized.includes("gas")) return "gas";
  if (normalized.includes("charcoal") || normalized.includes("carbon")) return "charcoal";
  if (normalized.includes("kamado")) return "kamado";
  if (normalized.includes("indoor") || normalized.includes("interior")) return "indoor";
  if (normalized.includes("grill") || normalized.includes("fire")) return "grill";

  return normalized || "grill";
}

function setupVisualPath(key: string): string | undefined {
  const filename = \`setup_\${key}.webp\`;
  return SETUP_VISUAL_ASSETS.has(filename) ? \`/setup/\${filename}\` : undefined;
}

function getEquipmentSetupCandidates(equipmentKey: string, setupKey: string): string[] {
  if (equipmentKey === "kamado" && setupKey === "indirect_heat") {
    return ["kamado_indirect_deflector"];
  }

  if (equipmentKey === "indoor") {
    return ["indoor_pan_oven"];
  }

  return [];
}

export function getSetupVisual(equipment?: string, setup?: string): string {
  const equipmentKey = normalizeEquipmentKey(equipment);
  const setupKey = normalizeSetupKey(setup);
  const candidates = [
    ...getEquipmentSetupCandidates(equipmentKey, setupKey),
    \`\${equipmentKey}_\${setupKey}\`,
    \`fire_\${setupKey}\`,
    setupKey,
  ];

  for (const key of candidates) {
    const visual = setupVisualPath(key);
    if (visual) return visual;
  }

  return SETUP_VISUAL_FALLBACK;
}

function normalizeSetupText(text = ""): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "");
}

export function detectSetupFromText(text?: string): SetupType {
  const normalized = normalizeSetupText(text);
  if (!normalized) return "two-zone";

  if (/(reverse sear|reverse-sear|sellado inverso)/.test(normalized)) return "reverse-sear";
  if (
    /(two zone|two-zone|direct\\s*\\+\\s*indirect|directo\\s*\\+\\s*indirecto|dos zonas)/.test(
      normalized
    )
  ) {
    return "two-zone";
  }
  if (/(indirect|indirecto)/.test(normalized)) return "indirect";
  if (/(direct heat|direct|directo)/.test(normalized)) return "direct";
  if (/(smoke|smoking|ahumado|low and slow)/.test(normalized)) return "low-slow";
  if (/(pan|sarten|oven|horno)/.test(normalized)) return "pan-oven";

  return "two-zone";
}
`;
}

function main() {
  const root = process.cwd();
  const categories = getCategoriesFromArgs();

  const generatedDir = path.join(root, "lib", "generated");
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }

  for (const category of categories) {
    const { promptsPath, items } = readPromptItems(root, category);
    const outputPath = path.join(generatedDir, `${category}VisualMap.ts`);
    const content = buildMapFileContent({ category, items, promptsPath });
    fs.writeFileSync(outputPath, content);
    console.log(`Generated ${relativePath(root, outputPath)}`);

    if (category === "setup") {
      const legacyPath = path.join(root, "lib", "setupVisualMap.ts");
      const legacyContent = buildLegacySetupMapContent(items, root);
      fs.writeFileSync(legacyPath, legacyContent);
      console.log(`Updated legacy map ${relativePath(root, legacyPath)}`);
    }
  }
}

main();
