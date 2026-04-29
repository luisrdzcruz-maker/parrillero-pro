import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { animalCatalog, type AnimalId, type CookingInput, type CookingPlan, type CookingStep } from "../lib/cookingCatalog";
import {
  generateCookingPlan,
  generateCookingSteps,
  getCutsByAnimal,
  getDonenessOptions,
  validateCookingEngineOutput,
} from "../lib/cookingEngine";

type Severity = "error" | "warning";

type Issue = {
  severity: Severity;
  issueCode: string;
  issueMessage: string;
};

type CsvRow = {
  case_id: string;
  animal: string;
  cut: string;
  thickness: string;
  doneness: string;
  equipment: string;
  language: string;
  status: string;
  severity: string;
  issue_code: string;
  issue_message: string;
  response_excerpt: string;
};

type StepsProbeSample = {
  input: CookingInput;
  stepsText: string;
};

const THICKNESS_CM = ["2", "5", "8"] as const;
const EQUIPMENT = [
  "parrilla gas",
  "parrilla carbón",
  "kamado",
  "cocina interior",
  "Napoleon Rogue 525-2",
] as const;
const LANGUAGES = ["es", "en"] as const;
const WEIGHT_KG = "1";
const LIVE_MODE_REQUIRES_TIMELINE = true;

const CSV_HEADERS: Array<keyof CsvRow> = [
  "case_id",
  "animal",
  "cut",
  "thickness",
  "doneness",
  "equipment",
  "language",
  "status",
  "severity",
  "issue_code",
  "issue_message",
  "response_excerpt",
];

