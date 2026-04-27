"use client";

type SaveMenuStatus = "idle" | "saving" | "success" | "error";

const primaryBtn =
  "inline-flex items-center justify-center rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-orange-500/30 transition hover:bg-orange-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

const secondaryBtn =
  "inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 backdrop-blur transition hover:bg-white/10 active:scale-[0.98]";

const modeBtn =
  "w-full rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20 active:scale-[0.98]";

export default function ResultActions({
  actions,
  hasResult,
  status: rawStatus,
  t,
}: {
  actions: {
    onCopy: () => void;
    onSave?: () => Promise<void>;
    onShare?: () => void;
    onStartCooking?: () => void;
  };
  hasResult: boolean;
  status?: SaveMenuStatus;
  t: {
    copy: string;
    save: string;
    saving: string;
    share: string;
    startCooking: string;
  };
}) {
  if (!hasResult) return null;

  const status = rawStatus ?? "idle";

  return (
    <div className="flex flex-col gap-4">
      {/* PRIMARY + SECONDARY */}
      <div className="flex flex-wrap items-center gap-2">
        {actions.onSave && (
          <button
            onClick={actions.onSave}
            disabled={status === "saving"}
            className={primaryBtn}
          >
            {status === "saving" ? t.saving : t.save}
          </button>
        )}

        {actions.onCopy && (
          <button onClick={actions.onCopy} className={secondaryBtn}>
            {t.copy}
          </button>
        )}

        {actions.onShare && (
          <button onClick={actions.onShare} className={secondaryBtn}>
            {t.share}
          </button>
        )}
      </div>

      {/* STATUS */}
      <div className="h-4 flex items-center">
        {status === "saving" && (
          <span className="text-xs text-orange-400 animate-pulse">
            Guardando...
          </span>
        )}

        {status === "success" && (
          <span className="text-xs text-emerald-400">
            ✔ Guardado
          </span>
        )}
      </div>

      {/* MODE ACTION */}
      {actions.onStartCooking && (
        <div className="pt-3 border-t border-white/5">
          <button onClick={actions.onStartCooking} className={modeBtn}>
            {t.startCooking}
          </button>
        </div>
      )}
    </div>
  );
}
