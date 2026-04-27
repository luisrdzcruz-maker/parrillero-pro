"use client";

import ResultActions from "@/components/ResultActions";
import ResultHeader from "@/components/ResultHeader";

type SaveMenuStatus = "idle" | "saving" | "success" | "error";

export default function ResultHero({
  actions,
  hasResult,
  saveMenuStatus,
  t,
}: {
  actions: {
    onCopy: () => void;
    onSave?: () => Promise<void>;
    onShare?: () => void;
    onStartCooking?: () => void;
  };
  hasResult: boolean;
  saveMenuStatus?: SaveMenuStatus;
  t: {
    copy: string;
    result: string;
    save: string;
    saving: string;
    share: string;
    startCooking: string;
  };
}) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950 p-5 shadow-xl shadow-black/20 ring-1 ring-inset ring-white/[0.03] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />
      <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-orange-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 h-32 w-32 rounded-full bg-red-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <ResultHeader title={t.result} />
        <div className="md:max-w-sm">
          <ResultActions
            actions={actions}
            hasResult={hasResult}
            status={saveMenuStatus}
            t={{
              copy: t.copy,
              save: t.save,
              saving: t.saving,
              share: t.share,
              startCooking: t.startCooking,
            }}
          />
        </div>
      </div>
    </section>
  );
}
