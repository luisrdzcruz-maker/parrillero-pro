"use client";

import Image from "next/image";
import { useState } from "react";
import { getResultCardAccent, getResultCardIcon, getResultCardTitle } from "@/lib/uiHelpers";
import {
  detectSetupFromText,
  getSetupVisual,
  SETUP_VISUAL_FALLBACK,
  type SetupEquipment,
  type SetupType,
} from "@/lib/setupVisualMap";
import { Panel } from "@/components/ui";
import { ds } from "@/lib/design-system";

type ResultCardProps = {
  title: string;
  content?: string;
  equipment?: string;
  setup?: SetupType;
  lang?: "es" | "en" | "fi";
  variant?: "default" | "primary" | "summary" | "tip" | "setup";
};

const cardClassName =
  "group transition-all duration-300 motion-reduce:transition-none [@media(hover:hover)]:hover:-translate-y-0.5 motion-reduce:[@media(hover:hover)]:hover:translate-y-0 [@media(hover:hover)]:hover:border-orange-500/30 [@media(hover:hover)]:hover:shadow-xl [@media(hover:hover)]:hover:shadow-orange-500/10 active:scale-[0.99] motion-reduce:active:scale-100";

const inlineFallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='700' viewBox='0 0 1200 700'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='30%25' r='70%25'%3E%3Cstop offset='0%25' stop-color='%23f97316' stop-opacity='.45'/%3E%3Cstop offset='60%25' stop-color='%230f172a'/%3E%3Cstop offset='100%25' stop-color='%23020617'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='1200' height='700' fill='url(%23g)'/%3E%3Cpath d='M280 470h640' stroke='%23fb923c' stroke-width='18' stroke-linecap='round' opacity='.55'/%3E%3Cpath d='M340 405h520' stroke='%23fed7aa' stroke-width='10' stroke-linecap='round' opacity='.38'/%3E%3Ccircle cx='600' cy='300' r='105' fill='%23f97316' opacity='.18'/%3E%3C/svg%3E";

// ─── Variant semantic label ───────────────────────────────────────────────────

function getVariantLabel(
  variant: NonNullable<ResultCardProps["variant"]>,
  lang: "es" | "en" | "fi",
): string {
  const isEs = lang === "es";
  switch (variant) {
    case "primary":
      return isEs ? "Pasos de cocción" : "Cooking steps";
    case "tip":
      return isEs ? "Error crítico" : "Critical error";
    case "summary":
      return isEs ? "Tiempos · Temperatura" : "Times · Temperature";
    case "setup":
      return isEs ? "Setup del fuego" : "Fire setup";
    default:
      return "Plan";
  }
}

// ─── Numbered step parser ─────────────────────────────────────────────────────

function parseStepLine(line: string): { number: string; text: string } | null {
  const match = line.match(/^(\d+)[.)]\s+(.+)/);
  return match ? { number: match[1], text: match[2] } : null;
}

// ─── ResultCardHeader ─────────────────────────────────────────────────────────

