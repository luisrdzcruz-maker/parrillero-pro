export type LivePhase = "idle" | "active" | "urgent" | "rest" | "complete";

const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 552.9

const RING_COLOR: Record<LivePhase, string> = {
  idle: "#71717a",
  active: "#f97316",
  urgent: "#eab308",
  rest: "#818cf8",
  complete: "#10b981",
};

const TIMER_TEXT: Record<LivePhase, string> = {
  idle: "text-zinc-300",
  active: "text-orange-300",
  urgent: "text-yellow-300",
  rest: "text-indigo-300",
  complete: "text-emerald-300",
};

const SUB_LABEL: Record<LivePhase, string> = {
  idle: "Pausado",
  active: "Quedan",
  urgent: "¡Atención!",
  rest: "Reposo",
  complete: "¡Listo!",
};

function formatTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

type Props = {
  total: number;
  remaining: number;
  phase: LivePhase;
};

export default function TimerDial({ total, remaining, phase }: Props) {
  const hasTimer = total > 0;
  const offset = hasTimer
    ? CIRCUMFERENCE * Math.max(0, Math.min(1, remaining / total))
    : CIRCUMFERENCE;

  if (!hasTimer) {
    return (
      <div className="flex h-[200px] w-[200px] items-center justify-center rounded-full border border-white/10 bg-white/[0.02]">
        <div className="text-center">
          <p className="text-4xl font-black text-white/20">—</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/20">
            Manual
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[200px] w-[200px] items-center justify-center">
      {/* SVG ring */}
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        className="absolute inset-0"
        aria-hidden
      >
        {/* Faint background arc */}
        <circle
          cx="100"
          cy="100"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="8"
        />
        {/* Progress arc — clockwise from top */}
        <circle
          cx="100"
          cy="100"
          r={RADIUS}
          fill="none"
          stroke={RING_COLOR[phase]}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "100px 100px",
            transition: "stroke-dashoffset 1s linear, stroke 0.8s ease-in-out",
          }}
        />
      </svg>

      {/* Center content */}
      <div className={`select-none text-center ${phase === "urgent" ? "animate-pulse" : ""}`}>
        <p
          className={`font-mono text-[56px] font-black leading-none tabular-nums ${TIMER_TEXT[phase]}`}
        >
          {formatTime(remaining)}
        </p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/28">
          {SUB_LABEL[phase]}
        </p>
      </div>
    </div>
  );
}
