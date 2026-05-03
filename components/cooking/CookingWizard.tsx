"use client";

import ResultGrid, { buildResultSummary } from "@/components/ResultGrid";
import ResultHero from "@/components/ResultHero";
import FoodCard from "@/components/FoodCard";
import { CookingLoadingScreen } from "@/components/cooking/CookingLoadingScreen";
import { getInputProfileForCut } from "@/lib/cooking/inputProfiles";
import { getCutById } from "@/lib/cookingRules";
import { Badge, Button, Section } from "@/components/ui";
import { ds } from "@/lib/design-system";
import {
  getAnimalSurfaceLabel,
  getDetailsSetupLabels,
  getDonenessSurfaceLabel,
  getEquipmentSurfaceLabel,
} from "@/lib/i18n/surfaceFallbacks";
import type { AppText, Lang } from "@/lib/i18n/texts";
import type { Doneness } from "@/lib/types/domain";
import {
  createLiveCookingPayload,
  readLiveCookingPayload,
  saveLiveCookingPayload,
  type LiveCookingPlanPayload,
} from "@/lib/liveCookingPlan";
import { buildLiveUrl } from "@/lib/navigation/buildLiveUrl";
import { animalIdsByLabel, animalOptions, type AnimalLabel } from "@/lib/media/animalMedia";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ReactNode, useLayoutEffect, useState } from "react";

export type Blocks = Record<string, string>;
export type SaveMenuStatus = "idle" | "saving" | "success" | "error";
export type CookingWizardStep = "animal" | "cut" | "details" | "result";
export type SelectOption = string | { label: string; value: string };

export type CutItem = {
  id: string;
  name: string;
  image: string;
  description: string;
};

export const equipmentOptions = [
  "parrilla gas",
  "parrilla carbón",
  "kamado",
  "cocina interior",
  "Napoleon Rogue 525-2",
];

const cookingEquipmentOptions = ["parrilla gas", "parrilla carbón", "kamado", "cocina interior"];
const LIVE_DONENESS_VALUES: Doneness[] = ["rare", "medium_rare", "medium", "medium_well", "well_done", "safe"];

export type CookingSizePreset = "small" | "medium" | "large";
export type CookingWeightRange = "light" | "medium" | "large";
export type VegetableFormat = "whole" | "halved" | "slices";

function toLiveDoneness(value: string): Doneness | undefined {
  return LIVE_DONENESS_VALUES.includes(value as Doneness) ? (value as Doneness) : undefined;
}

const foodImages: Record<AnimalLabel, string> = {
  Vacuno: "/images/vacuno/ribeye-cooked.webp",
  Cerdo: "/images/cerdo/secreto-cooked.webp",
  Pollo: "/images/pollo/muslos-cooked.webp",
  Pescado: "/images/pescado/salmon-cooked.webp",
  Verduras: "/images/verduras/verduras-asadas.webp",
};

function buildText(blocks: Blocks) {
  return Object.keys(blocks)
    .map((key) => `${key}\n${blocks[key]}`)
    .join("\n\n");
}

function withoutSizeUnits(label: string) {
  return label.replace(/\s*\(~[^)]*\)/g, "").trim();
}

function CookingStepTransition({
  stepKey,
  children,
}: {
  stepKey: CookingWizardStep;
  children: ReactNode;
}) {
  const [entered, setEntered] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;
    let frameId = 0;

    queueMicrotask(() => {
      if (cancelled) return;

      setEntered(false);
      frameId = requestAnimationFrame(() => {
        frameId = requestAnimationFrame(() => {
          if (!cancelled) setEntered(true);
        });
      });
    });

    return () => {
      cancelled = true;
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [stepKey]);

  return (
    <div
      className={`motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
        entered ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
      } transition-[opacity,transform] duration-300 ease-out`}
    >
      {children}
    </div>
  );
}

