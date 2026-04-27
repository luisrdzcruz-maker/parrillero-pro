import { Badge } from "@/components/ui";
import { ds } from "@/lib/design-system";
import type { AppText, Lang } from "@/lib/i18n/texts";

export type Mode =
  | "inicio"
  | "coccion"
  | "plan"
  | "menu"
  | "parrillada"
  | "cocina"
  | "guardados";

export function AppHeader({
  lang,
  onLangChange,
  t,
}: {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  t: AppText;
}) {
  return (
    <header className="mb-1.5 flex items-center justify-between gap-2 border-b border-white/10 pb-2 pt-0.5 sm:mb-3 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-slate-950/50 sm:px-3 sm:py-2 sm:shadow-lg sm:shadow-black/10 sm:backdrop-blur md:rounded-3xl md:px-4 md:py-2.5">
      <div className="min-w-0">
        <Badge className="px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] sm:px-2.5 sm:py-0.5 sm:text-[10px] sm:tracking-[0.16em] md:text-xs md:tracking-[0.2em]">
          {t.app}
        </Badge>
        <p className="mt-1 hidden text-xs leading-snug text-slate-400 sm:block md:text-sm">
          {t.subtitle}
        </p>
      </div>

      <div className="shrink-0">
        <select
          value={lang}
          onChange={(event) => onLangChange(event.target.value as Lang)}
          className={`${ds.input.compactSelect} max-w-[100px] rounded-lg px-1.5 py-1 text-[10px] sm:max-w-none sm:rounded-xl sm:px-2.5 sm:py-1.5 sm:text-xs md:rounded-2xl md:px-3 md:py-2 md:text-sm`}
        >
          <option value="es">🇪🇸 Español</option>
          <option value="en">🇬🇧 English</option>
          <option value="fi">🇫🇮 Suomi</option>
        </select>
      </div>
    </header>
  );
}

export function DesktopModeTabs({
  mode,
  onModeChange,
  t,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  t: AppText;
}) {
  return (
    <nav className="mb-6 hidden rounded-3xl border border-white/10 bg-white/[0.03] p-2 shadow-lg shadow-black/10 backdrop-blur md:block">
      <div className="grid grid-cols-5 gap-2">
        <DesktopTab
          active={mode === "inicio"}
          label={t.start}
          emoji="🏠"
          onClick={() => onModeChange("inicio")}
        />
        <DesktopTab
          active={mode === "coccion"}
          label="Cocina"
          emoji="🥩"
          onClick={() => onModeChange("coccion")}
        />
        <DesktopTab
          active={mode === "plan" || mode === "menu" || mode === "parrillada"}
          label="Plan"
          emoji="🧭"
          onClick={() => onModeChange("plan")}
        />
        <DesktopTab
          active={mode === "cocina"}
          label={t.live}
          emoji="⏱️"
          onClick={() => onModeChange("cocina")}
        />
        <DesktopTab
          active={mode === "guardados"}
          label={t.saved}
          emoji="⭐"
          onClick={() => onModeChange("guardados")}
        />
      </div>
    </nav>
  );
}

function DesktopTab({
  active,
  emoji,
  label,
  onClick,
}: {
  active: boolean;
  emoji: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "rounded-2xl bg-orange-500 px-3 py-2.5 text-sm font-bold text-black shadow-lg shadow-orange-500/25 transition-all duration-200 active:scale-[0.98]"
          : "rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/5 hover:text-slate-100 active:scale-[0.98]"
      }
    >
      <span className="mr-2">{emoji}</span>
      {label}
    </button>
  );
}

export function BottomNavigation({
  mode,
  onModeChange,
  t,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  t: AppText;
}) {
  return (
    <nav
      className={`${ds.nav.bottom} z-50 min-h-[72px] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:hidden`}
    >
      <div className={`${ds.layout.navGrid} gap-1.5 rounded-[1.6rem] border border-white/10 bg-slate-950/90 p-1.5 shadow-2xl shadow-black/50`}>
        <Tab
          active={mode === "inicio"}
          label={t.start}
          emoji="🏠"
          onClick={() => onModeChange("inicio")}
        />
        <Tab
          active={mode === "coccion"}
          label="Cocina"
          emoji="🥩"
          onClick={() => onModeChange("coccion")}
        />
        <Tab
          active={mode === "plan" || mode === "menu" || mode === "parrillada"}
          label="Plan"
          emoji="🧭"
          onClick={() => onModeChange("plan")}
        />
        <Tab
          active={mode === "cocina"}
          label={t.live}
          emoji="⏱️"
          onClick={() => onModeChange("cocina")}
        />
        <Tab
          active={mode === "guardados"}
          label={t.saved}
          emoji="⭐"
          onClick={() => onModeChange("guardados")}
        />
      </div>
    </nav>
  );
}

function Tab({
  active,
  label,
  emoji,
  onClick,
}: {
  active: boolean;
  label: string;
  emoji: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "min-h-[54px] touch-manipulation rounded-2xl bg-gradient-to-br from-orange-300 via-orange-500 to-orange-600 px-1.5 py-1.5 text-[10px] font-black leading-tight text-black shadow-lg shadow-orange-500/45 ring-2 ring-orange-200/45 transition-all duration-200 motion-reduce:transition-none active:scale-[0.96] motion-reduce:active:scale-100 active:brightness-95"
          : "min-h-[54px] touch-manipulation rounded-2xl px-1.5 py-1.5 text-[10px] font-bold leading-tight text-slate-400 opacity-75 transition-all duration-200 motion-reduce:transition-none hover:bg-white/5 hover:text-slate-200 hover:opacity-100 active:scale-[0.96] motion-reduce:active:scale-100 active:bg-white/10"
      }
    >
      <div className="text-[20px] leading-none">{emoji}</div>
      <div className="mt-0.5 truncate">{label}</div>
    </button>
  );
}
