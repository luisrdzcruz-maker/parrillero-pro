"use client";

import {
  getResultCardAccent,
  getResultCardIcon,
  getResultCardTitle,
} from "@/lib/uiHelpers";
import { Badge, Panel } from "@/components/ui";
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
      </div>
    </Panel>
  );
}
