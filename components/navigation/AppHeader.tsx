"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui";
import { ds } from "@/lib/design-system";
import type { AppText, Lang } from "@/lib/i18n/texts";
import { buildLiveUrl } from "@/lib/navigation/buildLiveUrl";

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
  lang,
  mode,
  onModeChange,
  t,
}: {
  lang: Lang;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  t: AppText;
}) {
  const router = useRouter();

  return (
    <nav className="pointer-events-none mb-7 hidden justify-center lg:flex">
      <div className="pointer-events-auto grid w-full max-w-[1180px] grid-cols-5 gap-2 rounded-full border border-white/10 bg-black/45 p-1.5 shadow-2xl shadow-black/30 backdrop-blur-xl xl:max-w-[1280px]">
        <DesktopTab
          active={mode === "inicio"}
          label={t.start}
          emoji="🏠"
          onClick={() => onModeChange("inicio")}
        />
        <DesktopTab
          active={mode === "coccion"}
          label={t.cooking}
          emoji="🥩"
          onClick={() => onModeChange("coccion")}
        />
        <DesktopTab
          active={mode === "plan" || mode === "menu" || mode === "parrillada"}
          label={t.menu}
          emoji="🧭"
          onClick={() => onModeChange("plan")}
        />
        <DesktopTab
          active={mode === "cocina"}
          label={t.live}
          emoji="⏱️"
          onClick={() => {
            router.push(buildLiveUrl({ lang }));
          }}
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
          ? "pointer-events-auto rounded-full bg-orange-500 px-3 py-2.5 text-sm font-black text-black shadow-lg shadow-orange-500/30 transition-all duration-200 active:scale-[0.98]"
          : "pointer-events-auto rounded-full px-3 py-2.5 text-sm font-bold text-slate-300/80 transition-all duration-200 hover:bg-white/7 hover:text-slate-100 active:scale-[0.98]"
      }
    >
      <span className="mr-1.5 text-base">{emoji}</span>
      {label}
    </button>
  );
}

export function BottomNavigation({
  lang,
  mode,
  onModeChange,
  disabled = false,
  t,
}: {
  lang: Lang;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  disabled?: boolean;
  t: AppText;
}) {
  const router = useRouter();

  return (
    <nav
      aria-hidden={disabled}
      className={`w-full max-w-full overflow-x-hidden px-2 pb-[max(0.7rem,env(safe-area-inset-bottom))] pt-1.5 lg:hidden ${
        disabled ? "pointer-events-none opacity-0" : ""
      }`}
    >
      <div className="mx-auto grid w-full max-w-[448px] min-w-0 grid-cols-5 items-center gap-0.5 overflow-hidden rounded-[2rem] border border-white/10 bg-black/70 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl">
        <Tab
          active={mode === "inicio"}
          label={t.start}
          emoji="🏠"
          onClick={() => onModeChange("inicio")}
        />
        <Tab
          active={mode === "coccion"}
          label={t.cooking}
          emoji="🥩"
          onClick={() => onModeChange("coccion")}
        />
        <Tab
          active={mode === "plan" || mode === "menu" || mode === "parrillada"}
          label={t.menu}
          emoji="🧭"
          onClick={() => onModeChange("plan")}
        />
        <Tab
          active={mode === "cocina"}
          label={t.live}
          emoji="⏱️"
          onClick={() => {
            router.push(buildLiveUrl({ lang }));
          }}
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
          ? "pointer-events-auto flex min-h-[58px] min-w-0 touch-manipulation flex-col items-center justify-center overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-orange-300 via-orange-500 to-orange-600 px-0.5 py-1.5 text-[9.5px] font-black leading-tight text-black shadow-lg shadow-orange-500/45 ring-1 ring-orange-200/45 transition-all duration-200 motion-reduce:transition-none active:scale-[0.96] motion-reduce:active:scale-100 active:brightness-95 min-[390px]:text-[10px]"
          : "pointer-events-auto flex min-h-[58px] min-w-0 touch-manipulation flex-col items-center justify-center overflow-hidden rounded-[1.35rem] px-0.5 py-1.5 text-[9.5px] font-bold leading-tight text-slate-300/80 transition-all duration-200 motion-reduce:transition-none hover:bg-white/[0.06] hover:text-slate-100 active:scale-[0.96] motion-reduce:active:scale-100 active:bg-white/10 min-[390px]:text-[10px]"
      }
    >
      <div className="text-center text-[19px] leading-none">{emoji}</div>
      <div className="mt-1 w-full truncate text-center tracking-[-0.03em]">{label}</div>
    </button>
  );
}
