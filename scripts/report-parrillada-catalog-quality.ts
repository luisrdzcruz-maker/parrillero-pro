import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateCookingPlan, getCutForInput, type CookingInput } from "@/lib/cookingEngine";
import { getPlanPlanningMetadata } from "@/lib/cooking/planningMetadata";
import {
  buildCatalogBackedParrilladaLiteItems,
  getParrilladaCatalogCandidates,
  getParrilladaItemPresentation,
  singleCutPlanToPlannerInput,
} from "@/lib/planning";
import type { PlannerCutInput } from "@/lib/planning/types";

type CatalogQualityRow = {
  cutId: string;
  displayName: string;
  animal: string;
  category: string;
  included: boolean;
  skipReason: string;
  source: string;
  confidence: string;
  setupMinutes: string;
  activeCookMinutes: string;
  restMinutes: string;
  totalSessionMinutes: string;
  requiredZones: string;
  preferredZones: string;
  zoneDemand: string;
  timingSensitivity: string;
  canHoldWarm: string;
  maxHoldMinutes: string;
  serveWindowMinutes: string;
  riskTags: string;
  visibility: string;
  role: string;
  complexity: string;
  requiresEarlyStart: string;
  notes: string;
};

type CatalogQualityReport = {
  rows: CatalogQualityRow[];
  includedCount: number;
  skippedCount: number;
  fallbackCount: number;
  confidenceCounts: {
    high: number;
    medium: number;
    low: number;
    missing: number;
  };
  topRiskTags: Array<{ tag: string; count: number }>;
};

function makeInput(candidate: ReturnType<typeof getParrilladaCatalogCandidates>[number]): CookingInput {
  return {
    animal: candidate.animal,
    cut: candidate.cut,
    doneness: candidate.doneness,
    thicknessCm: candidate.thicknessCm,
    weightKg: "1",
    equipment: "parrilla gas",
    language: "es",
  };
}

function safeJoin(value: string[] | undefined): string {
  if (!value || value.length === 0) return "-";
  return value.join(", ");
}

function safeNumber(value: number | undefined): string {
  if (typeof value !== "number") return "-";
  return String(value);
}

function collectReport(): CatalogQualityReport {
  const catalogBuild = buildCatalogBackedParrilladaLiteItems();
  const candidates = getParrilladaCatalogCandidates();

  const skippedByCandidateId = new Map(catalogBuild.skipped.map((skip) => [skip.candidateId, skip.reason]));
  const includedByCutId = new Map(catalogBuild.items.map((item) => [item.cutId, item]));
  const riskCounter = new Map<string, number>();

  const rows = candidates.map((candidate) => {
    const input = makeInput(candidate);
    const plan = generateCookingPlan(input);
    const cut = getCutForInput(input);
    const metadata = plan ? getPlanPlanningMetadata(plan) : undefined;
    const includedPlannerItem = includedByCutId.get(candidate.cut);

    const skipReason =
      skippedByCandidateId.get(candidate.id) ??
      (!plan
        ? "single-cut plan generation failed"
        : !cut
          ? "single-cut cut resolution failed"
          : cut.id !== candidate.cut
            ? `resolved cut mismatch (${cut.id})`
            : "-");

    let reportItem: PlannerCutInput | undefined = includedPlannerItem;
    if (!reportItem && plan && cut && cut.id === candidate.cut) {
      reportItem = singleCutPlanToPlannerInput({
        id: `catalog-${candidate.id}`,
        cut,
        plan,
        thicknessCm: Number(candidate.thicknessCm),
        weightGrams: candidate.weightGrams,
        priority: candidate.priority,
      });
      if (!metadata) {
        reportItem.notes = [...(reportItem.notes ?? []), "fallback: planningMetadata missing"];
      }
    }
    const presentation = reportItem ? getParrilladaItemPresentation(reportItem) : undefined;
    const resolvedMetadata = reportItem?.planningMetadata ?? metadata;
    const rowNotes = [...(resolvedMetadata?.notes ?? []), ...(reportItem?.notes ?? [])];

    for (const tag of resolvedMetadata?.riskTags ?? []) {
      riskCounter.set(tag, (riskCounter.get(tag) ?? 0) + 1);
    }

    const displayName = reportItem?.displayName ?? cut?.names.en ?? cut?.names.es ?? candidate.cut;
    const confidence = resolvedMetadata?.confidence ?? "missing";

    return {
      cutId: candidate.cut,
      displayName,
      animal: candidate.animal,
      category: presentation?.categoryLabel ?? "-",
      included: !skippedByCandidateId.has(candidate.id),
      skipReason,
      source: resolvedMetadata?.source ?? "missing",
      confidence,
      setupMinutes: safeNumber(resolvedMetadata?.setupMinutes),
      activeCookMinutes: safeNumber(resolvedMetadata?.activeCookMinutes),
      restMinutes: safeNumber(resolvedMetadata?.restMinutes),
      totalSessionMinutes: safeNumber(resolvedMetadata?.totalSessionMinutes),
      requiredZones: safeJoin(resolvedMetadata?.requiredZones),
      preferredZones: safeJoin(resolvedMetadata?.preferredZones),
      zoneDemand: resolvedMetadata?.zoneDemand ?? "-",
      timingSensitivity: resolvedMetadata?.timingSensitivity ?? "-",
      canHoldWarm: typeof resolvedMetadata?.canHoldWarm === "boolean" ? String(resolvedMetadata.canHoldWarm) : "-",
      maxHoldMinutes: safeNumber(resolvedMetadata?.maxHoldMinutes),
      serveWindowMinutes: safeNumber(resolvedMetadata?.serveWindowMinutes),
      riskTags: safeJoin(resolvedMetadata?.riskTags),
      visibility: presentation?.visibility ?? "-",
      role: presentation?.role ?? "-",
      complexity: presentation?.complexity ?? "-",
      requiresEarlyStart:
        typeof presentation?.requiresEarlyStart === "boolean" ? String(presentation.requiresEarlyStart) : "-",
      notes: rowNotes.length > 0 ? rowNotes.join("; ") : "-",
    } satisfies CatalogQualityRow;
  });

  const confidenceCounts = rows.reduce(
    (acc, row) => {
      if (row.confidence === "high") acc.high += 1;
      else if (row.confidence === "medium") acc.medium += 1;
      else if (row.confidence === "low") acc.low += 1;
      else acc.missing += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0, missing: 0 },
  );

  const fallbackCount = rows.filter((row) => row.source === "fallback" || row.notes.includes("fallback")).length;

  const topRiskTags = [...riskCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));

  return {
    rows,
    includedCount: rows.filter((row) => row.included).length,
    skippedCount: rows.filter((row) => !row.included).length,
    fallbackCount,
    confidenceCounts,
    topRiskTags,
  };
}

