"use client";

import { useState } from "react";
import { Badge, Button } from "@/components/ui";

type SaveMenuStatus = "idle" | "saving" | "success" | "error";

export default function ResultActions({
  actions,
  compact = false,
  hasResult,
  lang = "es",
  secondary = false,
  status: rawStatus,
  t,
}: {
  actions: {
    onCopy: () => void;
    onSave?: () => Promise<void>;
    onShare?: () => void;
    onStartCooking?: () => void;
  };
  compact?: boolean;
  hasResult: boolean;
  lang?: "es" | "en" | "fi";
  secondary?: boolean;
  status?: SaveMenuStatus;
  t: {
    copy: string;
    save: string;
    saving: string;
    share: string;
    startCooking: string;
  };
}) {
  const [localSaveStatus, setLocalSaveStatus] = useState<SaveMenuStatus>("idle");
  const status = rawStatus ?? localSaveStatus;
  const [shareStatus, setShareStatus] = useState<"idle" | "sharing" | "shared" | "copied">("idle");
  const labels = {
    save:
      lang === "es"
        ? { idle: "Guardar", saving: "Guardando...", success: "Guardado", error: "No se pudo guardar" }
        : lang === "fi"
          ? { idle: "Tallenna", saving: "Tallennetaan...", success: "Tallennettu", error: "Tallennus ei onnistunut" }
          : { idle: "Save", saving: "Saving...", success: "Saved", error: "Could not save" },
    share:
      lang === "es"
        ? {
            idle: "Compartir",
            sharing: "Compartiendo...",
            shared: "Compartido",
            copied: "Copiado",
            sharedFeedback: "Compartido desde el menu nativo",
            copiedFeedback: "Copiado al portapapeles",
          }
        : lang === "fi"
          ? {
              idle: "Jaa",
              sharing: "Jaetaan...",
              shared: "Jaettu",
              copied: "Kopioitu",
              sharedFeedback: "Jaettu laitteen jakovalikosta",
              copiedFeedback: "Kopioitu leikepoydalle",
            }
          : {
              idle: "Share",
              sharing: "Sharing...",
              shared: "Shared",
              copied: "Copied",
              sharedFeedback: "Shared with your device share sheet",
              copiedFeedback: "Copied to clipboard",
            },
  } as const;
  const saveLabel =
    status === "saving"
      ? labels.save.saving
      : status === "success"
        ? labels.save.success
        : labels.save.idle;
  const shareLabel =
    shareStatus === "sharing"
      ? labels.share.sharing
      : shareStatus === "shared"
        ? labels.share.shared
        : shareStatus === "copied"
          ? labels.share.copied
          : labels.share.idle;
  const shareFeedback =
    shareStatus === "shared"
      ? labels.share.sharedFeedback
      : shareStatus === "copied"
        ? labels.share.copiedFeedback
        : "";

  if (!hasResult) return null;

  async function handleSavePlan() {
    if (!actions.onSave || typeof window === "undefined") return;

    if (!rawStatus) setLocalSaveStatus("saving");

    try {
      await actions.onSave();
      if (!rawStatus) {
        setLocalSaveStatus("success");
        window.setTimeout(() => setLocalSaveStatus("idle"), 2200);
      }
    } catch {
      if (!rawStatus) setLocalSaveStatus("error");
    }
  }

  function getShareText() {
    if (lang === "es") {
      return "Resultado de coccion de Parrillero Pro. Abre la app para revisar el plan completo.";
    }
    if (lang === "fi") {
      return "Parrillero Pron kypsennystulos. Avaa sovellus ja tarkista koko suunnitelma.";
    }
    return "Parrillero Pro cooking result. Open the app to review the full plan.";
  }

  async function handleNativeShare() {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    setShareStatus("sharing");

    const shareData = {
      title: "Parrillero Pro",
      text: getShareText(),
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    try {
      if ("share" in navigator && navigator.share) {
        await navigator.share(shareData);
        setShareStatus("shared");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          [shareData.title, shareData.text, shareData.url].filter(Boolean).join("\n\n"),
        );
        setShareStatus("copied");
      } else {
        setShareStatus("idle");
        return;
      }

      window.setTimeout(() => setShareStatus("idle"), 2200);
    } catch {
      setShareStatus("idle");
      // User cancellation or platform share errors should not interrupt the result flow.
    }
  }

  async function handleShare() {
    if (actions.onShare) {
      actions.onShare();
      return;
    }

    await handleNativeShare();
  }

  return (
    <div className={compact ? "flex flex-col gap-2" : "flex flex-col gap-3"}>
      <div className={compact ? "grid grid-cols-3 gap-2" : "flex flex-wrap items-center gap-2"}>
        {actions.onSave && (
          <Button
            aria-busy={status === "saving"}
            className={
              compact || secondary ? "px-3 py-2 text-xs font-bold" : "px-5 py-3 font-black"
            }
            onClick={handleSavePlan}
            disabled={status === "saving" || status === "success"}
            variant={secondary ? "secondary" : "primary"}
          >
            {saveLabel}
          </Button>
        )}

        {actions.onCopy && (
          <Button
            className={compact ? "px-3 py-2 text-xs" : undefined}
            onClick={actions.onCopy}
            variant="secondary"
          >
            {t.copy}
          </Button>
        )}

        <Button
          aria-busy={shareStatus === "sharing"}
          className={compact ? "px-3 py-2 text-xs" : undefined}
          onClick={handleShare}
          disabled={shareStatus === "sharing"}
          variant="secondary"
        >
          {shareLabel}
        </Button>
      </div>

      <div className={compact ? "flex min-h-0 items-center" : "flex min-h-5 items-center"}>
        {status === "saving" && (
          <Badge
            className="inline-flex items-center gap-2 border-orange-400/35 bg-orange-500/15 text-orange-100 shadow-sm shadow-black/10 motion-reduce:transition-none"
            tone="glass"
          >
            <span
              className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-orange-400/35 border-t-orange-200 motion-reduce:animate-none"
              aria-hidden
            />
            {labels.save.saving}
          </Badge>
        )}

        {status === "success" && <Badge tone="success">{labels.save.success}</Badge>}

        {status === "error" && (
          <Badge tone="danger">{labels.save.error}</Badge>
        )}

        {!compact &&
          shareFeedback &&
          status !== "saving" &&
          status !== "success" &&
          status !== "error" && (
            <Badge className="transition-all duration-200" tone="success">
              {shareFeedback}
            </Badge>
          )}
      </div>

      {!compact && actions.onStartCooking && (
        <div className="pt-3 border-t border-white/5">
          <Button
            className="py-3 font-black"
            fullWidth
            onClick={actions.onStartCooking}
            variant="outlineAccent"
          >
            {t.startCooking}
          </Button>
        </div>
      )}
    </div>
  );
}
