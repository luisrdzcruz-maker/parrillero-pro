"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Grid } from "@/components/ui/Grid";
import { Panel } from "@/components/ui/Panel";
import { Section } from "@/components/ui/Section";
import { Shell, ShellContainer } from "@/components/ui/Shell";
import { cx, ds } from "@/lib/design-system";
import {
  type AdminQaResult,
  runAdminCookingQA,
} from "@/lib/qa/cookingDashboardQa";
import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "parrillero_admin_qa_last_result";

type StoredQaRun = {
  result: AdminQaResult;
  ranAt: string;
};

type QaFilters = {
  animal: string;
  cut: string;
  equipment: string;
  failedOnly: boolean;
};

const EMPTY_FILTERS: QaFilters = {
  animal: "all",
  cut: "all",
  equipment: "all",
  failedOnly: true,
};

function scoreBarColor(score: number): string {
  if (score > 80) return "bg-emerald-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

function ScoreBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className={cx(ds.media.progressTrack, "mt-0 h-2")}>
      <div
        className={cx("h-full rounded-full transition-all duration-300", scoreBarColor(score))}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function scoreTone(score: number): "success" | "danger" | "accent" {
  if (score > 80) return "success";
  if (score >= 50) return "accent";
  return "danger";
}

function SummarySkeleton() {
  return (
    <Grid variant="cards" className="grid-cols-2 lg:grid-cols-4">
      {["a", "b", "c", "d"].map((k) => (
        <Card key={k} tone="glass" className="animate-pulse">
          <div className="h-3 w-24 rounded bg-slate-700" />
          <div className="mt-3 h-8 w-16 rounded bg-slate-700" />
        </Card>
      ))}
    </Grid>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-8 rounded bg-slate-800" />
      <div className="h-8 rounded bg-slate-800" />
      <div className="h-8 rounded bg-slate-800" />
    </div>
  );
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function formatTimestamp(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function loadStoredRun(): StoredQaRun | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredQaRun;
    if (!parsed?.result?.cases || !parsed.ranAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStoredRun(run: StoredQaRun): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
  } catch {
    // Storage is best-effort internal tooling state.
  }
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10"
      >
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function KpiCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: "neutral" | "success" | "danger" | "accent";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-500/25 bg-emerald-500/5"
      : tone === "danger"
        ? "border-red-500/25 bg-red-500/5"
        : tone === "accent"
          ? "border-orange-500/30 bg-orange-500/5"
          : "border-white/10 bg-white/[0.04]";

  return (
    <Card
      className={cx(
        "transition duration-200 hover:-translate-y-0.5 active:scale-[0.99]",
        toneClass,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tabular-nums text-white md:text-4xl">{value}</p>
      {detail && <p className="mt-2 text-xs text-slate-400">{detail}</p>}
    </Card>
  );
}

export default function AdminQaPage() {
  const [data, setData] = useState<AdminQaResult | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<QaFilters>(EMPTY_FILTERS);

  useEffect(() => {
    const stored = loadStoredRun();
    if (!stored) return;

    const id = window.setTimeout(() => {
      setData(stored.result);
      setLastRunAt(stored.ranAt);
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  const handleRun = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const result = runAdminCookingQA();
      const ranAt = new Date().toISOString();
      setData(result);
      setLastRunAt(ranAt);
      saveStoredRun({ result, ranAt });
      setLoading(false);
    }, 16);
  }, []);

  const filterOptions = useMemo(() => {
    const cases = data?.cases ?? [];
    return {
      animals: uniqueSorted(cases.map((item) => item.animal)),
      cuts: uniqueSorted(cases.map((item) => item.cut)),
      equipment: uniqueSorted(cases.map((item) => item.equipment)),
    };
  }, [data]);

  const filteredCases = useMemo(() => {
    const cases = data?.cases ?? [];
    return cases.filter((item) => {
      if (filters.failedOnly && item.status !== "failed") return false;
      if (filters.animal !== "all" && item.animal !== filters.animal) return false;
      if (filters.cut !== "all" && item.cut !== filters.cut) return false;
      if (filters.equipment !== "all" && item.equipment !== filters.equipment) return false;
      return true;
    });
  }, [data, filters]);

  const filteredFailures = filteredCases.filter((item) => item.status === "failed");
  const showSkeleton = loading;

  return (
    <Shell className="!pb-12">
      <ShellContainer>
        <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950 p-5 shadow-2xl shadow-black/25 ring-1 ring-inset ring-white/[0.03] md:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Internal QA</Badge>
                <Badge tone={data?.failed ? "danger" : data ? "success" : "glass"}>
                  {data ? (data.failed > 0 ? "Action needed" : "Healthy") : "Idle"}
                </Badge>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl">
                QA Dashboard
              </h1>
              <p className={cx(ds.text.subtitle, "mt-2 max-w-2xl")}>
                Production-level local cooking engine health, filters, quality scoring and persisted
                last run.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-left lg:min-w-64">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Last run
              </p>
              <p className="mt-1 font-semibold text-white">{formatTimestamp(lastRunAt)}</p>
              <p className="mt-1 text-xs text-slate-500">Stored in localStorage</p>
            </div>
          </div>
        </header>

        <Section className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={handleRun}
              disabled={loading}
              className="min-h-[44px] rounded-2xl px-6 shadow-lg shadow-orange-500/20"
            >
              {loading ? "Running…" : "Run QA"}
            </Button>
            <span className={ds.text.muted}>
              QA is local-only and only runs when clicked. OpenAI is not called.
            </span>
          </div>
        </Section>

        <Section className="pt-2">
          {showSkeleton ? (
            <SummarySkeleton />
          ) : data ? (
            <Grid variant="cards" className="grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Total tests"
                value={data.total}
                detail={`${filteredCases.length} visible`}
              />
              <KpiCard
                label="Passed"
                value={data.passed}
                detail="Validation + quality"
                tone="success"
              />
              <KpiCard
                label="Failed"
                value={data.failed}
                detail={`${filteredFailures.length} visible`}
                tone="danger"
              />
              <Card className="border-orange-500/30 bg-orange-500/5 transition duration-200 hover:-translate-y-0.5 active:scale-[0.99]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Avg score
                </p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="text-3xl font-black tabular-nums text-white md:text-4xl">
                    {data.avgScore.toFixed(1)}
                  </p>
                  <Badge tone={scoreTone(data.avgScore)}>{Math.round(data.avgScore)} / 100</Badge>
                </div>
                <div className="mt-2">
                  <ScoreBar score={data.avgScore} />
                </div>
              </Card>
            </Grid>
          ) : (
            <Panel tone="empty" as="div">
              <p className={ds.text.body}>
                No results yet. Click <strong className="text-white">Run QA</strong> to execute the
                local cooking engine matrix (no OpenAI).
              </p>
            </Panel>
          )}
        </Section>

        {data && (
          <Section className="pt-4">
            <Panel tone="form" as="div" className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Filters</h2>
                  <p className={cx(ds.text.muted, "mt-1")}>
                    Filter the stored run without re-running QA.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="rounded-2xl"
                >
                  Reset filters
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                <FilterSelect
                  label="Animal"
                  value={filters.animal}
                  options={filterOptions.animals}
                  onChange={(animal) => setFilters((current) => ({ ...current, animal }))}
                />
                <FilterSelect
                  label="Cut"
                  value={filters.cut}
                  options={filterOptions.cuts}
                  onChange={(cut) => setFilters((current) => ({ ...current, cut }))}
                />
                <FilterSelect
                  label="Equipment"
                  value={filters.equipment}
                  options={filterOptions.equipment}
                  onChange={(equipment) => setFilters((current) => ({ ...current, equipment }))}
                />
                <label className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={filters.failedOnly}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, failedOnly: event.target.checked }))
                    }
                    className="h-4 w-4 accent-orange-500"
                  />
                  Failed only
                </label>
              </div>
            </Panel>
          </Section>
        )}

        <Section className="pt-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Failure table</h2>
              <p className={cx(ds.text.muted, "mt-1")}>
                Compact row-level results with 0–100 quality scores.
              </p>
            </div>
            {data && (
              <Badge tone="glass">
                {filteredFailures.length} failures · {filteredCases.length} rows visible
              </Badge>
            )}
          </div>

          {showSkeleton ? (
            <Panel tone="form" as="div" className="mt-4">
              <TableSkeleton />
            </Panel>
          ) : data && filteredFailures.length > 0 ? (
            <Panel tone="form" as="div" className="mt-4 !p-0">
              <div className="max-h-[min(70vh,32rem)] overflow-auto overscroll-x-contain">
                <table className="w-full min-w-[760px] border-collapse text-left text-xs sm:text-sm">
                  <thead className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 backdrop-blur">
                    <tr>
                      {[
                        "Status",
                        "Animal",
                        "Cut",
                        "Doneness",
                        "Thickness",
                        "Equipment",
                        "Error",
                        "Score",
                      ].map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-2 py-2 font-semibold text-slate-300 sm:px-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFailures.map((f) => (
                      <tr
                        key={f.id}
                        className="border-b border-white/5 transition-colors hover:bg-white/[0.04]"
                      >
                        <td className="px-2 py-2 align-top sm:px-3">
                          <Badge tone="danger">Failed</Badge>
                        </td>
                        <td className="px-2 py-2 align-top sm:px-3">{f.animal}</td>
                        <td className="px-2 py-2 align-top font-mono text-xs text-slate-300 sm:px-3">
                          {f.cut}
                        </td>
                        <td className="px-2 py-2 align-top sm:px-3">{f.doneness}</td>
                        <td className="px-2 py-2 align-top tabular-nums sm:px-3">
                          {f.thickness} cm
                        </td>
                        <td className="max-w-[8rem] px-2 py-2 align-top text-slate-300 sm:max-w-none sm:px-3">
                          {f.equipment}
                        </td>
                        <td className="min-w-[10rem] max-w-[20rem] px-2 py-2 align-top text-slate-400 sm:px-3">
                          {f.error}
                        </td>
                        <td className="w-40 min-w-[8rem] px-2 py-1.5 sm:px-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 tabular-nums text-slate-200">{f.score}</span>
                            <div className="min-w-0 flex-1">
                              <ScoreBar score={f.score} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ) : data && !filters.failedOnly && filteredCases.length > 0 ? (
            <Panel tone="form" as="div" className="mt-4 !p-0">
              <div className="max-h-[min(70vh,32rem)] overflow-auto overscroll-x-contain">
                <table className="w-full min-w-[760px] border-collapse text-left text-xs sm:text-sm">
                  <thead className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 backdrop-blur">
                    <tr>
                      {[
                        "Status",
                        "Animal",
                        "Cut",
                        "Doneness",
                        "Thickness",
                        "Equipment",
                        "Score",
                      ].map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-2 py-2 font-semibold text-slate-300 sm:px-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-white/5 transition-colors hover:bg-white/[0.04]"
                      >
                        <td className="px-2 py-2 align-top sm:px-3">
                          <Badge tone={item.status === "passed" ? "success" : "danger"}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-2 py-2 align-top sm:px-3">{item.animal}</td>
                        <td className="px-2 py-2 align-top font-mono text-xs text-slate-300 sm:px-3">
                          {item.cut}
                        </td>
                        <td className="px-2 py-2 align-top sm:px-3">{item.doneness}</td>
                        <td className="px-2 py-2 align-top tabular-nums sm:px-3">
                          {item.thickness} cm
                        </td>
                        <td className="px-2 py-2 align-top text-slate-300 sm:px-3">
                          {item.equipment}
                        </td>
                        <td className="w-40 min-w-[8rem] px-2 py-1.5 sm:px-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 tabular-nums text-slate-200">{item.score}</span>
                            <div className="min-w-0 flex-1">
                              <ScoreBar score={item.score} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ) : data ? (
            <Panel tone="empty" as="div" className="mt-4">
              <p className={ds.text.body}>
                {data.failed === 0
                  ? "No failures — all combinations passed validation and quality threshold."
                  : "No rows match the current filters."}
              </p>
            </Panel>
          ) : (
            <Panel tone="empty" as="div" className="mt-4">
              <p className={ds.text.body}>
                No results yet. Click <strong className="text-white">Run QA</strong> to execute the
                local cooking engine matrix.
              </p>
            </Panel>
          )}
        </Section>
      </ShellContainer>
    </Shell>
  );
}
