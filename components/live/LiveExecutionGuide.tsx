import type { LiveCookingStepState, LiveZone, UrgencyLevel } from "@/hooks/useLiveCooking";
import { getLiveText, type SurfaceLang } from "@/lib/i18n/surfaceFallbacks";

type ActionKind = "preheat" | "sear" | "flip" | "move" | "rest" | "serve" | "manual";

type Props = {
  currentStep: LiveCookingStepState;
  lang: SurfaceLang;
  urgency: UrgencyLevel;
};

const ACTION_TONE: Record<ActionKind, string> = {
  preheat: "border-orange-300/35 bg-orange-500/12 text-orange-100",
  sear: "border-red-300/45 bg-red-500/14 text-red-100",
  flip: "border-yellow-300/50 bg-yellow-400/14 text-yellow-100",
  move: "border-orange-300/40 bg-orange-400/12 text-orange-100",
  rest: "border-blue-300/45 bg-blue-400/14 text-blue-100",
  serve: "border-emerald-300/45 bg-emerald-400/14 text-emerald-100",
  manual: "border-white/12 bg-white/[0.055] text-white/82",
};

const GUIDE_TONE: Record<UrgencyLevel, string> = {
  normal: "border-white/[0.07] bg-white/[0.032]",
  attention: "border-orange-300/34 bg-orange-500/[0.065]",
  critical: "border-yellow-300/55 bg-yellow-400/[0.09] shadow-[0_0_34px_rgba(250,204,21,0.16)]",
};

const ZONE_TONE: Record<LiveZone, string> = {
  direct: "border-red-300/40 bg-red-500/12 text-red-100",
  indirect: "border-orange-300/38 bg-orange-400/12 text-orange-100",
  rest: "border-blue-300/40 bg-blue-400/12 text-blue-100",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function includesAny(value: string, terms: string[]) {
  const normalized = normalize(value);
  return terms.some((term) => normalized.includes(term));
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes === 0) return `${secs}s`;
  if (secs === 0) return `${minutes}m`;
  return `${minutes}m ${secs}s`;
}

function resolveCurrentActionKind(currentStep: LiveCookingStepState): ActionKind {
  const text = `${currentStep.name} ${currentStep.instructions}`;

  if (currentStep.zone === "rest" || includesAny(text, ["rest", "repos", "lepuut"])) return "rest";
  if (includesAny(text, ["serve", "servir", "slice", "cortar", "grain", "fibra"])) return "serve";
  if (includesAny(text, ["flip", "turn", "side 2", "lado 2", "voltea", "dar vuelta", "kaanna"])) {
    return "flip";
  }
  if (includesAny(text, ["move", "shift", "mover", "mueve", "siirra"])) return "move";
  if (includesAny(text, ["preheat", "precalienta", "esilamita"])) return "preheat";
  if (includesAny(text, ["sear", "sell", "dorar", "crust", "mark", "ruskista"])) return "sear";
  return currentStep.duration > 0 ? "sear" : "manual";
}

function getZoneLabel(zone: LiveZone, lang: SurfaceLang) {
  const text = getLiveText(lang);
  if (zone === "direct") return text.zoneDirect;
  if (zone === "indirect") return text.zoneIndirect;
  return text.zoneRest;
}

function getActionLabel(kind: ActionKind, lang: SurfaceLang) {
  const text = getLiveText(lang);
  const labels: Record<ActionKind, string> = {
    preheat: text.actionPreheat,
    sear: text.actionSear,
    flip: text.actionFlip,
    move: text.actionMove,
    rest: text.actionRest,
    serve: text.actionServe,
    manual: text.actionManual,
  };
  return labels[kind];
}

function getActionHint(kind: ActionKind, lang: SurfaceLang) {
  const text = getLiveText(lang);
  const hints: Record<ActionKind, string> = {
    preheat: text.actionHintPreheat,
    sear: text.actionHintSear,
    flip: text.actionHintFlip,
    move: text.actionHintMove,
    rest: text.actionHintRest,
    serve: text.actionHintServe,
    manual: text.actionHintManual,
  };
  return hints[kind];
}

function ActionGlyph({ kind }: { kind: ActionKind }) {
  if (kind === "flip") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path d="M7 8.5h8.5a3.5 3.5 0 0 1 0 7H9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M9.5 5.5 6.5 8.5l3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.5 12.5 17.5 15.5l-3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "move") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path d="M4 12h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="m14 7 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 17h4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "rest") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path d="M6 14.5h12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M8 10c1.3-1.4 2.7-1.4 4 0s2.7 1.4 4 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 18h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      </svg>
    );
  }

  if (kind === "serve") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path d="M5 17 18 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M9 18h9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M6.5 13.5 10.5 17.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "preheat") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path d="M7 18h10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M9 14c-1.2-2.3.9-3.6 1.6-5.4.3 1.5 1.8 2.2 2.5 3.2.7 1 .8 2.1.2 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 14c.8-1 .5-2.2-.2-3.2 1.7.8 3.4 2.7 1.9 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path d="M6 16.5h12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8 13c.8-2.2 2.4-3.8 4-6 1.6 2.2 3.2 3.8 4 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 19h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export default function LiveExecutionGuide({
  currentStep,
  lang,
  urgency,
}: Props) {
  const text = getLiveText(lang);
  const actionKind = resolveCurrentActionKind(currentStep);
  const remainingLabel = currentStep.duration > 0
    ? formatDuration(currentStep.remainingTime)
    : text.noTimer;
  const durationLabel = currentStep.duration > 0 ? formatDuration(currentStep.duration) : text.manualStep;

  return (
    <section className={`rounded-[1.25rem] border px-3.5 py-3 ${GUIDE_TONE[urgency]}`}>
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${ACTION_TONE[actionKind]}`}
        >
          <ActionGlyph kind={actionKind} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/32">
            {text.actionGuide}
          </p>
          <p className="mt-0.5 truncate text-[15px] font-black leading-tight text-white/88">
            {getActionLabel(actionKind, lang)}
          </p>
          <p className="mt-1 overflow-hidden text-[11px] font-semibold leading-snug text-white/48 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {getActionHint(actionKind, lang)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <div className={`min-w-0 rounded-xl border px-2.5 py-2 ${ZONE_TONE[currentStep.zone]}`}>
          <p className="text-[8px] font-black uppercase tracking-[0.16em] opacity-55">{text.zoneLabel}</p>
          <p className="mt-0.5 truncate text-[11px] font-black">{getZoneLabel(currentStep.zone, lang)}</p>
        </div>

        <div className="min-w-0 rounded-xl border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 text-white/78">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/34">{text.remainingShort}</p>
          <p className="mt-0.5 truncate text-[11px] font-black tabular-nums">{remainingLabel}</p>
        </div>

        <div className="min-w-0 rounded-xl border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 text-white/78">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/34">
            {currentStep.tempTarget !== null ? text.targetShort : text.durationShort}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-black tabular-nums">
            {currentStep.tempTarget !== null ? `${currentStep.tempTarget}°C` : durationLabel}
          </p>
        </div>
      </div>
    </section>
  );
}
