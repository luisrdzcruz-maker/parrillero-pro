export const ds = {
  radius: {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl",
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
    page: "min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_18%_0%,rgba(249,115,22,0.13),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(120,53,15,0.10),transparent_30%),linear-gradient(180deg,#050301_0%,#090807_42%,#030201_100%)] px-4 pb-28 pt-5 text-white",
    container: "relative z-10 mx-auto max-w-6xl",
  },

  panel: {
    form: "space-y-4 rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 ring-1 ring-inset ring-white/[0.035] backdrop-blur-xl",
    card: "rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.035] shadow-lg shadow-black/20 ring-1 ring-inset ring-white/[0.035] backdrop-blur",
    result:
      "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-900/65 shadow-lg shadow-black/20 ring-1 ring-inset ring-white/[0.03]",
    homeCard:
      "group rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-900/60 p-6 text-left shadow-lg shadow-black/15 ring-1 ring-inset ring-white/[0.03] transition hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-orange-500/10 active:scale-[0.99]",
    hero: "overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950/95 shadow-2xl shadow-black/25 ring-1 ring-inset ring-white/[0.03]",
    highlight: "rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4",
    empty:
      "rounded-3xl border border-white/10 bg-slate-900/75 p-6 text-slate-400 shadow-xl shadow-black/10",
    glass:
      "rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur",
    timer: "mt-6 rounded-3xl bg-slate-950 p-8 text-center",
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
    info: "rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-200 ring-1 ring-inset ring-blue-400/5",
    success:
      "rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200 shadow-lg shadow-black/10",
    error:
      "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200 shadow-lg shadow-black/10",
  },

  nav: {
    bottom:
      "fixed bottom-0 left-0 right-0 border-t border-white/10 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl",
    switcher:
      "fixed bottom-24 left-4 z-50 flex gap-1 rounded-full border border-white/10 bg-black/60 p-1.5 text-xs shadow-2xl shadow-black/30 backdrop-blur",
    switcherLink:
      "rounded-full px-3 py-1.5 font-semibold text-slate-300 transition hover:bg-white/10 hover:text-orange-300",
  },
} as const;

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