export function CookingWizard({
  advancedThicknessEnabled,
  animal,
  blocks,
  checkedItems,
  cookingStep,
  currentDonenessOptions,
  cut,
  cuts,
  doneness,
  equipment,
  generateCookingPlan,
  getAnimalPreview,
  handleAnimalChange,
  handleCutChange,
  lang,
  loading,
  onSaveMenu,
  selectedCut,
  saveMenuMessage,
  saveMenuStatus,
  setCheckedItems,
  setCookingStep,
  setDoneness,
  setAdvancedThicknessEnabled,
  setEquipment,
  setSizePreset,
  setThickness,
  setVegetableFormat,
  setWeightRange,
  sizePreset,
  showThickness,
  t,
  thickness,
  vegetableFormat,
  weightRange,
}: {
  advancedThicknessEnabled: boolean;
  animal: AnimalLabel;
  blocks: Blocks;
  checkedItems: Record<string, boolean>;
  cookingStep: CookingWizardStep;
  currentDonenessOptions: SelectOption[];
  cut: string;
  cuts: CutItem[];
  doneness: string;
  equipment: string;
  generateCookingPlan: () => Promise<void>;
  getAnimalPreview: (animal: AnimalLabel, lang: Lang) => string;
  handleAnimalChange: (animal: AnimalLabel) => void;
  handleCutChange: (cut: string) => void;
  lang: Lang;
  loading: boolean;
  onSaveMenu: () => Promise<void>;
  selectedCut?: CutItem;
  saveMenuMessage: string;
  saveMenuStatus: SaveMenuStatus;
  setCheckedItems: (value: Record<string, boolean>) => void;
  setCookingStep: (step: CookingWizardStep) => void;
  setDoneness: (value: string) => void;
  setAdvancedThicknessEnabled: (value: boolean) => void;
  setEquipment: (value: string) => void;
  setSizePreset: (value: CookingSizePreset) => void;
  setThickness: (value: string) => void;
  setVegetableFormat: (value: VegetableFormat) => void;
  setWeightRange: (value: CookingWeightRange) => void;
  sizePreset: CookingSizePreset;
  showThickness: boolean;
  t: AppText;
  thickness: string;
  vegetableFormat: VegetableFormat;
  weightRange: CookingWeightRange;
}) {
  const visibleCookingStep = cookingStep;

  // ── Narrated loading experience ─────────────────────────────────────────────
  // Replaces the spinner: full-screen image + cycling status messages + stepped bar
  if (loading && visibleCookingStep === "details" && selectedCut) {
    return (
      <CookingLoadingScreen
        cutImage={selectedCut.image}
        cutName={selectedCut.name}
        lang={lang}
      />
    );
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <CookingStepTransition stepKey={visibleCookingStep}>
        {visibleCookingStep === "animal" ? (
          <CookingAnimalStep
            animal={animal}
            getAnimalPreview={getAnimalPreview}
            lang={lang}
            onSelectAnimal={handleAnimalChange}
            t={t}
          />
        ) : visibleCookingStep === "cut" ? (
          <CookingCutStep
            animal={animal}
            cut={cut}
            cuts={cuts}
            lang={lang}
            onBack={() => setCookingStep("animal")}
            onSelectCut={handleCutChange}
            t={t}
          />
        ) : visibleCookingStep === "details" && selectedCut ? (
          <CookingDetailsStep
            advancedThicknessEnabled={advancedThicknessEnabled}
            animal={animal}
            currentDonenessOptions={currentDonenessOptions}
            doneness={doneness}
            equipment={equipment}
            generateCookingPlan={generateCookingPlan}
            lang={lang}
            loading={loading}
            onBack={() => setCookingStep("cut")}
            selectedCut={selectedCut}
            setDoneness={setDoneness}
            setAdvancedThicknessEnabled={setAdvancedThicknessEnabled}
            setEquipment={setEquipment}
            setSizePreset={setSizePreset}
            setThickness={setThickness}
            setVegetableFormat={setVegetableFormat}
            setWeightRange={setWeightRange}
            sizePreset={sizePreset}
            t={t}
            thickness={thickness}
            vegetableFormat={vegetableFormat}
            weightRange={weightRange}
          />
        ) : visibleCookingStep === "result" ? (
          <CookingResultStep
            animal={animal}
            blocks={blocks}
            checkedItems={checkedItems}
            cut={selectedCut?.name ?? cut}
            cutId={selectedCut?.id}
            doneness={doneness}
            equipment={equipment}
            lang={lang}
            onEdit={() => setCookingStep("details")}
            onSaveMenu={onSaveMenu}
            saveMenuMessage={saveMenuMessage}
            saveMenuStatus={saveMenuStatus}
            setCheckedItems={setCheckedItems}
            showThickness={showThickness}
            t={t}
            thickness={thickness}
          />
        ) : null}
      </CookingStepTransition>
    </div>
  );
}

function CookingAnimalStep({
  animal,
  getAnimalPreview,
  lang,
  onSelectAnimal,
  t,
}: {
  animal: AnimalLabel;
  getAnimalPreview: (animal: AnimalLabel, lang: Lang) => string;
  lang: Lang;
  onSelectAnimal: (animal: AnimalLabel) => void;
  t: AppText;
}) {
  return (
    <Section className="mx-auto max-w-[1480px] animate-[fadeIn_220ms_ease-out] space-y-6 sm:space-y-7 lg:space-y-8 2xl:max-w-[1520px]" title={t.chooseAnimal}>
      <p className="-mt-3 max-w-xl text-sm font-medium leading-6 text-slate-300 sm:text-base">
        Elige el ingrediente principal y Parrillero Pro ajusta cortes, fuego y tiempos.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-3 xl:gap-8 2xl:grid-cols-5">
        {animalOptions.map((item) => (
          <FoodCard
            key={item}
            selected={animal === item}
            title={getAnimalSurfaceLabel(item, lang)}
            subtitle={getAnimalPreview(item, lang)}
            image={foodImages[item]}
            badge={undefined}
            selectedLabel={t.selected}
            onClick={() => onSelectAnimal(item)}
          />
        ))}
      </div>
    </Section>
  );
}

function AppTopBar({
  backLabel,
  onBack,
}: {
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="absolute left-2 top-1 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-lg font-black leading-none text-white shadow-lg shadow-black/20 backdrop-blur transition-all duration-200 hover:bg-black/55 active:scale-95 md:hidden"
      aria-label={backLabel}
      title={backLabel}
    >
      ←
    </button>
  );
}

