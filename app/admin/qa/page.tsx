"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Grid } from "@/components/ui/Grid";
import { Panel } from "@/components/ui/Panel";
import { Section } from "@/components/ui/Section";
import { Shell, ShellContainer } from "@/components/ui/Shell";
import { cx, ds } from "@/lib/design-system";
import { type CookingQaResult, runCookingQA } from "@/lib/cookingQaRun";
import { useCallback, useState } from "react";

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

export default function AdminQaPage() {
  const [data, setData] = useState<CookingQaResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setData(runCookingQA());
      setLoading(false);
    }, 16);
  }, []);

  const showSkeleton = loading;

  return (
    <Shell className="!pb-12">
      <ShellContainer>
        <header className={cx(ds.layout.pageSection, "border-b border-white/10 pb-6")}>
          <p className={ds.text.eyebrow}>Internal</p>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">QA Dashboard</h1>
          <p className={cx(ds.text.subtitle, "mt-2 max-w-2xl")}>Cooking Engine Health</p>
        </header>

        <Section className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={handleRun}
              disabled={loading}
              className="min-h-[44px] rounded-2xl px-6"
            >
              {loading ? "Running…" : "Run QA"}
            </Button>
            {data && !loading && (
              <span className={ds.text.muted}>
                Last run: {data.total} combinations · {data.failures.length} in failure table
              </span>
            )}
          </div>
        </Section>

        <Section className="pt-2">
          {showSkeleton ? (
            <SummarySkeleton />
          ) : data ? (
            <Grid variant="cards" className="grid-cols-2 lg:grid-cols-4">
              <Card className="transition duration-200 hover:-translate-y-0.5 hover:border-white/20 active:scale-[0.99]">
                <p className={ds.text.muted}>Total tests</p>
                <p className="mt-1 text-3xl font-black tabular-nums text-white">{data.total}</p>
              </Card>
              <Card className="border-emerald-500/25 bg-emerald-500/5 transition duration-200 hover:-translate-y-0.5 active:scale-[0.99]">
                <p className="text-slate-400">Passed</p>
                <p className="mt-1 text-3xl font-black tabular-nums text-emerald-200">{data.passed}</p>
                <Badge tone="success" className="mt-2">
                  OK
                </Badge>
              </Card>
              <Card className="border-red-500/25 bg-red-500/5 transition duration-200 hover:-translate-y-0.5 active:scale-[0.99]">
                <p className="text-slate-400">Failed</p>
                <p className="mt-1 text-3xl font-black tabular-nums text-red-200">{data.failed}</p>
                <Badge tone="danger" className="mt-2">
                  Check
                </Badge>
              </Card>
              <Card className="border-orange-500/30 bg-orange-500/5 transition duration-200 hover:-translate-y-0.5 active:scale-[0.99]">
                <p className="text-slate-400">Avg score</p>
                <p className="mt-1 text-3xl font-black tabular-nums text-orange-200">
                  {data.avgScore.toFixed(1)}
                </p>
                <div className="mt-2">
                  <ScoreBar score={data.avgScore} />
                </div>
              </Card>
            </Grid>
          ) : (
            <Panel tone="empty" as="div">
              <p className={ds.text.body}>
                No results yet. Click <strong className="text-white">Run QA</strong> to execute the local cooking
                engine matrix (no OpenAI).
              </p>
            </Panel>
          )}
        </Section>

        <Section className="pt-4">
          <h2 className="text-lg font-bold text-white">Failures</h2>
          <p className={cx(ds.text.muted, "mt-1")}>Scroll for full list. Scores are 0–100 (quality heuristic).</p>

          {showSkeleton ? (
            <Panel tone="form" as="div" className="mt-4">
              <TableSkeleton />
            </Panel>
          ) : data && data.failures.length > 0 ? (
            <Panel tone="form" as="div" className="mt-4 !p-0">
              <div className="max-h-[min(70vh,32rem)] overflow-auto overscroll-x-contain">
                <table className="w-full min-w-[640px] border-collapse text-left text-xs sm:text-sm">
                  <thead className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 backdrop-blur">
                    <tr>
                      {["Animal", "Cut", "Doneness", "Thickness", "Equipment", "Error", "Score", " "].map((h) => (
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
                    {data.failures.map((f, i) => (
                      <tr
                        key={`${f.cut}-${f.doneness}-${f.equipment}-${i}`}
                        className="border-b border-white/5 transition-colors hover:bg-white/[0.04]"
                      >
                        <td className="px-2 py-2 align-top sm:px-3">{f.animal}</td>
                        <td className="px-2 py-2 align-top font-mono text-xs text-slate-300 sm:px-3">{f.cut}</td>
                        <td className="px-2 py-2 align-top sm:px-3">{f.doneness}</td>
                        <td className="px-2 py-2 align-top tabular-nums sm:px-3">{f.thickness} cm</td>
                        <td className="max-w-[8rem] px-2 py-2 align-top text-slate-300 sm:max-w-none sm:px-3">
                          {f.equipment}
                        </td>
                        <td className="min-w-[10rem] max-w-[20rem] px-2 py-2 align-top text-slate-400 sm:px-3">
                          {f.error}
                        </td>
                        <td className="px-2 py-2 align-top tabular-nums sm:px-3">{f.score}</td>
                        <td className="w-32 min-w-[6rem] px-2 py-1.5 sm:px-3">
                          <ScoreBar score={f.score} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ) : data ? (
            <Panel tone="empty" as="div" className="mt-4">
              <p className={ds.text.body}>No failures — all combinations passed validation and quality threshold.</p>
            </Panel>
          ) : null}
        </Section>
      </ShellContainer>
    </Shell>
  );
}
