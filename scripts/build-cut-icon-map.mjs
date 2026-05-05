import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";

const PUBLIC_ROOT = path.join(process.cwd(), "public", "cut-icons");
const OUTPUT_PATH = path.join(process.cwd(), "lib", "cutIconMap.ts");

function relativePath(filePath) {
  return path.relative(process.cwd(), filePath).replaceAll(path.sep, "/");
}

function getWebpFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getWebpFiles(entryPath));
      continue;
    }

    if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".webp") {
      files.push(entryPath);
    }
  }

  return files.sort((a, b) => relativePath(a).localeCompare(relativePath(b)));
}

function toPublicPath(filePath) {
  const relativeFile = path.relative(PUBLIC_ROOT, filePath).replaceAll(path.sep, "/");
  return `/cut-icons/${relativeFile}`;
}

function toMapKey(filePath) {
  const relativeFile = path.relative(PUBLIC_ROOT, filePath).replaceAll(path.sep, "/");
  return relativeFile.replace(/\.webp$/i, "");
}

function buildMapContent(entries) {
  const mapEntries = entries.map(([key, publicPath]) => `  "${key}": "${publicPath}",`);

  return `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: public/cut-icons/**/*.webp

export const cutIconMap = {
${mapEntries.join("\n")}
} as const satisfies Record<string, string>;

export type CutIconKey = keyof typeof cutIconMap;

export const CUT_ICON_PUBLIC_ROOT = "/cut-icons";

export function getCutIconPath(key?: string): string | undefined {
  if (!key) {
    return undefined;
  }

  return cutIconMap[key as CutIconKey];
}
`;
}

function main() {
  const files = getWebpFiles(PUBLIC_ROOT);
  const entries = files.map((file) => [toMapKey(file), toPublicPath(file)]);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, buildMapContent(entries));

  console.log(`Generated ${relativePath(OUTPUT_PATH)}`);
  console.log(`entries: ${entries.length}`);
}

main();
