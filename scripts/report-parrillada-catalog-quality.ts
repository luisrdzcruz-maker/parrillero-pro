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
  status: "included" | "skipped";
  skipReason: string;
  animal: string;
  category: string;
  planningMetadataSource: string;
  planningMetadataConfidence: string;
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
  goodForGroups: string;
  requiresEarlyStart: string;
  planningHint: string;
  notes: string;
};

type CatalogQualityReport = {
  rows: CatalogQualityRow[];
  summary: {
    totalCandidates: number;
    includedItems: number;
    skippedItems: number;
    metadataBackedItems: number;
    fallbackNoteItems: number;
    confidence: {
      high: number;
      medium: number;
      low: number;
    };
    visibility: {
      recommended: number;
      standard: number;
      advanced: number;
    };
    requiresEarlyStart: number;
    withRiskTags: number;
  };
  skippedItems: Array<{
    cutId: string;
    displayName: string;
    skipReason: string;
  }>;
  confidenceBreakdown: {
    high: number;
    medium: number;
    low: number;
    missing: number;
  };
  advancedRows: CatalogQualityRow[];
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

function yesNo(value: boolean | undefined): string {
  if (typeof value !== "boolean") return "-";
  return value ? "yes" : "no";
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
    const included = !skippedByCandidateId.has(candidate.id);

    return {
      cutId: candidate.cut,
      displayName,
      status: included ? "included" : "skipped",
      skipReason,
      animal: candidate.animal,
      category: presentation?.categoryLabel ?? "-",
      planningMetadataSource: resolvedMetadata?.source ?? "missing",
      planningMetadataConfidence: confidence,
      setupMinutes: safeNumber(resolvedMetadata?.setupMinutes),
      activeCookMinutes: safeNumber(resolvedMetadata?.activeCookMinutes),
      restMinutes: safeNumber(resolvedMetadata?.restMinutes),
      totalSessionMinutes: safeNumber(resolvedMetadata?.totalSessionMinutes),
      requiredZones: safeJoin(resolvedMetadata?.requiredZones),
      preferredZones: safeJoin(resolvedMetadata?.preferredZones),
      zoneDemand: resolvedMetadata?.zoneDemand ?? "-",
      timingSensitivity: resolvedMetadata?.timingSensitivity ?? "-",
      canHoldWarm: yesNo(resolvedMetadata?.canHoldWarm),
      maxHoldMinutes: safeNumber(resolvedMetadata?.maxHoldMinutes),
      serveWindowMinutes: safeNumber(resolvedMetadata?.serveWindowMinutes),
      riskTags: safeJoin(resolvedMetadata?.riskTags),
      visibility: presentation?.visibility ?? "-",
      role: presentation?.role ?? "-",
      complexity: presentation?.complexity ?? "-",
      goodForGroups: yesNo(presentation?.goodForGroups),
      requiresEarlyStart: yesNo(presentation?.requiresEarlyStart),
      planningHint: presentation?.planningHint ?? "-",
      notes: rowNotes.length > 0 ? rowNotes.join("; ") : "-",
    } satisfies CatalogQualityRow;
  });

  const confidenceBreakdown = rows.reduce(
    (acc, row) => {
      if (row.planningMetadataConfidence === "high") acc.high += 1;
      else if (row.planningMetadataConfidence === "medium") acc.medium += 1;
      else if (row.planningMetadataConfidence === "low") acc.low += 1;
      else acc.missing += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0, missing: 0 },
  );

  const withRiskTags = rows.filter((row) => row.riskTags !== "-").length;
  const advancedRows = rows.filter((row) => row.visibility === "advanced");
  const skippedItems = rows
    .filter((row) => row.status === "skipped")
    .map((row) => ({
      cutId: row.cutId,
      displayName: row.displayName,
      skipReason: row.skipReason,
    }));
  const metadataBackedItems = rows.filter((row) => row.planningMetadataSource !== "missing").length;
  const fallbackNoteItems = rows.filter(
    (row) => row.planningMetadataSource === "fallback" || row.notes.toLowerCase().includes("fallback"),
  ).length;

  const topRiskTags = [...riskCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tag, count]) => ({ tag, count }));

  return {
    rows,
    summary: {
      totalCandidates: rows.length,
      includedItems: rows.filter((row) => row.status === "included").length,
      skippedItems: rows.filter((row) => row.status === "skipped").length,
      metadataBackedItems,
      fallbackNoteItems,
      confidence: {
        high: confidenceBreakdown.high,
        medium: confidenceBreakdown.medium,
        low: confidenceBreakdown.low,
      },
      visibility: {
        recommended: rows.filter((row) => row.visibility === "recommended").length,
        standard: rows.filter((row) => row.visibility === "standard").length,
        advanced: rows.filter((row) => row.visibility === "advanced").length,
      },
      requiresEarlyStart: rows.filter((row) => row.requiresEarlyStart === "yes").length,
      withRiskTags,
    },
    skippedItems,
    confidenceBreakdown,
    advancedRows,
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
    `- Total candidates: ${report.summary.totalCandidates}`,
    `- Included items: ${report.summary.includedItems}`,
    `- Skipped items: ${report.summary.skippedItems}`,
    `- Metadata-backed items: ${report.summary.metadataBackedItems}`,
    `- Fallback-note items: ${report.summary.fallbackNoteItems}`,
    `- High confidence count: ${report.summary.confidence.high}`,
    `- Medium confidence count: ${report.summary.confidence.medium}`,
    `- Low confidence count: ${report.summary.confidence.low}`,
    `- Recommended count: ${report.summary.visibility.recommended}`,
    `- Standard count: ${report.summary.visibility.standard}`,
    `- Advanced count: ${report.summary.visibility.advanced}`,
    `- Items requiring early start: ${report.summary.requiresEarlyStart}`,
    `- Items with risk tags: ${report.summary.withRiskTags}`,
    "",
    "## Confidence Breakdown",
    `- High: ${report.confidenceBreakdown.high}`,
    `- Medium: ${report.confidenceBreakdown.medium}`,
    `- Low: ${report.confidenceBreakdown.low}`,
    `- Missing: ${report.confidenceBreakdown.missing}`,
    "",
    "## Skipped Items and Reasons",
  ];

  const skippedLines =
    report.skippedItems.length > 0
      ? report.skippedItems.map((row) => `- ${row.cutId} (${row.displayName}): ${row.skipReason}`)
      : ["- none"];

  const advancedHeader = [
    "",
    "## Advanced Item Notes",
  ];

  const advancedLines =
    report.advancedRows.length > 0
      ? report.advancedRows.map(
          (row) =>
            `- ${row.cutId} (${row.displayName}): totalSession=${row.totalSessionMinutes}m, riskTags=${row.riskTags}, requiresEarlyStart=${row.requiresEarlyStart}, planningHint=${row.planningHint}, notes=${row.notes}`,
        )
      : ["- none"];

  const riskHeader = [
    "",
    "## Main Risk Areas",
  ];

  const riskLines =
    report.topRiskTags.length > 0
      ? report.topRiskTags.map((risk) => `- ${risk.tag}: ${risk.count}`)
      : ["- none"];

  const nextActionsHeader = [
    "",
    "## Recommended Next Actions",
    "- Prioritize medium/low/missing confidence rows and improve metadata derivation before expanding eligibility.",
    "- Keep advanced rows behind stricter safety gates until risk tags and timing sensitivity are validated in additional scenarios.",
    "- Expand scenario coverage in `qa:parrillada` for high-risk tags that appear most often.",
    "- Re-run this report after any catalog or planningMetadata updates to track quality drift.",
  ];

  const tableHeader = [
    "",
    "## Full Item Matrix",
    "",
    "| cutId | displayName | status | skipReason | animal | category | planningMetadataSource | planningMetadataConfidence | setupMinutes | activeCookMinutes | restMinutes | totalSessionMinutes | requiredZones | preferredZones | zoneDemand | timingSensitivity | canHoldWarm | maxHoldMinutes | serveWindowMinutes | riskTags | visibility | role | complexity | goodForGroups | requiresEarlyStart | planningHint | notes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];

  const rows = report.rows.map((row) =>
    [
      row.cutId,
      row.displayName,
      row.status,
      row.skipReason,
      row.animal,
      row.category,
      row.planningMetadataSource,
      row.planningMetadataConfidence,
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
      row.goodForGroups,
      row.requiresEarlyStart,
      row.planningHint,
      row.notes,
    ]
      .map((value) => String(value).replaceAll("|", "\\|"))
      .join(" | "),
  );

  return [
    ...header,
    ...skippedLines,
    ...advancedHeader,
    ...advancedLines,
    ...riskHeader,
    ...riskLines,
    ...nextActionsHeader,
    ...tableHeader,
    ...rows.map((line) => `| ${line} |`),
    "",
  ].join("\n");
}

function printConsoleSummary(report: CatalogQualityReport): void {
  console.log("Parrillada catalog quality report");
  console.log("--------------------------------");
  console.log(`Total candidates: ${report.summary.totalCandidates}`);
  console.log(`Included items: ${report.summary.includedItems}`);
  console.log(`Skipped items: ${report.summary.skippedItems}`);
  console.log(`Metadata-backed items: ${report.summary.metadataBackedItems}`);
  console.log(`Fallback-note items: ${report.summary.fallbackNoteItems}`);
  console.log(`High confidence count: ${report.summary.confidence.high}`);
  console.log(`Medium confidence count: ${report.summary.confidence.medium}`);
  console.log(`Low confidence count: ${report.summary.confidence.low}`);
  console.log(`Recommended count: ${report.summary.visibility.recommended}`);
  console.log(`Standard count: ${report.summary.visibility.standard}`);
  console.log(`Advanced count: ${report.summary.visibility.advanced}`);
  console.log(`Items requiring early start: ${report.summary.requiresEarlyStart}`);
  console.log(`Items with risk tags: ${report.summary.withRiskTags}`);
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
