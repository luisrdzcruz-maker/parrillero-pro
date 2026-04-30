"use client";

import { useState } from "react";

export default function ShareActions({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function getShareTextWithUrl() {
    return [text, window.location.href].filter(Boolean).join("\n\n");
  }

  async function copyPlan() {
    if (!navigator.clipboard) return;

    await navigator.clipboard.writeText(getShareTextWithUrl());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function sharePlan() {
    if (navigator.share) {
      await navigator.share({
        title: "Plan de parrilla listo | Parrillero Pro",
        text,
        url: window.location.href,
      });
      return;
    }

    await copyPlan();
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={copyPlan}
        className="min-h-[52px] rounded-2xl border border-white/10 bg-white/[0.06] px-5 text-sm font-black text-white shadow-lg shadow-black/20 transition hover:bg-white/[0.09] active:scale-[0.98]"
      >
        {copied ? "Copiado ✓" : "Copiar plan"}
      </button>
      <button
        type="button"
        onClick={sharePlan}
        className="min-h-[52px] rounded-2xl border border-orange-400/30 bg-orange-500/10 px-5 text-sm font-black text-orange-200 shadow-lg shadow-orange-950/20 transition hover:bg-orange-500/15 active:scale-[0.98]"
      >
        Compartir
      </button>
    </div>
  );
}
