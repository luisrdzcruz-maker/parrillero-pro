"use client";

import ResultActions from "@/components/ResultActions";
import ResultHeader from "@/components/ResultHeader";
import { Button, Panel } from "@/components/ui";

type SaveMenuStatus = "idle" | "saving" | "success" | "error";

export default function ResultHero({
  actions,
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
    <Panel as="section" className="relative mb-3 p-2.5 sm:mb-6 sm:p-6" tone="hero">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />
      <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-orange-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 h-32 w-32 rounded-full bg-red-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-3 sm:hidden">
        <div className="flex items-start justify-between gap-2">
          {onEdit ? (
            <Button className="rounded-full px-2.5 py-1.5 text-xs" onClick={onEdit} variant="secondary">
              ← Editar plan
            </Button>
          ) : (
            <div />
          )}
        </div>

        <h2 className="text-xl font-black tracking-tight text-white">{t.result}</h2>

        <ResultActions
          actions={{ ...actions, onStartCooking: undefined }}
          compact
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

        {actions.onStartCooking && (
          <Button className="px-3 py-2.5 text-sm font-black" fullWidth onClick={actions.onStartCooking} variant="outlineAccent">
            {t.startCooking}
          </Button>
        )}
      </div>

      <div className="relative z-10 hidden flex-col gap-6 sm:flex md:flex-row md:items-start md:justify-between">
        <div className="space-y-4">
          {onEdit && (
            <Button className="rounded-full px-4 py-2 text-sm" onClick={onEdit} variant="secondary">
              ← Editar plan
            </Button>
          )}
          <ResultHeader title={t.result} />
        </div>
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
    </Panel>
  );
}
