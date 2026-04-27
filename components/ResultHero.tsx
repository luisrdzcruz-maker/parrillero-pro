"use client";

import ResultActions from "@/components/ResultActions";
import { Button, Panel } from "@/components/ui";

type SaveMenuStatus = "idle" | "saving" | "success" | "error";

export default function ResultHero({
  actions,
  context,
  hasResult,
  onEdit,
  saveMenuStatus,
  t,
}: {
  actions: {
    onCopy: () => void;
    onSave?: () => Promise<void>;
    onShare?: () => void;
    onStartCooking?: () => void;
  };
  context?: string;
  hasResult: boolean;
  onEdit?: () => void;
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
    <Panel as="section" className="relative mb-3 p-3 sm:mb-5 sm:p-5" tone="hero">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-orange-500/12 blur-3xl" />

      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-black uppercase tracking-[0.2em] text-orange-300">
              {context || "Plan de cocción"}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Resultado listo 🔥
            </h2>
          </div>

          {onEdit ? (
            <Button
              className="shrink-0 rounded-full px-3 py-2 text-xs"
              onClick={onEdit}
              variant="secondary"
            >
              ← Editar plan
            </Button>
          ) : null}
        </div>

        {actions.onStartCooking && (
          <Button
            className="px-4 py-4 text-base font-black"
            fullWidth
            onClick={actions.onStartCooking}
            variant="outlineAccent"
          >
            {t.startCooking}
          </Button>
        )}

        <ResultActions
          actions={{ ...actions, onStartCooking: undefined }}
          compact
          hasResult={hasResult}
          secondary
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
    </Panel>
  );
}