function donenessListForAnimal(animalId: AnimalId): string[] {
  const options = getDonenessOptions(animalId);
  if (options.length > 0) {
    return options.map((option) => option.id);
  }
  return ["medium"];
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getRequiredKeys(language: "es" | "en") {
  if (language === "en") {
    return {
      setup: "SETUP",
      times: "TIMES",
      temperature: "TEMPERATURE",
      steps: "STEPS",
      oppositeKeys: ["TIEMPOS", "TEMPERATURA", "PASOS"] as const,
    };
  }

  return {
    setup: "SETUP",
    times: "TIEMPOS",
    temperature: "TEMPERATURA",
    steps: "PASOS",
    oppositeKeys: ["TIMES", "TEMPERATURE", "STEPS"] as const,
  };
}

function planSection(plan: CookingPlan | null, key: string): string {
  if (!plan) return "";
  return String(plan[key] ?? "");
}

function getPlanStepsText(plan: CookingPlan | null, language: "es" | "en"): string {
  if (!plan) return "";
  return language === "en" ? String(plan.STEPS ?? "") : String(plan.PASOS ?? "");
}

function extractTimeValuesInMinutes(text: string): number[] {
  const values: number[] = [];
  for (const match of text.matchAll(/(\d+(?:[.,]\d+)?)\s*(h|min)\b/gi)) {
    const raw = Number(match[1].replace(",", "."));
    if (!Number.isFinite(raw)) continue;
    const unit = match[2].toLowerCase();
    values.push(unit === "h" ? raw * 60 : raw);
  }
  return values;
}

function extractTemperatureValues(text: string): number[] {
  const values: number[] = [];
  for (const match of text.matchAll(/(\d+(?:[.,]\d+)?)\s*°\s*C/gi)) {
    const value = Number(match[1].replace(",", "."));
    if (Number.isFinite(value)) {
      values.push(value);
    }
  }
  return values;
}

function buildResponseText(plan: CookingPlan | null, steps: CookingStep[] | null): string {
  const planText = plan ? Object.values(plan).join(" ") : "";
  const stepsText = Array.isArray(steps)
    ? steps
        .map((step) => [step.title, step.description, ...(step.tips ?? [])].filter(Boolean).join(" "))
        .join(" ")
    : "";

  return normalizeText(`${planText} ${stepsText}`);
}

function getResponseExcerpt(plan: CookingPlan | null, steps: CookingStep[] | null): string {
  const source = buildResponseText(plan, steps);
  if (!source) return "";
  return source.slice(0, 240);
}

function validateCaseOutput(
  input: CookingInput,
  plan: CookingPlan | null,
  steps: CookingStep[] | null,
): Issue[] {
  const issues: Issue[] = [];
  const keys = getRequiredKeys(input.language);
  const responseText = buildResponseText(plan, steps);

  if (!responseText) {
    issues.push({
      severity: "error",
      issueCode: "empty_response",
      issueMessage: "Response is empty.",
    });
  }

  const poisonedToken = responseText.match(/\b(undefined|null|nan)\b/i);
  if (poisonedToken) {
    issues.push({
      severity: "error",
      issueCode: "invalid_token",
      issueMessage: `Response contains invalid token "${poisonedToken[1]}".`,
    });
  }

  if (plan == null) {
    issues.push({
      severity: "error",
      issueCode: "plan_null",
      issueMessage: "Cooking plan is null.",
    });
  } else {
    for (const key of [keys.setup, keys.times, keys.temperature, keys.steps]) {
      if (!(key in plan)) {
        issues.push({
          severity: "error",
          issueCode: "missing_required_section",
          issueMessage: `Missing required plan section "${key}" for language "${input.language}".`,
        });
      } else if (!planSection(plan, key).trim()) {
        issues.push({
          severity: "error",
          issueCode: "empty_required_section",
          issueMessage: `Plan section "${key}" is empty.`,
        });
      }
    }

    const oppositeKeysPresent = keys.oppositeKeys.filter((key) => key in plan && planSection(plan, key).trim());
    if (oppositeKeysPresent.length > 0) {
      issues.push({
        severity: "warning",
        issueCode: "mixed_language_sections",
        issueMessage: `Plan contains sections from the opposite language: ${oppositeKeysPresent.join(", ")}.`,
      });
    }

    const timesText = planSection(plan, keys.times);
    const timeValues = extractTimeValuesInMinutes(timesText);
    if (timeValues.length > 0) {
      for (const timeValue of timeValues) {
        if (timeValue <= 0 || timeValue > 720) {
          issues.push({
            severity: "error",
            issueCode: "time_out_of_range",
            issueMessage: `Time value out of sensible range: ${timeValue} minutes.`,
          });
        }
      }
    } else {
      issues.push({
        severity: "warning",
        issueCode: "time_missing_numeric",
        issueMessage: "No numeric time values detected in plan time section.",
      });
    }

    const tempText = planSection(plan, keys.temperature);
    const tempValues = extractTemperatureValues(tempText);
    const isVegetable = input.animal.toLowerCase().includes("verdur") || input.animal.toLowerCase() === "vegetables";
    if (!isVegetable && tempValues.length === 0) {
      issues.push({
        severity: "error",
        issueCode: "temperature_missing_numeric",
        issueMessage: "No numeric temperature values (°C) detected.",
      });
    }
    for (const value of tempValues) {
      if (value < 30 || value > 100) {
        issues.push({
          severity: "error",
          issueCode: "temperature_out_of_range",
          issueMessage: `Temperature value out of sensible range: ${value}°C.`,
        });
      }
    }
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    issues.push({
      severity: "error",
      issueCode: "steps_missing",
      issueMessage: "Steps timeline is missing or empty.",
    });
  } else {
    let totalDuration = 0;
    for (let index = 0; index < steps.length; index += 1) {
      const step = steps[index];
      if (!step.title?.trim()) {
        issues.push({
          severity: "error",
          issueCode: "step_missing_title",
          issueMessage: `Step ${index} is missing title.`,
        });
      }
      if (!step.description?.trim()) {
        issues.push({
          severity: "error",
          issueCode: "step_missing_description",
          issueMessage: `Step ${index} is missing description.`,
        });
      }
      if (
        typeof step.duration !== "number" ||
        !Number.isFinite(step.duration) ||
        step.duration <= 0 ||
        step.duration > 36000
      ) {
        issues.push({
          severity: "error",
          issueCode: "step_invalid_duration",
          issueMessage: `Step ${index} has invalid duration (${String(step.duration)}).`,
        });
      } else {
        totalDuration += step.duration;
      }
    }

    if (totalDuration > 0 && (totalDuration < 120 || totalDuration > 43200)) {
      issues.push({
        severity: "warning",
        issueCode: "timeline_duration_suspect",
        issueMessage: `Total timeline duration looks unusual: ${Math.round(totalDuration / 60)} minutes.`,
      });
    }

    if (LIVE_MODE_REQUIRES_TIMELINE && steps.length < 2) {
      issues.push({
        severity: "error",
        issueCode: "missing_timeline_data",
        issueMessage: "Live mode requires timeline data with multiple steps.",
      });
    }
  }

  const structural = validateCookingEngineOutput(plan, steps, { input, language: input.language });
  for (const warning of structural.warnings) {
    issues.push({
      severity: "warning",
      issueCode: `engine_${warning.code}`,
      issueMessage: warning.message + (warning.detail ? ` (${warning.detail})` : ""),
    });
  }

  return issues;
}

function escapeCsv(value: string): string {
  if (/["\n,]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(rows: CsvRow[]): string {
  const lines: string[] = [];
  lines.push(CSV_HEADERS.join(","));
  for (const row of rows) {
    const line = CSV_HEADERS.map((header) => escapeCsv(String(row[header] ?? ""))).join(",");
    lines.push(line);
  }
  return `${lines.join("\n")}\n`;
}

async function writeCsv(rows: CsvRow[]): Promise<string> {
  const outDir = path.resolve(process.cwd(), "qa");
  const outPath = path.join(outDir, "cooking-response-audit.csv");
  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, toCsv(rows), "utf8");
  return outPath;
}

function buildDiversityProbeCases(): CookingInput[] {
  return [
    {
      animal: "Vacuno",
      cut: "entrecote",
      weightKg: "1",
      thicknessCm: "2",
      doneness: "rare",
      equipment: "parrilla gas",
      language: "es",
    },
    {
      animal: "Vacuno",
      cut: "tomahawk",
      weightKg: "1",
      thicknessCm: "8",
      doneness: "medium_well",
      equipment: "kamado",
      language: "es",
    },
    {
      animal: "Cerdo",
      cut: "panceta",
      weightKg: "1",
      thicknessCm: "5",
      doneness: "well_done",
      equipment: "cocina interior",
      language: "es",
    },
    {
      animal: "Pollo",
      cut: "pechuga",
      weightKg: "1",
      thicknessCm: "5",
      doneness: "safe",
      equipment: "parrilla carbón",
      language: "es",
    },
    {
      animal: "Pescado",
      cut: "salmon",
      weightKg: "1",
      thicknessCm: "3",
      doneness: "medium",
      equipment: "Napoleon Rogue 525-2",
      language: "es",
    },
  ];
}

function runStepsDiversityProbe(): {
  repeated: boolean;
  samples: StepsProbeSample[];
} {
  const probeCases = buildDiversityProbeCases();
  const samples: StepsProbeSample[] = [];

  for (const input of probeCases) {
    const plan = generateCookingPlan(input);
    const stepsText = normalizeText(getPlanStepsText(plan, input.language));
    samples.push({ input, stepsText });
  }

  const uniqueSteps = new Set(samples.map((sample) => sample.stepsText).filter(Boolean));
  return { repeated: uniqueSteps.size <= 1, samples };
}

async function main() {
  const rows: CsvRow[] = [];
  let caseCounter = 0;
  let passed = 0;
  let failed = 0;
  let warnings = 0;

  for (const animal of animalCatalog) {
    const animalNameByLanguage = {
      es: animal.names.es,
      en: animal.names.en,
    } as const;

    const cuts = getCutsByAnimal(animal.id);
    const donenessList = donenessListForAnimal(animal.id);

    for (const cut of cuts) {
      for (const thickness of THICKNESS_CM) {
        for (const doneness of donenessList) {
          for (const equipment of EQUIPMENT) {
            for (const language of LANGUAGES) {
              caseCounter += 1;
              const caseId = `case-${String(caseCounter).padStart(6, "0")}`;

              const input: CookingInput = {
                animal: animalNameByLanguage[language],
                cut: cut.id,
                thicknessCm: thickness,
                doneness,
                equipment,
                weightKg: WEIGHT_KG,
                language,
              };

              try {
                const plan = generateCookingPlan(input);
                const steps = generateCookingSteps(input);
                const issues = validateCaseOutput(input, plan, steps);
                const excerpt = getResponseExcerpt(plan, steps);

                const hasError = issues.some((issue) => issue.severity === "error");
                const hasWarning = issues.some((issue) => issue.severity === "warning");
                const status = hasError ? "failed" : hasWarning ? "warning" : "passed";

                if (status === "passed") {
                  passed += 1;
                  rows.push({
                    case_id: caseId,
                    animal: input.animal,
                    cut: input.cut,
                    thickness: input.thicknessCm,
                    doneness: input.doneness,
                    equipment: input.equipment,
                    language: input.language,
                    status,
                    severity: "",
                    issue_code: "",
                    issue_message: "",
                    response_excerpt: excerpt,
                  });
                  continue;
                }

                if (hasError) {
                  failed += 1;
                } else {
                  warnings += 1;
                }

                for (const issue of issues) {
                  rows.push({
                    case_id: caseId,
                    animal: input.animal,
                    cut: input.cut,
                    thickness: input.thicknessCm,
                    doneness: input.doneness,
                    equipment: input.equipment,
                    language: input.language,
                    status,
                    severity: issue.severity,
                    issue_code: issue.issueCode,
                    issue_message: issue.issueMessage,
                    response_excerpt: excerpt,
                  });
                }
              } catch (error) {
                failed += 1;
                rows.push({
                  case_id: caseId,
                  animal: input.animal,
                  cut: input.cut,
                  thickness: input.thicknessCm,
                  doneness: input.doneness,
                  equipment: input.equipment,
                  language: input.language,
                  status: "failed",
                  severity: "error",
                  issue_code: "runtime_error",
                  issue_message: error instanceof Error ? error.message : String(error),
                  response_excerpt: "",
                });
              }
            }
          }
        }
      }
    }
  }

  const diversityProbe = runStepsDiversityProbe();
  if (diversityProbe.repeated) {
    warnings += 1;

    console.warn("");
    console.warn("[qa:responses] WARNING: Repeated identical PASOS/STEPS content detected.");
    console.warn("[qa:responses] The 5-case diversity probe produced the same steps output.");
    console.warn("[qa:responses] Sample cases:");
    for (const sample of diversityProbe.samples) {
      console.warn(
        `  - ${sample.input.animal} / ${sample.input.cut} / ${sample.input.thicknessCm}cm / ${sample.input.doneness} / ${sample.input.equipment}`,
      );
    }
    console.warn("");

    rows.push({
      case_id: "probe-identical-steps",
      animal: "mixed",
      cut: "mixed",
      thickness: "mixed",
      doneness: "mixed",
      equipment: "mixed",
      language: "es",
      status: "warning",
      severity: "warning",
      issue_code: "identical_steps_probe",
      issue_message:
        "Diversity probe detected repeated identical PASOS/STEPS content across all 5 probe cases.",
      response_excerpt: diversityProbe.samples[0]?.stepsText.slice(0, 240) ?? "",
    });
  }

  const csvPath = await writeCsv(rows);

  console.log("Cooking response audit");
  console.log("=====================");
  console.log(`Total cases: ${caseCounter}`);
  console.log(`Passed:      ${passed}`);
  console.log(`Failed:      ${failed}`);
  console.log(`Warnings:    ${warnings}`);
  console.log(`CSV path:    ${csvPath}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Audit script failed unexpectedly:", error);
  process.exitCode = 1;
});
