"use client";

import { useState, type SyntheticEvent } from "react";
import {
  getResultCardAccent,
  getResultCardIcon,
  getResultCardTitle,
} from "@/lib/uiHelpers";
import { getSetupImage, SETUP_PLACEHOLDER_IMAGE } from "@/lib/setupVisuals";
import { Badge, Button, Panel } from "@/components/ui";
import { ds } from "@/lib/design-system";

type ResultCardProps = {
  title: string;
  content?: string;
};

const cardClassName =
  "group transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/10 active:scale-[0.99]";

function ResultCardHeader({
  accent,
  icon,
  title,
  lineCount,
}: {
  accent: string;
  icon: string;
  title: string;
  lineCount: number;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className={`${ds.media.iconBox} h-11 w-11 rounded-2xl bg-white/[0.06] text-lg ring-1 ring-inset ring-white/[0.04]`}>
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300/90">
            Plan block
          </p>
          <h3 className="mt-1 truncate text-base font-black tracking-tight text-white">
            {title}
          </h3>
          <div className={`mt-2 h-0.5 w-12 rounded-full ${accent}`} />
        </div>
      </div>

      <Badge className="shrink-0 border-white/10 bg-black/35 text-[11px] font-bold" tone="glass">
        {lineCount} {lineCount === 1 ? "línea" : "líneas"}
      </Badge>
    </div>
  );
}

function ResultCardContent({ lines }: { lines: string[] }) {
  return (
    <div className="mt-5 border-t border-white/5 pt-4">
      <div className="space-y-2.5 rounded-2xl border border-white/[0.06] bg-black/15 p-3.5 text-sm leading-relaxed text-slate-300 shadow-inner shadow-black/10 ring-1 ring-inset ring-white/[0.03]">
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
  return normalizedTitle.includes("SETUP") || normalizedTitle.includes("CONFIGURACION") || normalizedTitle.includes("CONFIGURACIÓN");
}

function SetupVisualToggle({
  content,
  title,
}: {
  content: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const setupImage = getSetupImage({ equipment: content, heatType: content, method: content });

  if (!isSetupCard(title)) return null;

  function handleImageError(event: SyntheticEvent<HTMLImageElement>) {
    event.currentTarget.src = SETUP_PLACEHOLDER_IMAGE;
    setImageFailed(true);
  }

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
              {!imageFailed && (
                <img
                  src={setupImage}
                  alt="Visual grill setup"
                  loading="lazy"
                  className="h-44 w-full object-cover sm:h-56"
                  onError={handleImageError}
                />
              )}

              {imageFailed && (
                <div className="flex h-44 w-full items-center justify-center border border-dashed border-orange-400/30 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.18),transparent_48%)] p-5 text-center sm:h-56">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
                      Imagen pendiente
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      Setup visual listo para conectar asset WebP
                    </p>
                    <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-slate-400">
                      El plan sigue funcionando con la guía textual mientras se añade la imagen final.
                    </p>
                  </div>
                </div>
              )}

              {!imageFailed && (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(251,146,60,0.28),transparent_34%),linear-gradient(to_top,rgba(2,6,23,0.9)_0%,rgba(2,6,23,0.38)_54%,rgba(255,255,255,0.08)_100%)]" />
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4">
                    <Badge className="border-orange-400/30 bg-black/45 text-orange-200" tone="glass">
                      Setup del fuego
                    </Badge>
                    <p className="mt-2 text-sm font-semibold text-white">
                      Visualiza zonas antes de cocinar
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultCard({ title, content }: ResultCardProps) {
  if (!content?.trim()) return null;

  const icon = getResultCardIcon(title);
  const cleanTitle = getResultCardTitle(title);
  const accent = getResultCardAccent(title);
  const contentLines = content.split("\n").map((line) => line.trim()).filter(Boolean);

  return (
    <Panel as="article" className={cardClassName} tone="result">
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
        />
        <ResultCardContent lines={contentLines} />
        <SetupVisualToggle content={content} title={title} />
      </div>
    </Panel>
  );
}
