"use client";

import { useState, type SyntheticEvent } from "react";
import {
  getResultCardAccent,
  getResultCardIcon,
  getResultCardTitle,
} from "@/lib/uiHelpers";
import { getSetupImage } from "@/lib/setupVisuals";
import { Badge, Button, Panel } from "@/components/ui";
import { ds } from "@/lib/design-system";

type ResultCardProps = {
  title: string;
  content?: string;
};

const cardClassName =
  "group transition-all duration-200 hover:scale-[1.01] hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/10 active:scale-[0.99]";

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
        <div className={ds.media.iconBox}>
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold tracking-wide text-white">
            {title}
          </h3>
          <div className={`mt-2 h-0.5 w-10 rounded-full ${accent}`} />
        </div>
      </div>

      <Badge className="shrink-0 text-[11px] font-medium" tone="glass">
        {lineCount}
      </Badge>
    </div>
  );
}

function ResultCardContent({ lines }: { lines: string[] }) {
  return (
    <div className="mt-5 border-t border-white/5 pt-4">
      <div className="space-y-2 rounded-xl bg-black/10 p-3 text-sm leading-relaxed text-slate-300 ring-1 ring-inset ring-white/[0.03]">
        {lines.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function isSetupCard(title: string) {
  return title.toUpperCase().includes("SETUP");
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
  const setupImage = getSetupImage({ equipment: content, method: content });

  if (!isSetupCard(title) || !setupImage || imageFailed) return null;

  function handleImageError(event: SyntheticEvent<HTMLImageElement>) {
    event.currentTarget.src = "";
    setImageFailed(true);
    setOpen(false);
  }

  return (
    <div className="mt-4">
      <Button
        className="rounded-full px-3 py-2 text-xs"
        onClick={() => setOpen((current) => !current)}
        variant="outlineAccent"
      >
        {open ? "Ocultar setup" : "Ver setup 🔥"}
      </Button>

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
            <div className="relative overflow-hidden rounded-2xl border border-orange-400/20 bg-slate-950 shadow-2xl shadow-black/20">
              <img
                src={setupImage}
                alt="Visual grill setup"
                loading="lazy"
                className="h-44 w-full object-cover sm:h-56"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(251,146,60,0.26),transparent_34%),linear-gradient(to_top,rgba(2,6,23,0.86)_0%,rgba(2,6,23,0.32)_54%,rgba(255,255,255,0.08)_100%)]" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
                  Setup visual
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  Zonas de calor para este plan
                </p>
              </div>
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