function DetailsBackButton({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="absolute left-2 top-2 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-lg font-black leading-none text-white shadow-lg shadow-black/20 backdrop-blur transition-all duration-200 hover:bg-black/55 active:scale-95 md:hidden"
      aria-label={label}
      title={label}
    >
      ←
    </button>
  );
}

// ─── Cut metadata derivation ──────────────────────────────────────────────────
// Derives 1–2 display tags from the cut name without any engine dependency.

function deriveCutTags(name: string): string[] {
  const n = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const tags: string[] = [];

  // Quality / difficulty
  if (
    n.includes("tomahawk") ||
    n.includes("wagyu") ||
    n.includes("prime") ||
    n.includes("t-bone") ||
    n.includes("ribeye") ||
    n.includes("chuleton") ||
    n.includes("solomillo") ||
    n.includes("picanha") ||
    n.includes("secreto") ||
    n.includes("presa") ||
    n.includes("pluma")
  ) {
    tags.push("Premium");
  } else if (
    n.includes("brisket") ||
    n.includes("pulled") ||
    n.includes("costilla") ||
    n.includes("aguja")
  ) {
    tags.push("Low & Slow");
  } else if (
    n.includes("pechuga") ||
    n.includes("muslo") ||
    n.includes("contramuslo") ||
    n.includes("alita") ||
    n.includes("salmon") ||
    n.includes("lubina") ||
    n.includes("dorada") ||
    n.includes("pimiento") ||
    n.includes("calabacin") ||
    n.includes("cebolla") ||
    n.includes("esparrag")
  ) {
    tags.push("Fácil");
  } else {
    tags.push("Clásico");
  }

  // Heat zone
  if (
    n.includes("brisket") ||
    n.includes("pulled") ||
    n.includes("costilla") ||
    n.includes("aguja") ||
    n.includes("paleta")
  ) {
    tags.push("Indirecto");
  } else if (
    n.includes("chuleton") ||
    n.includes("ribeye") ||
    n.includes("tomahawk") ||
    n.includes("entrecot")
  ) {
    tags.push("Mixto");
  } else if (
    n.includes("secreto") ||
    n.includes("presa") ||
    n.includes("solomillo") ||
    n.includes("picanha") ||
    n.includes("pechuga") ||
    n.includes("salmon") ||
    n.includes("lubina") ||
    n.includes("pluma") ||
    n.includes("pimiento") ||
    n.includes("esparrag")
  ) {
    tags.push("Directo");
  }

  return tags;
}

// ─── Featured cut card (wide, landscape, top of list) ─────────────────────────