function toMarkdown(report: CatalogQualityReport): string {
  const generatedAt = new Date().toISOString();
  const header = [
    "# Parrillada Catalog Quality Matrix",
    "",
    `Generated at: ${generatedAt}`,
    "",
    "## Summary",
    `- Total candidates: ${report.rows.length}`,
    `- Included: ${report.includedCount}`,
    `- Skipped: ${report.skippedCount}`,
    `- Fallback items: ${report.fallbackCount}`,
    `- Confidence high/medium/low/missing: ${report.confidenceCounts.high}/${report.confidenceCounts.medium}/${report.confidenceCounts.low}/${report.confidenceCounts.missing}`,
    "",
    "## Main Risk Areas",
  ];

  const riskLines =
    report.topRiskTags.length > 0
      ? report.topRiskTags.map((risk) => `- ${risk.tag}: ${risk.count}`)
      : ["- none"];

  const tableHeader = [
    "",
    "## Quality Matrix",
    "",
    "| cutId | displayName | animal | category | included | skipReason | source | confidence | setupMinutes | activeCookMinutes | restMinutes | totalSessionMinutes | requiredZones | preferredZones | zoneDemand | timingSensitivity | canHoldWarm | maxHoldMinutes | serveWindowMinutes | riskTags | visibility | role | complexity | requiresEarlyStart | notes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];

  const rows = report.rows.map((row) =>
    [
      row.cutId,
      row.displayName,
      row.animal,
      row.category,
      row.included ? "included" : "skipped",
      row.skipReason,
      row.source,
      row.confidence,
      row.setupMinutes,
      row.activeCookMinutes,
      row.restMinutes,
      row.totalSessionMinutes,
      row.requiredZones,
      row.preferredZones,
      row.zoneDemand,
      row.timingSensitivity,
      row.canHoldWarm,
      row.maxHoldMinutes,
      row.serveWindowMinutes,
      row.riskTags,
      row.visibility,
      row.role,
      row.complexity,
      row.requiresEarlyStart,
      row.notes,
    ]
      .map((value) => String(value).replaceAll("|", "\\|"))
      .join(" | "),
  );

  return [...header, ...riskLines, ...tableHeader, ...rows.map((line) => `| ${line} |`), ""].join("\n");
}

function printConsoleSummary(report: CatalogQualityReport): void {
  console.log("Parrillada catalog quality report");
  console.log("--------------------------------");
  console.log(`Total candidates: ${report.rows.length}`);
  console.log(`Included: ${report.includedCount}`);
  console.log(`Skipped: ${report.skippedCount}`);
  console.log(`Fallback items: ${report.fallbackCount}`);
  console.log(
    `Confidence high/medium/low/missing: ${report.confidenceCounts.high}/${report.confidenceCounts.medium}/${report.confidenceCounts.low}/${report.confidenceCounts.missing}`,
  );
  if (report.topRiskTags.length > 0) {
    console.log("Top risk tags:");
    report.topRiskTags.forEach((risk) => console.log(`- ${risk.tag}: ${risk.count}`));
  } else {
    console.log("Top risk tags: none");
  }
}

function main(): void {
  const report = collectReport();
  const markdown = toMarkdown(report);
  const outputPath = resolve(process.cwd(), "docs/qa/parrillada-catalog-quality-matrix.md");
  writeFileSync(outputPath, markdown, "utf8");
  printConsoleSummary(report);
  console.log(`Matrix written to: ${outputPath}`);
}

main();
