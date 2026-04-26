"use client";

type SaveMenuStatus = "idle" | "saving" | "success" | "error";

export default function ResultActions({
  actions,
  hasResult,
  status,
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

  const safeStatus = status ?? "idle";

  return (
    <div className="flex flex-wrap gap-2">
      {actions.onStartCooking && (
        <button onClick={actions.onStartCooking} className="rounded-xl bg-orange-500 px-3 py-2 text-sm font-bold">
          {t.startCooking}
        </button>
      )}
      {actions.onSave && (
        <button
          onClick={actions.onSave}
          disabled={safeStatus === "saving"}
          className="rounded-xl bg-orange-500 px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {safeStatus === "saving" ? t.saving : t.save}
        </button>
      )}
      <button onClick={actions.onCopy} className="rounded-xl border border-slate-700 px-3 py-2 text-sm">{t.copy}</button>
      {actions.onShare && <button onClick={actions.onShare} className="rounded-xl bg-green-600 px-3 py-2 text-sm font-bold">{t.share}</button>}
    </div>
  );
}
