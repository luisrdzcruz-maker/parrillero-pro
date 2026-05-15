export const ds = {
  radius: {
    // Legacy Tailwind-alias scale. Kept untouched in Slice A so existing
    // consumers don't break. Use the semantic names below for new code.
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl",
    // Slice A — semantic radius scale derived from hybrid-premium-canvas
    // (see docs/audits/slice-a-locked-values.md). Single `card` token; no
    // `hero` distinction until the canvas demonstrates one.
    pill: "rounded-full",
    chip: "rounded-xl",
    row: "rounded-[0.875rem]",
    card: "rounded-3xl",
  },

  spacing: {
    section: "p-6",
    block: "p-4",
    panel: "p-5",
    gap: "gap-4",
    gridGap: "gap-5",
  },

  layout: {
    pageSection: "space-y-5",
    splitGrid: "grid gap-5 md:grid-cols-[380px_1fr]",
    homeGrid: "grid gap-4 md:grid-cols-5",
    cardGrid: "grid gap-4 md:grid-cols-2",
    resultGrid: "mx-auto grid max-w-5xl gap-4 md:grid-cols-2 md:gap-5",
    resultContainer: "mx-auto max-w-5xl space-y-5",
    navGrid: "mx-auto grid max-w-4xl grid-cols-6 gap-2",
  },

  text: {
    eyebrow: "text-xs font-semibold uppercase tracking-[0.2em] text-orange-300",
    title: "text-xl font-semibold tracking-tight text-white",
    heroTitle: "text-3xl font-black tracking-tight text-white md:text-5xl",
    subtitle: "text-sm leading-6 text-slate-300 md:text-base",
    body: "text-sm leading-relaxed text-slate-200",
    muted: "text-sm text-slate-400",
    metricEyebrow: "text-[9px] font-black uppercase tracking-[0.16em] sm:text-[10px]",
    metricLarge:
      "font-black tracking-[-0.04em] text-white text-[clamp(1.55rem,7vw,2rem)] leading-none sm:text-3xl",
    metricCompact:
      "font-black tracking-[-0.04em] text-white truncate text-[clamp(0.95rem,3.6vw,1.2rem)] leading-tight",
    // ──────────────────────────────────────────────────────────────────
    // Slice A — semantic text tiers (see docs/audits/slice-a-locked-values.md).
    // The existing `eyebrow` token stays at tracking-[0.2em] to avoid visual
    // diff; tracking change to 0.08em is deferred to a future polish slice.
    // ──────────────────────────────────────────────────────────────────
    eyebrowEmber: "text-xs font-semibold uppercase tracking-[0.2em] text-[#E36A1A]",
    eyebrowMuted: "text-xs font-semibold uppercase tracking-[0.2em] text-white/55",
    body14: "text-[14px] leading-[1.45]",
    body13: "text-[13px] leading-[1.4]",
    body12: "text-[12px] leading-[1.4]",
    body11: "text-[11px] leading-[1.4]",
    body10: "text-[10px] leading-[1.35]",
    body9: "text-[9px] leading-[1.35]",
    body8: "text-[8px] leading-[1.35]",
    helper: "text-[11px] leading-[1.35] text-white/50",
  },

  colors: {
    primary: "bg-orange-500 text-black",
    primaryHover: "hover:bg-orange-400",
    secondary: "border border-white/10 bg-white/5 text-slate-200",
    danger: "border border-red-500/40 bg-red-500/10 text-red-200",
    success: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  },

  effects: {
    glass: "border border-white/10 bg-white/5 backdrop-blur",
    glow: "shadow-lg shadow-orange-500/20",
    panelShadow: "shadow-2xl shadow-black/20",
    innerRing: "ring-1 ring-inset ring-white/[0.03]",
    press: "transition active:scale-[0.98]",
  },

  shell: {
    page: "min-h-screen overflow-x-hidden bg-[radial-gradient(ellipse_at_50%_-6%,rgba(249,115,22,0.32),transparent_46%),radial-gradient(ellipse_at_18%_4%,rgba(234,88,12,0.18),transparent_38%),radial-gradient(ellipse_at_84%_10%,rgba(120,53,15,0.16),transparent_34%),linear-gradient(180deg,#0a0604_0%,#0b0907_30%,#050302_70%,#030201_100%)] px-4 pb-28 pt-5 text-white",
    container: "relative z-10 mx-auto max-w-6xl",
  },

  panel: {
    form: "space-y-4 rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-white/[0.06] backdrop-blur-xl",
    card: "rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.035] shadow-[0_18px_40px_rgba(0,0,0,0.35)] ring-1 ring-inset ring-white/[0.06] backdrop-blur",
    result:
      "relative overflow-hidden rounded-[1.65rem] border border-white/[0.08] bg-white/[0.045] shadow-[0_18px_40px_rgba(0,0,0,0.38)] ring-1 ring-inset ring-white/[0.06] backdrop-blur-xl",
    homeCard:
      "group rounded-[1.65rem] border border-white/[0.08] bg-white/[0.045] p-6 text-left shadow-[0_18px_42px_rgba(0,0,0,0.4)] ring-1 ring-inset ring-white/[0.06] backdrop-blur-xl transition hover:-translate-y-1 hover:border-orange-300/40 hover:bg-white/[0.06] hover:shadow-[0_20px_46px_rgba(249,115,22,0.18)] active:scale-[0.99]",
    hero: "relative overflow-hidden rounded-[1.85rem] border border-white/[0.1] bg-[linear-gradient(160deg,rgba(255,255,255,0.085)_0%,rgba(255,255,255,0.045)_30%,rgba(0,0,0,0.0)_60%,rgba(0,0,0,0.22)_100%)] shadow-[0_36px_72px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-white/[0.08] backdrop-blur-xl",
    highlight: "rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4",
    empty:
      "rounded-[1.65rem] border border-white/[0.08] bg-white/[0.03] p-6 text-slate-400 shadow-[0_14px_36px_rgba(0,0,0,0.32)] ring-1 ring-inset ring-white/[0.04] backdrop-blur",
    glass:
      "rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/30 backdrop-blur",
    timer: "mt-6 rounded-3xl bg-slate-950 p-8 text-center",
    row:
      "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-orange-500/40 hover:bg-orange-500/[0.06]",
    rowSelected:
      "border-orange-500/40 bg-orange-500/[0.08] shadow-[0_8px_24px_rgba(249,115,22,0.12)]",
    metric:
      "min-w-0 rounded-[1.15rem] border px-3 py-2.5 shadow-lg shadow-black/10 ring-1 ring-inset",
  },

  metricTone: {
    orange: "border-orange-300/25 bg-orange-500/[0.09] text-orange-50 ring-orange-200/[0.05]",
    red: "border-red-300/25 bg-red-500/[0.08] text-red-50 ring-red-200/[0.04]",
    sky: "border-sky-300/20 bg-sky-500/[0.07] text-sky-50 ring-sky-200/[0.04]",
  },

  disclosure: {
    summary:
      "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-white/[0.04]",
    chip:
      "inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-orange-300/40 hover:bg-orange-500/10 hover:text-orange-100",
    body: "mt-2 space-y-2 text-[13px] leading-relaxed text-slate-200",
  },

  liveBg: {
    direct:
      "radial-gradient(ellipse at 50% -4%, rgba(249,115,22,0.34), transparent 52%), radial-gradient(ellipse at 50% 100%, rgba(234,88,12,0.16), transparent 48%), linear-gradient(180deg, #0a0503, #050302 60%, #030201)",
    indirect:
      "radial-gradient(ellipse at 50% -4%, rgba(56,189,248,0.28), transparent 52%), radial-gradient(ellipse at 50% 100%, rgba(14,165,233,0.12), transparent 48%), linear-gradient(180deg, #050a0d, #030608 60%, #020405)",
    rest:
      "radial-gradient(ellipse at 50% -4%, rgba(250,204,21,0.26), transparent 52%), radial-gradient(ellipse at 50% 100%, rgba(245,158,11,0.12), transparent 48%), linear-gradient(180deg, #0d0904, #060402 60%, #030201)",
    urgent:
      "radial-gradient(ellipse at 50% -4%, rgba(250,204,21,0.36), transparent 52%), radial-gradient(ellipse at 50% 100%, rgba(245,158,11,0.18), transparent 48%), linear-gradient(180deg, #100a04, #070502 60%, #030201)",
    complete:
      "radial-gradient(ellipse at 50% -4%, rgba(16,185,129,0.30), transparent 52%), radial-gradient(ellipse at 50% 100%, rgba(5,150,105,0.14), transparent 48%), linear-gradient(180deg, #03080a, #020404 60%, #020303)",
  },

  button: {
    base: "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
    primary:
      "w-full rounded-2xl bg-orange-500 px-5 py-4 font-bold text-black shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
    primaryCompact: "bg-orange-500 text-black shadow-lg shadow-orange-500/20 hover:bg-orange-400",
    secondary:
      "rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-medium text-slate-200 transition hover:border-orange-500/40 hover:bg-white/10 active:scale-[0.98]",
    secondaryCompact:
      "border border-white/10 bg-white/5 text-slate-200 hover:border-orange-500/40 hover:bg-white/10",
    danger:
      "rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 font-medium text-red-200 transition hover:bg-red-500/15 active:scale-[0.98]",
    dangerCompact: "border border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/15",
    dangerSolidCompact: "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-400",
    ghost: "text-slate-300 hover:bg-white/5 hover:text-white",
    outlineAccent:
      "w-full rounded-2xl border border-orange-500/50 bg-orange-500/10 px-5 py-4 font-bold text-orange-200 transition hover:bg-orange-500/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
    outlineAccentCompact:
      "border border-orange-500/50 bg-orange-500/10 text-orange-200 hover:bg-orange-500/15",
    tabActive:
      "rounded-2xl bg-orange-500 px-2 py-2 text-xs font-bold text-black shadow-lg shadow-orange-500/20 transition active:scale-[0.98]",
    tabIdle:
      "rounded-2xl px-2 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-slate-200 active:scale-[0.98]",
  },

  input: {
    label: "text-sm font-medium text-slate-400",
    field:
      "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 p-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10",
    compactSelect:
      "rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 shadow-inner shadow-black/20 outline-none transition focus:border-orange-500/50",
  },

  media: {
    iconTile:
      "flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl transition group-hover:border-orange-500/30 group-hover:bg-orange-500/10",
    iconBox:
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-base shadow-sm shadow-black/10",
    progressTrack: "mt-6 h-3 overflow-hidden rounded-full bg-slate-800",
    progressBar: "h-full rounded-full bg-orange-500 transition-[width] duration-1000 ease-linear",
  },

  badge: {
    base: "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
    accent: "border border-orange-500/20 bg-orange-500/10 text-orange-300",
    solidAccent: "bg-orange-500 text-white",
    glass: "border border-white/10 bg-black/55 text-white backdrop-blur",
    selected: "bg-white text-slate-950",
    success: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    danger: "border border-red-500/30 bg-red-500/10 text-red-200",
  },

  notice: {
    info: "rounded-2xl border border-sky-400/25 bg-sky-500/[0.07] p-3 text-xs text-sky-200 ring-1 ring-inset ring-sky-300/[0.06]",
    success:
      "rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200 shadow-lg shadow-black/10",
    error:
      "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200 shadow-lg shadow-black/10",
  },

  nav: {
    bottom:
      "fixed bottom-0 left-0 right-0 border-t border-white/[0.08] bg-[#050302]/[0.82] shadow-[0_-10px_28px_rgba(0,0,0,0.32)] backdrop-blur-2xl",
    switcher:
      "fixed bottom-24 left-4 z-50 flex gap-1 rounded-full border border-white/10 bg-black/60 p-1.5 text-xs shadow-2xl shadow-black/30 backdrop-blur",
    switcherLink:
      "rounded-full px-3 py-1.5 font-semibold text-slate-300 transition hover:bg-white/10 hover:text-orange-300",
  },

  // ══════════════════════════════════════════════════════════════════════
  // Slice A — additive token groups locked against the Hybrid Premium
  // canvas (see docs/audits/slice-a-locked-values.md). All new; no
  // existing ds.* surface modified. Lint rule
  // (scripts/lint-tokens.mjs) blocks new uses of arbitrary Tailwind
  // values outside this file.
  // ══════════════════════════════════════════════════════════════════════

  // Single canonical ember. `ds.colors.primary` (Tailwind bg-orange-500)
  // is visibly more saturated than the canvas; future code uses these.
  ember: {
    DEFAULT: "#E36A1A",
    hover: "#D55E14",
    border: "#E36A1A",
    faint: "rgba(227, 106, 26, 0.12)",
  },

  // Note: distinct from `ds.colors` above. `ds.colors.*` are Tailwind class
  // strings (e.g. "bg-orange-500 text-black"); `ds.color.*` are raw values
  // for inline-style / CSS-variable consumption.
  color: {
    muted: {
      strong: "rgba(255, 255, 255, 0.90)",
      base: "rgba(255, 255, 255, 0.70)",
      helper: "rgba(255, 255, 255, 0.50)",
    },
  },

  // Tailwind class strings (consistent with the rest of ds.*). Arbitrary
  // `shadow-[...]` values live inside this file only; the lint rule exempts
  // lib/design-system.ts.
  shadow: {
    cardBase: "shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]",
    cardLifted: "shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
    emberGlowSm: "shadow-[0_4px_18px_rgba(227,106,26,0.25)]",
    emberGlowMd: "shadow-[0_12px_32px_rgba(227,106,26,0.20)]",
  },

  // Tailwind class strings using nearest preset durations where possible.
  // 200/300 are exact presets approximating proposal's 180/280 ms.
  // 600ms has no Tailwind preset; arbitrary value used (exempted in lib/).
  motion: {
    enter: "duration-200 ease-out",
    emphasis: "duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
    pulse: "duration-[600ms] ease-in-out",
  },
} as const;

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
