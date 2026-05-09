// Lightweight smoke for production routes and the live URL contract.
// Catches:
//   - Production page files missing or with no default export.
//   - Live URL params dropping fields on round-trip (frozen contract).
// Does NOT:
//   - Render pages or import server actions / RSC modules. Use `next build`
//     and `npx tsc --noEmit` for that surface; this script is intentionally
//     framework-free so it can run in any Node environment.

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildSearchFromNav,
  parseNavFromSearch,
  type ParrilladaFlowStep,
} from "@/lib/navigation/appNavState";
import { buildLiveUrl, type LiveParams } from "@/lib/navigation/buildLiveUrl";
import { parseLiveParams } from "@/lib/navigation/parseLiveParams";

type Probe = { name: string; ok: boolean; detail?: string };

const repoRoot = process.cwd();

const PRODUCTION_PAGES = [
  "app/page.tsx",
  "app/saved/page.tsx",
  "app/share/page.tsx",
  "app/share/[slug]/page.tsx",
  "app/design/page.tsx",
  "app/design/[slug]/page.tsx",
];

const URL_FIXTURES: Array<{ name: string; params: LiveParams }> = [
  {
    name: "ribeye / medium_rare / es",
    params: { animal: "beef", cutId: "ribeye", doneness: "medium_rare", thickness: 3, lang: "es" },
  },
  {
    name: "salmon / medium / en",
    params: { animal: "fish", cutId: "salmon", doneness: "medium", thickness: 2.5, lang: "en" },
  },
  {
    name: "chicken-breast / safe / fi",
    params: { animal: "chicken", cutId: "chicken-breast", doneness: "safe", thickness: 4, lang: "fi" },
  },
  {
    name: "vegetables / juicy / no thickness",
    params: { animal: "vegetables", cutId: "asparagus", doneness: "juicy" },
  },
  {
    name: "minimal (mode only)",
    params: {},
  },
];

const RAW_URL_FIXTURES = [
  "?mode=inicio",
  "?mode=coccion&animal=beef&cutId=ribeye&doneness=medium_rare&thickness=3",
  "?mode=cocina&animal=beef&cutId=ribeye&doneness=medium_rare&thickness=3&lang=es",
  "?mode=parrillada",
  "?mode=parrillada&parrilladaStep=entry",
  "?mode=parrillada&parrilladaStep=setup",
  "?mode=parrillada&parrilladaStep=review",
  "?mode=parrillada&parrilladaStep=live",
  "?mode=plan",
  "?mode=plan&planStep=setup",
  "?mode=plan&planStep=review",
  "?mode=guardados",
];

const PARRILLADA_STEP_FIXTURES: Array<{ mode: "parrillada" | "plan"; step: ParrilladaFlowStep }> = [
  { mode: "parrillada", step: "entry" },
  { mode: "parrillada", step: "setup" },
  { mode: "parrillada", step: "review" },
  { mode: "parrillada", step: "live" },
  { mode: "plan", step: "entry" },
  { mode: "plan", step: "setup" },
  { mode: "plan", step: "review" },
];

function probePageFile(relPath: string): Probe {
  const fullPath = resolve(repoRoot, relPath);
  if (!existsSync(fullPath)) {
    return { name: `page exists: ${relPath}`, ok: false, detail: "file not found" };
  }
  const source = readFileSync(fullPath, "utf8");
  if (!/export\s+default\b/.test(source)) {
    return { name: `default export: ${relPath}`, ok: false, detail: "no `export default` found" };
  }
  return { name: `page ok: ${relPath}`, ok: true };
}

function probeRoundTrip(label: string, params: LiveParams): Probe {
  const url = buildLiveUrl(params);
  const queryIndex = url.indexOf("?");
  const search = queryIndex >= 0 ? url.slice(queryIndex) : "";
  const parsed = parseLiveParams(search);

  const issues: string[] = [];

  if (parsed.mode !== "cocina") issues.push(`mode lost: got ${parsed.mode}`);
  if (params.animal !== undefined && parsed.animal !== params.animal) {
    issues.push(`animal: ${params.animal} -> ${parsed.animal}`);
  }
  if (params.cutId !== undefined && parsed.cutId !== params.cutId) {
    issues.push(`cutId: ${params.cutId} -> ${parsed.cutId}`);
  }
  if (params.doneness !== undefined && parsed.doneness !== params.doneness) {
    issues.push(`doneness: ${params.doneness} -> ${parsed.doneness}`);
  }
  if (params.thickness !== undefined && parsed.thickness !== params.thickness) {
    issues.push(`thickness: ${params.thickness} -> ${parsed.thickness}`);
  }
  if (params.lang !== undefined && parsed.lang !== params.lang) {
    issues.push(`lang: ${params.lang} -> ${parsed.lang}`);
  }

  return issues.length === 0
    ? { name: `URL round-trip: ${label}`, ok: true }
    : { name: `URL round-trip: ${label}`, ok: false, detail: issues.join("; ") };
}

function probeParrilladaStepRoundTrip(mode: "parrillada" | "plan", step: ParrilladaFlowStep): Probe {
  const search = buildSearchFromNav(mode, "animal", {}, undefined, step);
  const parsed = parseNavFromSearch(search);
  const issues: string[] = [];
  if (parsed.mode !== mode) issues.push(`mode: expected ${mode}, got ${parsed.mode}`);
  const recovered = mode === "parrillada" ? parsed.parrilladaStep : parsed.planStep;
  if (recovered !== step) {
    issues.push(`step: expected ${step}, got ${recovered ?? "undefined"}`);
  }
  return issues.length === 0
    ? { name: `${mode} step round-trip: ${step}`, ok: true }
    : { name: `${mode} step round-trip: ${step}`, ok: false, detail: issues.join("; ") };
}

function probeRawParse(raw: string): Probe {
  try {
    const parsed = parseLiveParams(raw);
    if (typeof parsed.mode !== "string" && parsed.mode !== null) {
      return { name: `raw parse: ${raw}`, ok: false, detail: "mode missing" };
    }
    return { name: `raw parse: ${raw}`, ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { name: `raw parse: ${raw}`, ok: false, detail: message };
  }
}

function main() {
  const probes: Probe[] = [];

  for (const page of PRODUCTION_PAGES) {
    probes.push(probePageFile(page));
  }

  for (const fixture of URL_FIXTURES) {
    probes.push(probeRoundTrip(fixture.name, fixture.params));
  }

  for (const raw of RAW_URL_FIXTURES) {
    probes.push(probeRawParse(raw));
  }

  for (const fixture of PARRILLADA_STEP_FIXTURES) {
    probes.push(probeParrilladaStepRoundTrip(fixture.mode, fixture.step));
  }

  let passed = 0;
  for (const probe of probes) {
    const status = probe.ok ? "PASS" : "FAIL";
    const detail = probe.detail ? ` — ${probe.detail}` : "";
    console.log(`${status}  ${probe.name}${detail}`);
    if (probe.ok) passed += 1;
  }

  const failed = probes.length - passed;
  console.log("");
  console.log(`Total: ${probes.length}  Passed: ${passed}  Failed: ${failed}`);

  if (failed > 0) process.exit(1);
}

main();