function FeaturedCutCard({
  cut,
  active,
  activeLabel,
  onClick,
}: {
  cut: CutItem;
  active: boolean;
  activeLabel: string;
  onClick: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(cut.image) && !imageFailed;
  const tags = deriveCutTags(cut.name);

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "group relative w-full touch-manipulation select-none overflow-hidden rounded-[1.75rem] border border-orange-300/90 bg-zinc-950 text-left shadow-[0_22px_64px_rgba(255,106,0,0.30)] ring-2 ring-orange-400/35 transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 active:scale-[0.99]"
          : "group relative w-full touch-manipulation select-none overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950 text-left shadow-[0_14px_42px_rgba(0,0,0,0.35)] transition-all duration-200 ease-out hover:border-[#FF6A00]/45 hover:shadow-[0_20px_52px_rgba(255,106,0,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50 active:scale-[0.99]"
      }
    >
      <div className="relative min-h-[200px] overflow-hidden sm:min-h-[260px] lg:min-h-[300px]">
        {/* Background image */}
        {!showImage && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,106,0,0.22),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(251,146,60,0.10),transparent_35%),linear-gradient(145deg,#18181b_0%,#09090b_48%,#000000_100%)]" />
        )}
        {showImage && (
          <Image
            src={cut.image}
            alt={cut.name}
            fill
            sizes="(min-width: 1280px) 80vw, 100vw"
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            onError={() => setImageFailed(true)}
          />
        )}

        {/* Gradient layers: strong bottom + strong left so text is always readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />

        {/* Warm tint at top-left */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(255,106,0,0.14),transparent_40%)]" />

        {/* Active bottom bar */}
        <div
          className={
            active
              ? "absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-300 via-[#FF6A00] to-amber-300"
              : "absolute inset-x-0 bottom-0 h-px bg-white/8"
          }
        />

        {/* Active check */}
        {active && (
          <span
            className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6A00] text-xs font-black leading-none text-black shadow-lg shadow-orange-500/50 ring-2 ring-white/25"
            title={activeLabel}
            aria-label={activeLabel}
          >
            ✓
          </span>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 lg:max-w-[65%]">
          {/* Featured badge + tags */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-orange-400/35 bg-orange-500/18 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
              ⭐ Recomendado para empezar
            </span>
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/12 bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white/55 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          <h3 className="text-2xl font-black leading-tight tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] sm:text-3xl">
            {cut.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 max-w-md text-sm leading-5 text-slate-200/75">
            {cut.description}
          </p>

          <div className="mt-3.5 flex items-center gap-2 text-sm font-black text-orange-200/90 transition-colors group-hover:text-orange-200">
            <span>Seleccionar</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-300/20 bg-orange-500/18 text-xs transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Regular cut card (2-column grid) ─────────────────────────────────────────

function CutCard({
  active,
  cut,
  badge,
  activeLabel,
  tags,
  onClick,
}: {
  active: boolean;
  cut: CutItem;
  badge?: string;
  activeLabel: string;
  tags?: string[];
  onClick: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(cut.image) && !imageFailed;

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "group relative touch-manipulation select-none overflow-hidden rounded-[1.75rem] border border-orange-300/90 bg-zinc-950 text-left shadow-[0_22px_64px_rgba(255,106,0,0.30)] ring-2 ring-orange-400/35 transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 active:scale-[0.98]"
          : "group relative touch-manipulation select-none overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950 text-left shadow-[0_14px_42px_rgba(0,0,0,0.35)] transition-all duration-200 ease-out hover:border-[#FF6A00]/45 hover:shadow-[0_20px_52px_rgba(255,106,0,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50 active:scale-[0.98]"
      }
    >
      <div className="relative aspect-[4/5] min-h-[220px] overflow-hidden lg:min-h-[300px] xl:min-h-[340px] 2xl:min-h-[360px]">
        {!showImage && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_16%,rgba(255,106,0,0.28),transparent_36%),radial-gradient(circle_at_82%_0%,rgba(251,146,60,0.10),transparent_28%),linear-gradient(145deg,#18181b_0%,#09090b_48%,#000000_100%)]" />
        )}
        {showImage && (
          <Image
            src={cut.image}
            alt={cut.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        )}

        {/* Slightly lighter overlay than before so image breathes more */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-transparent" />
        {/* Warm tint at top corner */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,106,0,0.15),transparent_38%)]" />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/8 to-transparent opacity-60" />

        {/* Active bottom bar */}
        <div
          className={
            active
              ? "absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-300 via-[#FF6A00] to-amber-300"
              : "absolute inset-x-0 bottom-0 h-px bg-white/8"
          }
        />

        {/* External badge (kept for API compat) */}
        {badge && (
          <Badge
            className="absolute left-2 top-2 z-10 text-[9px] shadow-lg shadow-black/20 backdrop-blur-md sm:left-3 sm:top-3 sm:text-[11px]"
            tone="glass"
          >
            {badge}
          </Badge>
        )}

        {/* Active checkmark */}
        {active && (
          <span
            className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6A00] text-xs font-black leading-none text-black shadow-lg shadow-orange-500/50 ring-2 ring-white/25 sm:right-3 sm:top-3"
            title={activeLabel}
            aria-label={activeLabel}
          >
            ✓
          </span>
        )}

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          {/* Metadata tags */}
          {tags && tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-black/45 px-1.5 py-0.5 text-[10px] font-bold text-white/55 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h3 className="line-clamp-2 text-lg font-black leading-5 tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)] sm:text-2xl sm:leading-tight">
            {cut.name}
          </h3>
          <p className="mt-1 line-clamp-2 max-w-[24rem] text-[11px] font-medium leading-4 text-slate-200/75 sm:mt-2 sm:text-sm sm:leading-5">
            {cut.description}
          </p>
        </div>
      </div>
    </button>
  );
}

// ─── Cut selection step ────────────────────────────────────────────────────────

function CookingCutStep({
  animal,
  cut,
  cuts,
  lang,
  onBack,
  onSelectCut,
  t,
}: {
  animal: AnimalLabel;
  cut: string;
  cuts: CutItem[];
  lang: Lang;
  onBack: () => void;
  onSelectCut: (cut: string) => void;
  t: AppText;
}) {
  const featuredCut = cuts[0];
  const gridCuts = cuts.slice(1);

  return (
    <section className="relative mx-auto max-w-[1480px] animate-[fadeIn_220ms_ease-out] space-y-5 sm:space-y-6 lg:space-y-7 2xl:max-w-[1520px]">
      <AppTopBar backLabel={animal} onBack={onBack} />

      <div className="max-w-3xl pl-11 md:pl-0">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-300/75">
          {lang === "es" ? "Categoría" : lang === "fi" ? "Kategoria" : "Category"}
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
          {t.chooseCut}
        </h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-400 sm:text-base">
          {lang === "es"
            ? "Selecciona el corte para ajustar fuego y tiempos."
            : lang === "fi"
              ? "Valitse leikkaus, jotta lampo ja ajat saadaan kohdalleen."
              : "Select the cut to tune heat and timings."}
        </p>
      </div>

      {/* Featured cut — wider horizontal card */}
      {featuredCut && (
        <FeaturedCutCard
          cut={featuredCut}
          active={cut === featuredCut.id}
          activeLabel={t.active}
          onClick={() => onSelectCut(featuredCut.id)}
        />
      )}

      {/* Remaining cuts in 2-col grid */}
      {gridCuts.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">
            {lang === "es" ? "Todos los cortes" : lang === "fi" ? "Kaikki leikkaukset" : "All cuts"}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {gridCuts.map((item) => (
              <CutCard
                key={item.id}
                active={cut === item.id}
                cut={item}
                badge={undefined}
                activeLabel={t.active}
                tags={deriveCutTags(item.name)}
                onClick={() => onSelectCut(item.id)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function getDetailsHeroBadge({
  lang,
  showAdvancedExactThickness,
  showDoneness,
  showWeightPreset,
}: {
  lang: Lang;
  showAdvancedExactThickness: boolean;
  showDoneness: boolean;
  showWeightPreset: boolean;
}) {
  if (showWeightPreset) return lang === "es" ? "Corte critico" : lang === "fi" ? "Tarkea leikkaus" : "Critical cut";
  if (showAdvancedExactThickness) return lang === "es" ? "Control fino" : lang === "fi" ? "Tarkka hallinta" : "Fine control";
  if (showDoneness) return lang === "es" ? "Alta precision" : lang === "fi" ? "Korkea tarkkuus" : "High precision";
  return lang === "es" ? "Control fino" : lang === "fi" ? "Tarkka hallinta" : "Fine control";
}

function CookingDetailsHero({
  animal,
  badge,
  lang,
  selectedCut,
}: {
  animal: AnimalLabel;
  badge: string;
  lang: Lang;
  selectedCut: CutItem;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(selectedCut.image) && !imageFailed;
  const fallbackTip =
    lang === "es"
      ? "Fuego y tiempos ajustados a este corte."
      : lang === "fi"
        ? "Lampo ja ajoitus on viritetty talle leikkaukselle."
        : "Heat and timing tuned to this cut.";

  return (
    <div className="animate-live-enter relative overflow-hidden rounded-[1.75rem] border border-orange-300/15 bg-zinc-950 shadow-[0_22px_70px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-white/[0.04] sm:rounded-[2rem]">
      <div className="relative h-[154px] overflow-hidden sm:h-[194px]">
        {!showImage && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_28%,rgba(255,106,0,0.28),transparent_34%),radial-gradient(circle_at_22%_75%,rgba(251,146,60,0.13),transparent_32%),linear-gradient(145deg,#18181b_0%,#09090b_50%,#000000_100%)]" />
        )}
        {showImage && (
          <Image
            src={selectedCut.image}
            alt={selectedCut.name}
            fill
            sizes="(min-width: 768px) 760px, 100vw"
            className="scale-[1.1] object-cover object-center"
            priority={false}
            onError={() => setImageFailed(true)}
          />
        )}

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(0,0,0,0.54)_58%,rgba(0,0,0,0.94)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/94 via-black/62 to-black/18" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/34" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(255,106,0,0.24),transparent_34%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-300/45 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-orange-300/35 bg-orange-500/18 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-200 shadow-lg shadow-orange-950/20 backdrop-blur-md">
              {badge}
            </span>
            <span className="rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55 backdrop-blur-md">
              {getAnimalSurfaceLabel(animal, lang)}
            </span>
          </div>
          <h1 className="max-w-2xl text-[1.7rem] font-black leading-none tracking-tight text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.85)] sm:text-4xl">
            {selectedCut.name}
          </h1>
          <p className="mt-1.5 line-clamp-2 max-w-xl text-xs font-medium leading-5 text-slate-200/78 sm:mt-2 sm:text-sm">
            {selectedCut.description || fallbackTip}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailsFieldGroup({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/[0.08] bg-[radial-gradient(circle_at_50%_0%,rgba(255,106,0,0.055),transparent_42%),rgba(0,0,0,0.22)] p-2.5 shadow-inner shadow-black/25 ring-1 ring-inset ring-orange-300/[0.045] sm:rounded-[1.35rem] sm:p-3">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-200/70">
        {title}
      </p>
      <div className="grid grid-cols-1 gap-2.5 min-[390px]:grid-cols-2">{children}</div>
    </div>
  );
}

function DetailsInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/85 px-3 py-2.5 text-sm font-semibold text-slate-100 shadow-inner shadow-black/25 outline-none transition placeholder:text-slate-600 focus:border-orange-400/55 focus:ring-2 focus:ring-orange-500/15 sm:py-2.5"
      />
    </div>
  );
}

function DetailsSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/85 px-3 py-2.5 text-sm font-semibold text-slate-100 shadow-inner shadow-black/25 outline-none transition focus:border-orange-400/55 focus:ring-2 focus:ring-orange-500/15 sm:py-2.5"
      >
        {options.map((item) => (
          <option
            key={typeof item === "string" ? item : item.value}
            value={typeof item === "string" ? item : item.value}
          >
            {typeof item === "string" ? item : item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CookingDetailsStep({
  advancedThicknessEnabled,
  animal,
  currentDonenessOptions,
  doneness,
  equipment,
  generateCookingPlan,
  lang,
  loading,
  onBack,
  selectedCut,
  setDoneness,
  setAdvancedThicknessEnabled,
  setEquipment,
  setSizePreset,
  setThickness,
  setVegetableFormat,
  setWeightRange,
  sizePreset,
  t,
  thickness,
  vegetableFormat,
  weightRange,
}: {
  advancedThicknessEnabled: boolean;
  animal: AnimalLabel;
  currentDonenessOptions: SelectOption[];
  doneness: string;
  equipment: string;
  generateCookingPlan: () => Promise<void>;
  lang: Lang;
  loading: boolean;
  onBack: () => void;
  selectedCut: CutItem;
  setDoneness: (value: string) => void;
  setAdvancedThicknessEnabled: (value: boolean) => void;
  setEquipment: (value: string) => void;
  setSizePreset: (value: CookingSizePreset) => void;
  setThickness: (value: string) => void;
  setVegetableFormat: (value: VegetableFormat) => void;
  setWeightRange: (value: CookingWeightRange) => void;
  sizePreset: CookingSizePreset;
  t: AppText;
  thickness: string;
  vegetableFormat: VegetableFormat;
  weightRange: CookingWeightRange;
}) {
  const cutMeta = getCutById(selectedCut.id);
  const inputProfile = cutMeta
    ? getInputProfileForCut({
        cutId: cutMeta.id,
        animalId: cutMeta.animalId,
        style: cutMeta.style,
        inputProfileId: cutMeta.inputProfileId,
      })
    : getInputProfileForCut({
        cutId: selectedCut.id,
        animalId: animal === "Verduras" ? "vegetables" : "beef",
        style: "fast",
      });
  const showDoneness = inputProfile.showDoneness && currentDonenessOptions.length > 0;
  const showSizePreset = inputProfile.showSizePreset;
  const showWeightRange = inputProfile.showWeightRange;
  const showWeightPreset = inputProfile.showWeightPreset;
  const showVegetableFormat = inputProfile.showVegetableFormat;
  const showAdvancedExactThickness = inputProfile.allowAdvancedExactThickness;
  const showTechnicalSizeLabels = showAdvancedExactThickness || advancedThicknessEnabled;
  const sizeOptions = [
    {
      value: "small",
      label: showTechnicalSizeLabels ? t.sizeSmall : withoutSizeUnits(t.sizeSmall),
    },
    {
      value: "medium",
      label: showTechnicalSizeLabels ? t.sizeMedium : withoutSizeUnits(t.sizeMedium),
    },
    {
      value: "large",
      label: showTechnicalSizeLabels ? t.sizeLarge : withoutSizeUnits(t.sizeLarge),
    },
  ];
  const weightOptions = (inputProfile.weightOptions ?? []).map((option) => ({
    value: option.id,
    label: `${t[option.labelKey]} (${option.rangeLabel})`,
  }));
  const hasCurrentWeightValue = weightOptions.some((option) => option.value === weightRange);
  const weightSelectValue = hasCurrentWeightValue ? weightRange : inputProfile.defaults.weightRange;
  const detailsHeroBadge = getDetailsHeroBadge({
    lang,
    showAdvancedExactThickness,
    showDoneness,
    showWeightPreset,
  });
  const measurementsTitle = lang === "es" ? "Tamano y peso" : lang === "fi" ? "Koko ja paino" : "Size and weight";
  const cookingTitle = lang === "es" ? "Punto y equipo" : lang === "fi" ? "Kypsyys ja valine" : "Doneness and gear";
  const localizedDonenessOptions = currentDonenessOptions.map((option) =>
    typeof option === "string"
      ? option
      : {
          ...option,
          label: lang === "fi" ? getDonenessSurfaceLabel(option.value, lang) : option.label,
        },
  );
  const localizedCookingEquipmentOptions = cookingEquipmentOptions.map((value) => ({
    value,
    label: getEquipmentSurfaceLabel(value, lang),
  }));
  const hasMeasurementFields =
    showSizePreset || showWeightRange || showWeightPreset || showVegetableFormat || showAdvancedExactThickness;
  const detailsSetupText = getDetailsSetupLabels(lang);

  return (
    <section className="relative mx-auto max-w-4xl animate-[fadeIn_220ms_ease-out] space-y-2.5 pb-4 pt-1 sm:space-y-4 sm:pb-6 lg:pb-6">
      <DetailsBackButton label={selectedCut.name} onBack={onBack} />

      <CookingDetailsHero
        animal={animal}
        badge={detailsHeroBadge}
        lang={lang}
        selectedCut={selectedCut}
      />

      <div className="animate-live-enter relative overflow-hidden rounded-[1.75rem] border border-orange-300/18 bg-[radial-gradient(circle_at_18%_0%,rgba(255,106,0,0.20),transparent_34%),linear-gradient(145deg,rgba(24,24,27,0.99),rgba(3,7,18,0.97)_58%,rgba(0,0,0,0.98))] p-[1px] shadow-[0_22px_70px_rgba(0,0,0,0.46),0_0_34px_rgba(255,106,0,0.09)] ring-1 ring-inset ring-white/[0.055] [animation-delay:70ms] sm:rounded-[2rem]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,146,60,0.14),transparent_42%)]" />
        <div className="relative space-y-2.5 rounded-[calc(1.75rem-1px)] bg-black/14 p-3 backdrop-blur-sm sm:space-y-3 sm:rounded-[calc(2rem-1px)] sm:p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-200/75">
                {detailsSetupText.section}
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-white">
                {detailsSetupText.title}
              </h2>
            </div>
            <div className="hidden rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-200 sm:block">
              {detailsHeroBadge}
            </div>
          </div>

          {hasMeasurementFields && (
            <DetailsFieldGroup title={measurementsTitle}>
              {showSizePreset && (
                <DetailsSelect
                  label={t.sizePreset}
                  value={sizePreset}
                  onChange={(value) => setSizePreset(value as CookingSizePreset)}
                  options={sizeOptions}
                />
              )}

              {showWeightRange && (
                <DetailsSelect
                  label={t.weightRange}
                  value={weightSelectValue}
                  onChange={(value) => setWeightRange(value as CookingWeightRange)}
                  options={weightOptions}
                />
              )}

              {showWeightPreset && (
                <DetailsSelect
                  label={t.weightPreset}
                  value={weightSelectValue}
                  onChange={(value) => setWeightRange(value as CookingWeightRange)}
                  options={weightOptions}
                />
              )}

              {showVegetableFormat && (
                <DetailsSelect
                  label={t.vegetableFormat}
                  value={vegetableFormat}
                  onChange={(value) => setVegetableFormat(value as VegetableFormat)}
                  options={[
                    { value: "whole", label: t.vegetableFormatWhole },
                    { value: "halved", label: t.vegetableFormatHalved },
                    { value: "slices", label: t.vegetableFormatSlices },
                  ]}
                />
              )}

              {showAdvancedExactThickness && (
                <div className="min-[390px]:col-span-2">
                  <button
                    type="button"
                    onClick={() => setAdvancedThicknessEnabled(!advancedThicknessEnabled)}
                    className="inline-flex items-center rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1.5 text-xs font-black text-orange-200 transition-all duration-200 hover:border-orange-300/35 hover:bg-orange-500/15 active:scale-[0.98]"
                  >
                    {advancedThicknessEnabled ? t.hideAdvancedThickness : t.advancedThickness}
                  </button>
                </div>
              )}

              {showAdvancedExactThickness && advancedThicknessEnabled && (
                <DetailsInput
                  label={t.thickness}
                  value={thickness}
                  onChange={setThickness}
                  placeholder="Ej: 5"
                />
              )}
            </DetailsFieldGroup>
          )}

          <DetailsFieldGroup title={cookingTitle}>
            {showDoneness && (
              <DetailsSelect
                label={t.doneness}
                value={doneness}
                onChange={setDoneness}
                options={localizedDonenessOptions}
              />
            )}
            <DetailsSelect
              label={t.equipment}
              value={equipment}
              onChange={setEquipment}
              options={localizedCookingEquipmentOptions}
            />
          </DetailsFieldGroup>
        </div>
      </div>

      <div className="animate-live-enter max-w-md [animation-delay:140ms] sm:max-w-sm">
        <PrimaryButton
          onClick={generateCookingPlan}
          loading={loading}
          text={t.generatePlan}
          loadingText={t.generating}
          className="min-h-[3.2rem] rounded-[1.35rem] border border-orange-200/25 shadow-[0_18px_50px_rgba(249,115,22,0.34),0_0_28px_rgba(255,106,0,0.14)] ring-1 ring-orange-300/25 hover:shadow-[0_22px_60px_rgba(249,115,22,0.42),0_0_34px_rgba(255,106,0,0.18)] sm:min-h-[3.35rem]"
        />
      </div>
    </section>
  );
}

function CookingResultStep({
  animal,
  blocks,
  checkedItems,
  cut,
  cutId,
  doneness,
  equipment,
  lang,
  onEdit,
  onSaveMenu,
  saveMenuMessage,
  saveMenuStatus,
  setCheckedItems,
  showThickness,
  t,
  thickness,
}: {
  animal: AnimalLabel;
  blocks: Blocks;
  checkedItems: Record<string, boolean>;
  cut: string;
  cutId?: string;
  doneness: string;
  equipment: string;
  lang: Lang;
  onEdit: () => void;
  onSaveMenu: () => Promise<void>;
  saveMenuMessage: string;
  saveMenuStatus: SaveMenuStatus;
  setCheckedItems: (value: Record<string, boolean>) => void;
  showThickness: boolean;
  t: AppText;
  thickness: string;
}) {
  const router = useRouter();

  function handleStartCooking() {
    const payload = createLiveCookingPayload({
      input: {
        animal,
        cut: cutId ?? cut,
        equipment,
        doneness,
        thickness: showThickness ? thickness : "2",
        lang,
      },
      blocks,
    });

    const previousPayload: LiveCookingPlanPayload | null = readLiveCookingPayload();
    if (
      previousPayload &&
      previousPayload.signature !== payload.signature &&
      previousPayload.input.cut === payload.input.cut &&
      previousPayload.input.animal === payload.input.animal
    ) {
      console.info("[live-cooking] plan signature changed for same animal/cut");
    }

    saveLiveCookingPayload(payload);
    const liveThicknessRaw = Number(thickness);
    const liveThickness =
      showThickness && Number.isFinite(liveThicknessRaw) && liveThicknessRaw > 0
        ? liveThicknessRaw
        : undefined;
    router.push(
      buildLiveUrl({
        animal: animalIdsByLabel[animal],
        cutId: cutId ?? cut,
        doneness: toLiveDoneness(doneness),
        thickness: liveThickness,
        lang,
      }),
    );
  }

  return (
    <div className="space-y-4">
      <ResultCards
        animal={getAnimalSurfaceLabel(animal, lang)}
        blocks={blocks}
        context={`${getAnimalSurfaceLabel(animal, lang)} · ${getEquipmentSurfaceLabel(equipment, lang)}`}
        cut={cut}
        doneness={getDonenessSurfaceLabel(doneness, lang)}
        equipment={equipment}
        lang={lang}
        loading={false}
        checkedItems={checkedItems}
        onEdit={onEdit}
        onSaveMenu={onSaveMenu}
        saveMenuMessage={saveMenuMessage}
        saveMenuStatus={saveMenuStatus}
        setCheckedItems={setCheckedItems}
        onStartCooking={handleStartCooking}
        t={t}
      />
    </div>
  );
}

export function ResultCards({
  animal,
  blocks,
  context,
  cut,
  doneness,
  equipment,
  lang = "es",
  loading,
  checkedItems,
  setCheckedItems,
  onStartCooking,
  onSaveMenu,
  onEdit,
  saveMenuStatus = "idle",
  saveMenuMessage = "",
  t,
}: {
  animal?: string;
  blocks: Blocks;
  context?: string;
  cut?: string;
  doneness?: string;
  equipment?: string;
  lang?: Lang;
  loading: boolean;
  checkedItems: Record<string, boolean>;
  setCheckedItems: (value: Record<string, boolean>) => void;
  onStartCooking?: () => void;
  onSaveMenu?: () => Promise<void>;
  onEdit?: () => void;
  saveMenuStatus?: SaveMenuStatus;
  saveMenuMessage?: string;
  t: AppText;
}) {
  const keys = Object.keys(blocks);
  const hasResult = keys.length > 0;
  const canStartCooking = Boolean(blocks.PASOS || blocks.STEPS);
  const resultSummary = buildResultSummary(blocks, keys, lang ?? "es");

  function copyText() {
    if (typeof window === "undefined" || !navigator.clipboard) return;

    navigator.clipboard.writeText(buildText(blocks));
    alert(lang === "es" ? "Copiado" : lang === "fi" ? "Kopioitu" : "Copied");
  }

  function shareWhatsApp() {
    if (typeof window === "undefined") return;

    const url = `https://wa.me/?text=${encodeURIComponent(buildText(blocks))}`;
    window.open(url, "_blank");
  }

  return (
    <div className={ds.layout.resultContainer}>
      <ResultHero
        actions={{
          onCopy: copyText,
          onSave: onSaveMenu,
          onShare: shareWhatsApp,
          onStartCooking: canStartCooking ? onStartCooking : undefined,
        }}
        animal={animal}
        context={context}
        cut={cut}
        doneness={doneness}
        hasResult={hasResult}
        lang={lang}
        onEdit={onEdit}
        saveMenuStatus={saveMenuStatus}
        summary={resultSummary}
        t={{
          copy: t.copy,
          save: lang === "es" ? "Guardar" : lang === "fi" ? "Tallenna" : "Save",
          saving: lang === "es" ? "Guardando..." : lang === "fi" ? "Tallennetaan..." : "Saving...",
          share: lang === "es" ? "Compartir" : lang === "fi" ? "Jaa" : "Share",
          startCooking:
            lang === "es"
              ? "Iniciar coccion en vivo"
              : lang === "fi"
                ? "Aloita live-kypsennys"
                : "Start Live Cooking",
        }}
      />

      {saveMenuMessage && (
        <div
          className={
            saveMenuStatus === "error"
              ? "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200 shadow-lg shadow-black/10"
              : "rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200 shadow-lg shadow-black/10"
          }
        >
          <div className="flex items-start gap-3">
            <span
              className={
                saveMenuStatus === "error"
                  ? "mt-1 h-2 w-2 rounded-full bg-red-300"
                  : "mt-1 h-2 w-2 rounded-full bg-emerald-300"
              }
            />
            <span>{saveMenuMessage}</span>
          </div>
        </div>
      )}

      <ResultGrid
        blocks={blocks}
        checkedItems={checkedItems}
        equipment={equipment}
        keys={keys}
        lang={lang}
        loading={loading}
        setCheckedItems={setCheckedItems}
        t={t}
      />
    </div>
  );
}

export function PrimaryButton({
  className = "",
  onClick,
  loading,
  text,
  loadingText,
}: {
  className?: string;
  onClick: () => void;
  loading: boolean;
  text: string;
  loadingText: string;
}) {
  return (
    <Button
      fullWidth
      onClick={onClick}
      disabled={loading}
      className={`inline-flex min-h-[3.25rem] touch-manipulation items-center justify-center gap-2 px-5 py-4 font-bold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-85 disabled:active:scale-100 ${className}`}
    >
      {loading ? (
        <>
          <span
            className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-black/25 border-t-black"
            aria-hidden
          />
          <span className="tabular-nums">{loadingText}</span>
        </>
      ) : (
        text
      )}
    </Button>
  );
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={ds.input.label}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={ds.input.field}
      />
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}) {
  return (
    <div>
      <label className={ds.input.label}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={ds.input.field}>
        {options.map((item) => (
          <option
            key={typeof item === "string" ? item : item.value}
            value={typeof item === "string" ? item : item.value}
          >
            {typeof item === "string" ? item : item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
