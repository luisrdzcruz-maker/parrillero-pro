export type LivePhase = "idle" | "active" | "urgent" | "rest" | "complete";

const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 552.9
const DIAL_SIZE = 226;

// Progress arc colors
const RING_COLOR: Record<LivePhase, string> = {
  idle:     "#52525b",
  active:   "#f97316",
  urgent:   "#eab308",
  rest:     "#818cf8",
  complete: "#10b981",
};

// Glow arc colors — same hue, more transparent (blurred in SVG filter)
const RING_GLOW_COLOR: Record<LivePhase, string> = {
  idle:     "transparent",
  active:   "rgba(249,115,22,0.55)",
  urgent:   "rgba(234,179,8,0.50)",
  rest:     "rgba(129,140,248,0.45)",
  complete: "rgba(16,185,129,0.50)",
};

const TIMER_TEXT_COLOR: Record<LivePhase, string> = {
  idle:     "#a1a1aa",
  active:   "#fb923c",
  urgent:   "#facc15",
  rest:     "#a5b4fc",
  complete: "#34d399",
};

const SUB_LABEL: Record<LivePhase, string> = {
  idle:     "Pausado",
  active:   "Quedan",
  urgent:   "¡Atención!",
  rest:     "Reposo",
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

  // No-timer state (manual step)
  if (!hasTimer) {
    return (
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{ width: DIAL_SIZE, height: DIAL_SIZE }}
      >
        {/* Faint ring */}
        <svg
          width={DIAL_SIZE}
          height={DIAL_SIZE}
          viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}
          className="absolute inset-0"
          aria-hidden
        >
          <circle
            cx={DIAL_SIZE / 2}
            cy={DIAL_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="10"
            strokeDasharray="6 8"
          />
        </svg>
        <div className="text-center">
          <p className="font-mono text-5xl font-black leading-none text-white/20">—</p>
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-white/22">
            Manual
          </p>
        </div>
      </div>
    );
  }

  const cx = DIAL_SIZE / 2;
  const cy = DIAL_SIZE / 2;

  return (
    <div
      className={`relative flex items-center justify-center ${phase === "urgent" ? "animate-pulse" : ""}`}
      style={{ width: DIAL_SIZE, height: DIAL_SIZE }}
    >
      <svg
        width={DIAL_SIZE}
        height={DIAL_SIZE}
        viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}
        className="absolute inset-0"
        aria-hidden
      >
        <defs>
          {/* Glow filter for the progress arc */}
          <filter id="arc-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          </filter>
        </defs>

        {/* Background track ring */}
        <circle
          cx={cx}
          cy={cy}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="10"
        />

        {/* Glow arc — wider, blurred, behind progress */}
        {phase !== "idle" && (
          <circle
            cx={cx}
            cy={cy}
            r={RADIUS}
            fill="none"
            stroke={RING_GLOW_COLOR[phase]}
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            filter="url(#arc-glow)"
            style={{
              transform: `rotate(-90deg)`,
              transformOrigin: `${cx}px ${cy}px`,
              transition: "stroke-dashoffset 1s linear, stroke 0.8s ease-in-out",
            }}
          />
        )}

        {/* Progress arc — sharp, on top */}
        <circle
          cx={cx}
          cy={cy}
          r={RADIUS}
          fill="none"
          stroke={RING_COLOR[phase]}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{
            transform: `rotate(-90deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: "stroke-dashoffset 1s linear, stroke 0.8s ease-in-out",
          }}
        />

        {/* Bright leading dot at progress head */}
        {phase !== "idle" && offset < CIRCUMFERENCE - 2 && (
          <circle
            cx={cx}
            cy={cy - RADIUS}
            r="5"
            fill={RING_COLOR[phase]}
            style={{
              transform: `rotate(${-90 + (1 - offset / CIRCUMFERENCE) * 360}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
              filter: `drop-shadow(0 0 4px ${RING_COLOR[phase]})`,
              transition: "transform 1s linear",
            }}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="relative select-none text-center">
        <p
          className="font-mono font-black leading-none tabular-nums"
          style={{
            fontSize: "clamp(52px, 14vw, 62px)",
            color: TIMER_TEXT_COLOR[phase],
            textShadow:
              phase !== "idle"
                ? `0 0 32px ${RING_GLOW_COLOR[phase]}, 0 2px 8px rgba(0,0,0,0.8)`
                : "0 2px 8px rgba(0,0,0,0.6)",
          }}
        >
          {formatTime(remaining)}
        </p>
        <p
          className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.26em]"
          style={{ color: "rgba(255,255,255,0.42)" }}
        >
          {SUB_LABEL[phase]}
        </p>
      </div>
    </div>
  );
}
