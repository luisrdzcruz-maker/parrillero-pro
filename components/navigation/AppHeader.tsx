"use client";

import { useRouter } from "next/navigation";
import { Badge, BrandImageIcon } from "@/components/ui";
import { brandIconAssets } from "@/lib/brand/iconAssets";
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

type NavIconConfig = {
  src?: string;
  fallback: string;
};

const navIcons = {
  home: { src: brandIconAssets.navHome, fallback: "🏠" },
  cooking: { src: brandIconAssets.navCooking, fallback: "🥩" },
  menu: { src: brandIconAssets.navMenu, fallback: "🧭" },
  live: { src: brandIconAssets.navLive, fallback: "⏱️" },
  saved: { src: brandIconAssets.navSaved, fallback: "⭐" },
} satisfies Record<string, NavIconConfig>;

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
        {/* allow-arbitrary: sm:text-[10px] — breakpoint-prefixed text size, ds.text.body{N} lacks breakpoint variants (deferred to PR D-primitives/B) */}
        <Badge className={`px-1.5 py-0.5 ${ds.text.body8} uppercase tracking-[0.12em] sm:px-2.5 sm:py-0.5 sm:text-[10px] sm:tracking-[0.16em] md:text-xs md:tracking-[0.2em]`}>
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
          className={`${ds.input.compactSelect} max-w-[100px] rounded-lg px-1.5 py-1 ${ds.text.body10} sm:max-w-none sm:rounded-xl sm:px-2.5 sm:py-1.5 sm:text-xs md:rounded-2xl md:px-3 md:py-2 md:text-sm`}
        >
          <option value="es">🇪🇸 Español</option>
          <option value="en">🇬🇧 English</option>
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
      {/* allow-arbitrary: shadow-[0_18px_42px_...] desktop tab strip lift — no canonical ds.shadow.* tier */}
      <div className="pointer-events-auto grid w-full max-w-[1180px] grid-cols-5 gap-2 rounded-full border border-white/[0.09] bg-[#050302]/[0.78] p-1.5 ring-1 ring-inset ring-white/[0.06] shadow-[0_18px_42px_rgba(0,0,0,0.45)] backdrop-blur-2xl xl:max-w-[1280px]">
        <DesktopTab
          active={mode === "inicio"}
          label={t.start}
          icon={navIcons.home}
          onClick={() => onModeChange("inicio")}
        />
        <DesktopTab
          active={mode === "coccion"}
          label={t.cooking}
          icon={navIcons.cooking}
          onClick={() => onModeChange("coccion")}
        />
        <DesktopTab
          active={mode === "plan" || mode === "menu" || mode === "parrillada"}
          label={t.menu}
          icon={navIcons.menu}
          onClick={() => onModeChange("plan")}
        />
        <DesktopTab
          active={mode === "cocina"}
          label={t.live}
          icon={navIcons.live}
          onClick={() => {
            router.push(buildLiveUrl({ lang }));
          }}
        />
        <DesktopTab
          active={mode === "guardados"}
          label={t.saved}
          icon={navIcons.saved}
          onClick={() => onModeChange("guardados")}
        />
      </div>
    </nav>
  );
}

function DesktopTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: NavIconConfig;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      title={label}
      className={
        active
          ? "pointer-events-auto inline-flex items-center justify-center rounded-full bg-orange-500 px-3 py-2.5 text-sm font-black text-black shadow-lg shadow-orange-500/30 transition-all duration-200 active:scale-[0.98]"
          /* allow-arbitrary: text-slate-300/80 — slate-tinted ds.color.* tier not exposed (mutedClass is white-only), no canonical token */
          : "pointer-events-auto inline-flex items-center justify-center rounded-full px-3 py-2.5 text-sm font-bold text-slate-300/80 transition-all duration-200 hover:bg-white/7 hover:text-slate-100 active:scale-[0.98]"
      }
    >
      <NavIcon
        icon={icon}
        active={active}
        className="mr-1.5 h-5 w-5"
        fallbackClassName="text-sm"
      />
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
      className={`fixed inset-x-0 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-[70] w-full max-w-full overflow-x-hidden px-2.5 pb-0 pt-1.5 transition-opacity [transform:translateZ(0)] before:pointer-events-none before:absolute before:inset-x-0 before:-bottom-[max(0.5rem,env(safe-area-inset-bottom))] before:h-36 before:bg-gradient-to-t before:from-[#030201] before:via-[#030201]/72 before:to-transparent sm:px-3 lg:hidden ${
        disabled ? "pointer-events-none opacity-0" : "pointer-events-none opacity-100"
      }`}
    >
      {/* allow-arbitrary: rounded-[1.85rem] + shadow-[...] mobile bottom-nav chassis, no canonical token */}
      <div className="pointer-events-auto relative mx-auto grid w-full max-w-[448px] min-w-0 grid-cols-5 items-center gap-1 overflow-hidden rounded-[1.85rem] border border-white/[0.08] bg-[#050302]/[0.78] p-1.5 shadow-[0_-10px_28px_rgba(0,0,0,0.32),0_18px_44px_rgba(0,0,0,0.42)] ring-1 ring-inset ring-white/[0.06] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <Tab
          active={mode === "inicio"}
          label={t.start}
          icon={navIcons.home}
          onClick={() => onModeChange("inicio")}
        />
        <Tab
          active={mode === "coccion"}
          label={t.cooking}
          icon={navIcons.cooking}
          onClick={() => onModeChange("coccion")}
        />
        <Tab
          active={mode === "plan" || mode === "menu" || mode === "parrillada"}
          label={t.menu}
          icon={navIcons.menu}
          onClick={() => onModeChange("plan")}
        />
        <Tab
          active={mode === "cocina"}
          label={t.live}
          icon={navIcons.live}
          onClick={() => {
            router.push(buildLiveUrl({ lang }));
          }}
        />
        <Tab
          active={mode === "guardados"}
          label={t.saved}
          icon={navIcons.saved}
          onClick={() => onModeChange("guardados")}
        />
      </div>
    </nav>
  );
}

function Tab({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: NavIconConfig;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      title={label}
      className={
        active
          /* allow-arbitrary: rounded-[1.45rem] + shadow-[...] active mobile tab ember chassis, no canonical token */
          ? "pointer-events-auto flex min-h-[54px] min-w-0 touch-manipulation items-center justify-center overflow-hidden rounded-[1.45rem] bg-gradient-to-br from-orange-200 via-orange-500 to-orange-600 px-1 py-2 text-black shadow-[0_10px_28px_rgba(249,115,22,0.42)] ring-1 ring-orange-100/55 transition-all duration-200 motion-reduce:transition-none active:scale-[0.97] motion-reduce:active:scale-100 active:brightness-95"
          /* allow-arbitrary: rounded-[1.45rem] + hover:bg-white/[0.05] inactive mobile tab chassis, no canonical token */
          : "pointer-events-auto flex min-h-[54px] min-w-0 touch-manipulation items-center justify-center overflow-hidden rounded-[1.45rem] px-1 py-2 text-slate-400 transition-all duration-200 motion-reduce:transition-none hover:bg-white/[0.05] hover:text-slate-200 active:scale-[0.97] motion-reduce:active:scale-100 active:bg-white/10"
      }
    >
      <NavIcon
        icon={icon}
        active={active}
        className="h-8 w-8"
        /* allow-arbitrary: text-[26px] display-tier fallback glyph — stays inline per slice-d-tokens.md §1 */
        fallbackClassName="text-[26px]"
      />
      <span className="sr-only">{label}</span>
    </button>
  );
}

function NavIcon({
  active,
  className,
  fallbackClassName,
  icon,
}: {
  active: boolean;
  className: string;
  fallbackClassName: string;
  icon: NavIconConfig;
}) {
  const fallback = (
    <span
      className={`${className} inline-flex shrink-0 items-center justify-center rounded-md leading-none ${
        active ? "opacity-100" : "opacity-75"
      }`}
      aria-hidden="true"
    >
      <span className={fallbackClassName}>{icon.fallback}</span>
    </span>
  );

  if (!icon.src) {
    return fallback;
  }

  return (
    <BrandImageIcon
      src={icon.src}
      alt=""
      size="md"
      shape="plain"
      aria-hidden="true"
      fallback={fallback}
      className={`${className} rounded-md ${
        /* allow-arbitrary: drop-shadow-[0_0_10px_...] active icon depth — no canonical ds.shadow.* tier */
        active ? "opacity-100 drop-shadow-[0_0_10px_rgba(0,0,0,0.3)]" : "opacity-60 saturate-75"
      } transition duration-200`}
    />
  );
}