function ResultCardHeader({
  accent,
  icon,
  lang,
  title,
  variant,
}: {
  accent: string;
  icon: string;
  lang: "es" | "en" | "fi";
  title: string;
  variant: NonNullable<ResultCardProps["variant"]>;
}) {
  const isPrimary = variant === "primary";

  return (
    <div className="flex items-start gap-3">
      <div
        className={`${ds.media.iconBox} ${isPrimary ? "h-12 w-12 text-xl" : "h-10 w-10 text-base"} rounded-2xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.04]`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300/90">
          {getVariantLabel(variant, lang)}
        </p>
        <h3
          className={`${isPrimary ? "text-xl sm:text-2xl" : "text-base"} mt-1 font-black tracking-tight text-white`}
        >
          {title}
        </h3>
        <div className={`mt-2 h-0.5 w-10 rounded-full ${accent}`} />
      </div>
    </div>
  );
}

// ─── ResultCardContent ────────────────────────────────────────────────────────

function ResultCardContent({
  lines,
  variant,
}: {
  lines: string[];
  variant: NonNullable<ResultCardProps["variant"]>;
}) {
  const isPrimary = variant === "primary";
  const isTip = variant === "tip";

  // For the PASOS/STEPS card: detect numbered steps and give each its own row
  if (isPrimary && lines.some((l) => parseStepLine(l) !== null)) {
    return (
      <div className="mt-5 space-y-2.5 border-t border-white/5 pt-4">
        {lines.map((line, index) => {
          const step = parseStepLine(line);

          if (step) {
            return (
              <div
                key={`${line}-${index}`}
                className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3.5 shadow-inner shadow-black/10 ring-1 ring-inset ring-white/[0.03]"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/25 text-[11px] font-black text-orange-300 ring-1 ring-inset ring-orange-400/20">
                  {step.number}
                </span>
                <p className="flex-1 text-base leading-relaxed text-slate-100">{step.text}</p>
              </div>
            );
          }

          return (
            <p key={`${line}-${index}`} className="px-1 text-sm leading-relaxed text-slate-400">
              {line}
            </p>
          );
        })}
      </div>
    );
  }

  // Default: single scrollable block
  return (
    <div className={isTip ? "mt-3" : "mt-5 border-t border-white/5 pt-4"}>
      <div
        className={`space-y-2.5 rounded-2xl border border-white/[0.06] bg-black/15 shadow-inner shadow-black/10 ring-1 ring-inset ring-white/[0.03] ${
          isPrimary
            ? "p-4 text-base leading-7 text-slate-100"
            : isTip
              ? "border-red-400/20 bg-red-500/[0.06] p-3 text-sm font-semibold leading-6 text-red-50"
              : "p-3.5 text-sm leading-relaxed text-slate-300"
        }`}
      >
        {lines.map((line, index) => (
          <p key={`${line}-${index}`} className="whitespace-pre-wrap">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

// ─── Setup Visual ─────────────────────────────────────────────────────────────

function isSetupCard(title: string) {
  const normalizedTitle = title.toUpperCase();
  return (
    normalizedTitle.includes("SETUP") ||
    normalizedTitle.includes("CONFIGURACION") ||
    normalizedTitle.includes("CONFIGURACIÓN")
  );
}

function normalizeSetupText(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveSetupEquipment(value = ""): SetupEquipment | undefined {
  const normalized = normalizeSetupText(value);

  if (normalized.includes("kamado")) return "kamado";
  if (
    normalized.includes("interior") ||
    normalized.includes("indoor") ||
    normalized.includes("cocina") ||
    normalized.includes("sarten") ||
    normalized.includes("horno") ||
    normalized.includes("oven")
  ) {
    return "indoor";
  }
  if (normalized.includes("carbon") || normalized.includes("charcoal")) return "charcoal";
  if (normalized.includes("gas") || normalized.includes("napoleon") || normalized.includes("rogue")) {
    return "gas";
  }

  return undefined;
}

type SetupOverlayChip = {
  label: string;
  tone: "direct" | "indirect" | "neutral";
};

function getSetupOverlayChips(setup?: SetupType): SetupOverlayChip[] {
  const normalizedSetup = normalizeSetupText(setup).replace(/[_\s]+/g, "-");

  if (normalizedSetup === "reverse-sear") {
    return [
      { label: "❄️ Indirecto", tone: "indirect" },
      { label: "Sellado final", tone: "direct" },
    ];
  }

  if (normalizedSetup === "low-slow" || normalizedSetup === "low-and-slow") {
    return [
      { label: "❄️ Indirecto", tone: "indirect" },
      { label: "Baja temperatura", tone: "neutral" },
    ];
  }

  if (normalizedSetup === "two-zone") {
    return [
      { label: "🔥 Directo + ❄️ Indirecto", tone: "neutral" },
      { label: "2 zonas", tone: "neutral" },
    ];
  }

  if (normalizedSetup === "indirect" || normalizedSetup === "indirecto") {
    return [{ label: "❄️ Indirecto", tone: "indirect" }];
  }

  if (normalizedSetup === "direct" || normalizedSetup === "direct-heat" || normalizedSetup === "directo") {
    return [{ label: "🔥 Directo", tone: "direct" }];
  }

  return [
    { label: "🔥 Directo + ❄️ Indirecto", tone: "neutral" },
    { label: "2 zonas", tone: "neutral" },
  ];
}

function getSetupOverlayChipClass(tone: SetupOverlayChip["tone"]) {
  const base =
    "rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-black uppercase leading-none tracking-[0.08em] shadow-lg backdrop-blur-md ring-1 ring-inset ring-white/10";

  if (tone === "direct") {
    return `${base} text-orange-200 shadow-orange-950/40`;
  }

  if (tone === "indirect") {
    return `${base} text-sky-200 shadow-sky-950/40`;
  }

  return `${base} text-white shadow-black/30`;
}

function SetupVisualImage({ src }: { src: string }) {
  const [fallbackStep, setFallbackStep] = useState<"none" | "asset" | "inline">("none");
  const imageSrc =
    fallbackStep === "inline"
      ? inlineFallbackImage
      : fallbackStep === "asset"
        ? SETUP_VISUAL_FALLBACK
        : src;

  function handleImageError() {
    setFallbackStep((current) =>
      current === "none" && src !== SETUP_VISUAL_FALLBACK ? "asset" : "inline",
    );
  }

  return (
    <Image
      src={imageSrc}
      alt=""
      fill
      sizes="(min-width: 640px) 640px, 100vw"
      className="object-cover"
      onError={handleImageError}
    />
  );
}

function SetupVisualToggle({
  content,
  equipment,
  lang,
  setup,
  title,
}: {
  content: string;
  equipment?: string;
  lang: "es" | "en" | "fi";
  setup?: SetupType;
  title: string;
}) {
  const [open, setOpen] = useState(true);
  const setupEquipment = resolveSetupEquipment(equipment) ?? resolveSetupEquipment(content);
  const detectedSetup = setup ?? detectSetupFromText(content);
  const setupImage = getSetupVisual(setupEquipment, detectedSetup);
  const isEs = lang === "es";
  const overlayChips = getSetupOverlayChips(detectedSetup);

  if (!isSetupCard(title)) return null;

  return (
    <div className="mt-4 rounded-[1.5rem] border border-orange-300/25 bg-[radial-gradient(circle_at_16%_0%,rgba(251,146,60,0.18),transparent_34%),rgba(249,115,22,0.055)] p-3 shadow-xl shadow-orange-950/10 ring-1 ring-inset ring-orange-200/[0.05]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="text-base" aria-hidden>
            🗺️
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-300">
              Setup visual
            </p>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
              {isEs ? "Zonas de calor y flujo recomendado" : "Heat zones and suggested flow"}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-orange-400/30 bg-orange-500/15 px-3 py-1.5 text-xs font-black text-orange-200 shadow-lg shadow-orange-950/10 transition-colors hover:bg-orange-500/25 active:scale-[0.97]">
          {open ? (isEs ? "Ocultar" : "Hide") : isEs ? "Ver →" : "View →"}
        </span>
      </button>

      <div
        className={
          open
            ? "grid grid-rows-[1fr] opacity-100 transition-all duration-300 ease-out"
            : "grid grid-rows-[0fr] opacity-0 transition-all duration-300 ease-out"
        }
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={
              open
                ? "mt-4 translate-y-0 transition-transform duration-300 ease-out"
                : "mt-4 translate-y-2 transition-transform duration-300 ease-out"
            }
          >
            <div className="relative overflow-hidden rounded-[1.25rem] border border-orange-200/15 bg-slate-950 shadow-2xl shadow-black/30 ring-1 ring-inset ring-white/[0.04]">
              <div className="relative h-52 w-full sm:h-64">
                <SetupVisualImage key={setupImage} src={setupImage} />
              </div>

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_4%,rgba(251,146,60,0.2),transparent_28%),radial-gradient(circle_at_28%_0%,rgba(56,189,248,0.13),transparent_24%),linear-gradient(135deg,rgba(2,6,23,0.88)_0%,rgba(2,6,23,0.5)_26%,rgba(2,6,23,0.12)_48%,transparent_68%)]"
              />
              <div className="pointer-events-none absolute left-0 top-0 flex max-w-[82%] flex-wrap items-start gap-2 p-3 sm:max-w-[70%] sm:p-4">
                {overlayChips.map((chip) => (
                  <span key={`${chip.tone}-${chip.label}`} className={getSetupOverlayChipClass(chip.tone)}>
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card tone ────────────────────────────────────────────────────────────────

function getCardTone(variant: NonNullable<ResultCardProps["variant"]>) {
  if (variant === "primary") {
    return "border-orange-400/35 bg-gradient-to-br from-orange-500/12 via-slate-900/95 to-slate-950 shadow-orange-500/10";
  }

  if (variant === "tip") {
    return "border-red-400/30 bg-gradient-to-br from-slate-900/95 to-red-950/22 shadow-red-950/10";
  }

  if (variant === "summary") {
    return "border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-950/80";
  }

  return "";
}

// ─── ResultCard ───────────────────────────────────────────────────────────────

export default function ResultCard({
  title,
  content,
  equipment,
  lang = "es",
  setup,
  variant = "default",
}: ResultCardProps) {
  if (!content?.trim()) return null;

  const icon = getResultCardIcon(title);
  const cleanTitle = getResultCardTitle(title);
  const accent = getResultCardAccent(title);
  const contentLines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <Panel as="article" className={`${cardClassName} ${getCardTone(variant)}`} tone="result">
      <div className={`absolute left-0 top-0 h-full w-[3px] rounded-l-2xl ${accent}`} />
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-xl" />
      </div>
      <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-orange-500/0 blur-3xl transition group-hover:bg-orange-500/10" />

      <div className="relative z-10 p-4 sm:p-5">
        <ResultCardHeader
          accent={accent}
          icon={icon}
          lang={lang}
          title={cleanTitle}
          variant={variant}
        />
        <ResultCardContent lines={contentLines} variant={variant} />
        <SetupVisualToggle content={content} equipment={equipment} lang={lang} setup={setup} title={title} />
      </div>
    </Panel>
  );
}
