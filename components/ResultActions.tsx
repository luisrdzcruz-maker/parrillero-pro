"use client";

import { Badge, Button } from "@/components/ui";

type SaveMenuStatus = "idle" | "saving" | "success" | "error";

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
      <div className="flex flex-wrap items-center gap-2">
        {actions.onSave && (
          <Button
            onClick={actions.onSave}
            disabled={status === "saving"}
          >
            {status === "saving" ? t.saving : t.save}
          </Button>
        )}

        {actions.onCopy && (
          <Button onClick={actions.onCopy} variant="secondary">
            {t.copy}
          </Button>
        )}

        {actions.onShare && (
          <Button onClick={actions.onShare} variant="secondary">
            {t.share}
          </Button>
        )}
      </div>

      <div className="h-4 flex items-center">
        {status === "saving" && (
          <Badge className="animate-pulse">
            Guardando...
          </Badge>
        )}

        {status === "success" && (
          <Badge tone="success">
            ✔ Guardado
          </Badge>
        )}
      </div>

      {actions.onStartCooking && (
        <div className="pt-3 border-t border-white/5">
          <Button fullWidth onClick={actions.onStartCooking} variant="outlineAccent">
            {t.startCooking}
          </Button>
        </div>
      )}
    </div>
  );
}
