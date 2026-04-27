"use client";

import { useState } from "react";
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
  const status = rawStatus ?? "idle";
  const [shareStatus, setShareStatus] = useState<"idle" | "sharing" | "shared" | "copied">("idle");
  const isEnglish = t.copy.toLowerCase().includes("copy");
  const shareLabel =
    shareStatus === "sharing"
      ? isEnglish
        ? "Sharing..."
        : "Compartiendo..."
      : shareStatus === "shared"
        ? isEnglish
          ? "Shared"
          : "Compartido"
        : shareStatus === "copied"
          ? isEnglish
            ? "Copied"
            : "Copiado"
          : isEnglish
            ? "Share"
            : "Compartir";
  const shareFeedback =
    shareStatus === "shared"
      ? isEnglish
        ? "Shared with your device share sheet"
        : "Compartido desde el menú nativo"
      : shareStatus === "copied"
        ? isEnglish
          ? "Copied to clipboard"
          : "Copiado al portapapeles"
        : "";

  if (!hasResult) return null;

  function getShareText() {
    return isEnglish
      ? "Parrillero Pro cooking result. Open the app to review the full plan."
      : "Resultado de cocción de Parrillero Pro. Abre la app para revisar el plan completo.";
  }

  async function handleNativeShare() {
    setShareStatus("sharing");

    const shareData = {
      title: "Parrillero Pro",
      text: getShareText(),
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus("shared");
      } else {
        await navigator.clipboard.writeText(
          [shareData.title, shareData.text, shareData.url].filter(Boolean).join("\n\n")
        );
        setShareStatus("copied");
      }

      window.setTimeout(() => setShareStatus("idle"), 2200);
    } catch {
      setShareStatus("idle");
      // User cancellation or platform share errors should not interrupt the result flow.
    }
  }

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
          <Button onClick={handleNativeShare} disabled={shareStatus === "sharing"} variant="secondary">
            {shareLabel}
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

        {shareFeedback && status !== "saving" && status !== "success" && (
          <Badge className="transition-all duration-200" tone="success">
            {shareFeedback}
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
