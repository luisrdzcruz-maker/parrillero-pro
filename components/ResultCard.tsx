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
import { Badge, Button, Panel } from "@/components/ui";
import { ds } from "@/lib/design-system";

type ResultCardProps = {
  title: string;
  content?: string;
  equipment?: string;
  setup?: SetupType;
  variant?: "default" | "primary" | "summary" | "tip" | "setup";
};

const cardClassName =
  "group transition-all duration-300 motion-reduce:transition-none [@media(hover:hover)]:hover:-translate-y-0.5 motion-reduce:[@media(hover:hover)]:hover:translate-y-0 [@media(hover:hover)]:hover:border-orange-500/30 [@media(hover:hover)]:hover:shadow-xl [@media(hover:hover)]:hover:shadow-orange-500/10 active:scale-[0.99] motion-reduce:active:scale-100";

const inlineFallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='700' viewBox='0 0 1200 700'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='30%25' r='70%25'%3E%3Cstop offset='0%25' stop-color='%23f97316' stop-opacity='.45'/%3E%3Cstop offset='60%25' stop-color='%230f172a'/%3E%3Cstop offset='100%25' stop-color='%23020617'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='1200' height='700' fill='url(%23g)'/%3E%3Cpath d='M280 470h640' stroke='%23fb923c' stroke-width='18' stroke-linecap='round' opacity='.55'/%3E%3Cpath d='M340 405h520' stroke='%23fed7aa' stroke-width='10' stroke-linecap='round' opacity='.38'/%3E%3Ccircle cx='600' cy='300' r='105' fill='%23f97316' opacity='.18'/%3E%3C/svg%3E";

function ResultCardHeader({
  accent,
  icon,
  title,
  lineCount,
  variant,
}: {
  accent: string;
  icon: string;
  title: string;
  lineCount: number;
  variant: NonNullable<ResultCardProps["variant"]>;
}) {
  const isPrimary = variant === "primary";
  const isTip = variant === "tip";

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`${ds.media.iconBox} ${isPrimary ? "h-12 w-12 text-xl" : "h-10 w-10 text-base"} rounded-2xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.04]`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300/90">
            {isTip ? "Consejo clave" : isPrimary ? "Siguiente acción" : "Plan"}
          </p>
          <h3
            className={`${isPrimary ? "text-xl sm:text-2xl" : "text-base"} mt-1 truncate font-black tracking-tight text-white`}
          >
            {title}
          </h3>
          <div className={`mt-2 h-0.5 w-12 rounded-full ${accent}`} />
        </div>
      </div>

      <Badge
        className="shrink-0 border-white/10 bg-black/35 text-[11px] font-bold"
        tone={isTip ? "danger" : "glass"}
      >
        {lineCount} {lineCount === 1 ? "línea" : "líneas"}
      </Badge>
    </div>
  );
}

function ResultCardContent({
  lines,
  variant,
}: {
  lines: string[];
  variant: NonNullable<ResultCardProps["variant"]>;
}) {
  const isPrimary = variant === "primary";
  const isTip = variant === "tip";

  return (
    <div className={`${isTip ? "mt-3" : "mt-5 border-t border-white/5 pt-4"}`}>
      <div
        className={`${isPrimary ? "p-4 text-base leading-7 text-slate-100" : isTip ? "border-orange-400/15 bg-orange-500/[0.04] p-3 text-sm leading-6 text-orange-100" : "p-3.5 text-sm leading-relaxed text-slate-300"} space-y-2.5 rounded-2xl border border-white/[0.06] bg-black/15 shadow-inner shadow-black/10 ring-1 ring-inset ring-white/[0.03]`}
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
  setup,
  title,
}: {
  content: string;
  equipment?: string;
  setup?: SetupType;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const setupEquipment = resolveSetupEquipment(equipment) ?? resolveSetupEquipment(content);
  const detectedSetup = setup ?? detectSetupFromText(content);
  const setupImage = getSetupVisual(setupEquipment, detectedSetup);

  if (!isSetupCard(title)) return null;

  return (
    <div className="mt-4 rounded-2xl border border-orange-400/15 bg-orange-500/[0.04] p-3 ring-1 ring-inset ring-orange-300/[0.03]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
            Setup visual
          </p>
          <p className="mt-1 line-clamp-1 text-sm text-slate-400">
            Zonas de calor y flujo recomendado
          </p>
        </div>

        <Button
          aria-expanded={open}
          className="shrink-0 rounded-full px-3 py-2 text-xs"
          onClick={() => setOpen((current) => !current)}
          variant="outlineAccent"
        >
          {open ? "Ocultar" : "Ver setup"}
        </Button>
      </div>

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
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/25">
              <div className="relative h-44 w-full sm:h-56">
                <SetupVisualImage key={setupImage} src={setupImage} />
              </div>

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(251,146,60,0.28),transparent_34%),linear-gradient(to_top,rgba(2,6,23,0.9)_0%,rgba(2,6,23,0.38)_54%,rgba(255,255,255,0.08)_100%)]"
              />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4">
                <Badge
                  className="border-orange-400/30 bg-black/45 text-orange-200"
                  tone="glass"
                >
                  Setup del fuego
                </Badge>
                <p className="mt-2 text-sm font-semibold text-white">
                  Visualiza zonas antes de cocinar
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCardTone(variant: NonNullable<ResultCardProps["variant"]>) {
  if (variant === "primary") {
    return "border-orange-400/35 bg-gradient-to-br from-orange-500/12 via-slate-900/95 to-slate-950 shadow-orange-500/10";
  }

  if (variant === "tip") {
    return "border-orange-400/20 bg-gradient-to-br from-slate-900/95 to-orange-950/20";
  }

  if (variant === "summary") {
    return "border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-950/80";
  }

  return "";
}

export default function ResultCard({
  title,
  content,
  equipment,
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
          title={cleanTitle}
          lineCount={contentLines.length}
          variant={variant}
        />
        <ResultCardContent lines={contentLines} variant={variant} />
        <SetupVisualToggle content={content} equipment={equipment} setup={setup} title={title} />
      </div>
    </Panel>
  );
}
