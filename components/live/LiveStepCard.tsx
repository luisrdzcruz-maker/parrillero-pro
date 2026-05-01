import type { LiveCookingStepState, LiveZone, UrgencyLevel } from "@/hooks/useLiveCooking";

const URGENCY_STYLES: Record<UrgencyLevel, string> = {
  normal: "border-white/[0.08] bg-white/[0.035]",
  attention: "border-orange-300/45 bg-orange-500/[0.07]",
  critical: "border-yellow-300/60 bg-yellow-400/[0.08] shadow-[0_0_46px_rgba(250,204,21,0.22)]",
};

const ZONE_RAIL_ITEMS: { key: LiveZone; label: string }[] = [
  { key: "direct", label: "Direct" },
  { key: "indirect", label: "Indirect" },
  { key: "rest", label: "Rest" },
];

const ZONE_RAIL_ACTIVE: Record<LiveZone, string> = {
  direct: "border-red-300/60 bg-red-500/20 text-red-100 shadow-[0_0_18px_rgba(248,113,113,0.18)]",
  indirect: "border-orange-300/45 bg-orange-400/15 text-orange-100",
  rest: "border-blue-300/45 bg-blue-400/15 text-blue-100",
};

const ZONE_DOT_ACTIVE: Record<LiveZone, string> = {
  direct: "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]",
  indirect: "bg-orange-400",
  rest: "bg-blue-400",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getMistakeHint(
  name: string,
  instructions: string,
  zone: LiveZone,
): string | null {
  const text = normalize(`${name} ${instructions}`);

  if (text.includes("sear") || text.includes("crust") || text.includes("brown") || text.includes("mark")) {
    return "Do not move the meat until a crust forms";
  }
  if (text.includes("flip") || text.includes("turn") || text.includes("side 2") || text.includes("lado 2")) {
    return "Flip once — do not press down";
  }
  if (zone === "rest") {
    return "Do not cut yet — let the juices redistribute";
  }
  if (zone === "indirect" || text.includes("indirect")) {
    return "Keep the lid closed to hold temperature";
  }
  if (zone === "direct") {
    return "Do not press the meat — it squeezes out the juices";
  }
  return null;
}

type Props = {
  currentStep: LiveCookingStepState;
  feedback: string | null;
  reduceMotion?: boolean;
  transitionState?: "idle" | "exit" | "enter";
  urgency: UrgencyLevel;
};

export default function LiveStepCard({
  currentStep,
  feedback,
  reduceMotion = false,
  transitionState = "idle",
  urgency,
}: Props) {
  const transitionClass = reduceMotion
    ? ""
    : transitionState === "exit"
      ? "opacity-0 translate-y-2"
      : transitionState === "enter"
        ? "opacity-0 -translate-y-2"
        : "opacity-100 translate-y-0";

  const mistakeHint = getMistakeHint(
    currentStep.name,
    currentStep.instructions,
    currentStep.zone,
  );

  return (
    <div className="space-y-2">
      {feedback && (
        <div
          className={`rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-2 text-center text-xs font-black text-emerald-200 shadow-[0_10px_34px_rgba(16,185,129,0.12)] ${reduceMotion ? "" : "animate-live-enter"}`}
        >
          {feedback}
        </div>
      )}

      <section
        className={`rounded-[1.35rem] border p-4 transition-all duration-200 ease-out ${URGENCY_STYLES[urgency]} ${transitionClass}`}
      >
        {/* Zone rail — 3 heat zones, current highlighted */}
        <div className="flex items-center gap-1.5">
          {ZONE_RAIL_ITEMS.map(({ key, label }) => {
            const isActive = currentStep.zone === key;
            return (
              <span
                key={key}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] transition-all duration-300 ${
                  isActive
                    ? ZONE_RAIL_ACTIVE[key]
                    : "border-white/[0.07] bg-transparent text-white/22"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? ZONE_DOT_ACTIVE[key]
                      : "bg-white/15"
                  }`}
                />
                {label}
              </span>
            );
          })}

          {currentStep.tempTarget !== null && (
            <span className="ml-auto rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-black text-white/65">
              {currentStep.tempTarget}°C
            </span>
          )}
        </div>

        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/32">
          Current step
        </p>
        <h1 className="mt-1.5 overflow-hidden text-[clamp(1.75rem,8vw,2.85rem)] font-black leading-[0.98] tracking-[-0.055em] text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {currentStep.name}
        </h1>
        <p className="mt-2.5 overflow-hidden whitespace-pre-line text-[clamp(0.92rem,3.6vw,1rem)] font-semibold leading-snug text-white/72 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
          {currentStep.instructions}
        </p>

        {mistakeHint && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-yellow-300/[0.14] bg-yellow-400/[0.05] px-3 py-2">
            <span className="mt-px shrink-0 text-[11px] leading-none text-yellow-300/70">⚠</span>
            <p className="text-[11px] font-semibold leading-snug text-yellow-200/65">
              {mistakeHint}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
