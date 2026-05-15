"use client";

import ResultGrid, { buildResultSummary } from "@/components/ResultGrid";
import ResultHero from "@/components/ResultHero";
import FoodCard from "@/components/FoodCard";
import { CookingLoadingScreen } from "@/components/cooking/CookingLoadingScreen";
import { BrandImageIcon } from "@/components/ui/BrandImageIcon";
import { resolveEquipmentIconKey } from "@/lib/assets/equipmentMethodIconResolver";
import { categoryIconAssets } from "@/lib/brand/categoryIconAssets";
import { cutIconAssets } from "@/lib/brand/cutIconAssets";
import { getInputProfileForCut } from "@/lib/cooking/inputProfiles";
import { getCutById } from "@/lib/cookingRules";
import { AppIcon, Badge, Button, Section } from "@/components/ui";
import { CutIdentityHeader, CutMetaChip } from "@/components/cuts/CutFlowPrimitives";
import { getCutSelectionIconPath } from "@/components/cuts/cutSelectionIconResolver";
import { ds } from "@/lib/design-system";
import {
  getAnimalSurfaceLabel,
  getDetailsSetupLabels,
  getDonenessSurfaceLabel,
  getEquipmentSurfaceLabel,
} from "@/lib/i18n/surfaceFallbacks";
import { formatPrepGuidance, getPlanPrepGuidance, getPrepGuidanceForCut } from "@/lib/prepGuidance";
import type { AppText, Lang } from "@/lib/i18n/texts";
import {
  createLiveCookingPayload,
  readLiveCookingPayload,
  saveLiveCookingPayload,
  type LiveCookingPlanPayload,
} from "@/lib/liveCookingPlan";
import { buildLiveUrl } from "@/lib/navigation/buildLiveUrl";
import { shouldShowDonenessSelectorForCut } from "@/lib/temperatureModeProfiles";
import { animalIdsByLabel, animalOptions, type AnimalLabel } from "@/lib/media/animalMedia";
import type { CookingStyle, DonenessId, ProductCut } from "@/lib/cookingCatalog";
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
const LIVE_DONENESS_VALUES: DonenessId[] = [
  "rare",
  "medium_rare",
  "medium",
  "medium_well",
  "well_done",
  "juicy_safe",
  "medium_safe",
  "safe",
  "juicy",
];

export type CookingSizePreset = "small" | "medium" | "large";
export type CookingWeightRange = "light" | "medium" | "large";
export type VegetableFormat = "whole" | "halved" | "slices";

function toLiveDoneness(value: string): DonenessId | undefined {
  return LIVE_DONENESS_VALUES.includes(value as DonenessId) ? (value as DonenessId) : undefined;
}

const foodImages: Record<AnimalLabel, string> = {
  Vacuno: "/images/vacuno/ribeye-cooked.webp",
  Cerdo: "/images/cerdo/secreto-cooked.webp",
  Pollo: "/images/pollo/muslos-cooked.webp",
  Pescado: "/images/pescado/salmon-cooked.webp",
  Verduras: "/images/verduras/verduras-asadas.webp",
};

function getCategoryIconForAnimalLabel(label: AnimalLabel) {
  const animalId = animalIdsByLabel[label];
  return animalId in categoryIconAssets
    ? categoryIconAssets[animalId as keyof typeof categoryIconAssets]
    : undefined;
}

function getCutIconAsset(cutId: string) {
  return cutId in cutIconAssets ? cutIconAssets[cutId as keyof typeof cutIconAssets] : undefined;
}

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
        {animalOptions.map((item) => {
          const title = getAnimalSurfaceLabel(item, lang);
          return (
            <FoodCard
              key={item}
              selected={animal === item}
              title={title}
              subtitle={getAnimalPreview(item, lang)}
              image={foodImages[item]}
              iconSrc={getCategoryIconForAnimalLabel(item)}
              iconAlt={title}
              badge={undefined}
              selectedLabel={t.selected}
              onClick={() => onSelectAnimal(item)}
            />
          );
        })}
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
      /* allow-arbitrary: pre-slice-a */
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-lg font-black leading-none text-white shadow-lg shadow-black/20 backdrop-blur transition-all duration-200 hover:bg-white/12 active:scale-95"
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
  const cutIcon = getCutIconAsset(cut.id);
  const tags = deriveCutTags(cut.name);

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          /* allow-arbitrary: pre-slice-a */
          ? "group relative w-full touch-manipulation select-none overflow-hidden rounded-[1.75rem] border border-orange-300/90 bg-zinc-950 text-left shadow-[0_22px_64px_rgba(255,106,0,0.30)] ring-2 ring-orange-400/35 transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 active:scale-[0.99]"
          /* allow-arbitrary: pre-slice-a */
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

        {cutIcon && (
          <BrandImageIcon
            src={cutIcon}
            alt={cut.name}
            size="xl"
            shape="soft"
            /* allow-arbitrary: pre-slice-a */
            className="absolute left-3 top-3 z-10 h-16 w-16 rounded-[1.25rem] bg-black/45 shadow-lg shadow-black/30 backdrop-blur-sm sm:h-20 sm:w-20"
          />
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 lg:max-w-[65%]">
          {/* Featured badge + tags */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {/* allow-arbitrary: pre-slice-a */}
            <span className="rounded-full border border-orange-400/35 bg-orange-500/18 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
              ⭐ Recomendado para empezar
            </span>
            {tags.map((tag) => (
              <span
                key={tag}
                /* allow-arbitrary: pre-slice-a */
                className="rounded-full border border-white/12 bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white/55 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* allow-arbitrary: pre-slice-a */}
          <h3 className="text-2xl font-black leading-tight tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] sm:text-3xl">
            {cut.name}
          </h3>
          {/* allow-arbitrary: pre-slice-a */}
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
  const cutIcon = getCutIconAsset(cut.id);

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          /* allow-arbitrary: pre-slice-a */
          ? "group relative touch-manipulation select-none overflow-hidden rounded-[1.75rem] border border-orange-300/90 bg-zinc-950 text-left shadow-[0_22px_64px_rgba(255,106,0,0.30)] ring-2 ring-orange-400/35 transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 active:scale-[0.98]"
          /* allow-arbitrary: pre-slice-a */
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
            /* allow-arbitrary: pre-slice-a */
            className="absolute left-2 top-2 z-10 text-[9px] shadow-lg shadow-black/20 backdrop-blur-md sm:left-3 sm:top-3 sm:text-[11px]"
            tone="glass"
          >
            {badge}
          </Badge>
        )}

        {!badge && cutIcon && (
          <BrandImageIcon
            src={cutIcon}
            alt={cut.name}
            size="lg"
            shape="soft"
            /* allow-arbitrary: pre-slice-a */
            className="absolute left-2 top-2 z-10 h-12 w-12 rounded-[1.05rem] bg-black/45 shadow-lg shadow-black/30 backdrop-blur-sm sm:left-3 sm:top-3 sm:h-14 sm:w-14"
          />
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
                  /* allow-arbitrary: pre-slice-a */
                  className="rounded-full border border-white/10 bg-black/45 px-1.5 py-0.5 text-[10px] font-bold text-white/55 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* allow-arbitrary: pre-slice-a */}
          <h3 className="line-clamp-2 text-lg font-black leading-5 tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)] sm:text-2xl sm:leading-tight">
            {cut.name}
          </h3>
          {/* allow-arbitrary: pre-slice-a */}
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
        {/* allow-arbitrary: pre-slice-a */}
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-300/75">
          {lang === "es" ? "Categoría" : "Category"}
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
          {t.chooseCut}
        </h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-400 sm:text-base">
          {lang === "es" ? "Selecciona el corte para ajustar fuego y tiempos." : "Select the cut to tune heat and timings."}
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
          {/* allow-arbitrary: pre-slice-a */}
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">
            {lang === "es" ? "Todos los cortes" : "All cuts"}
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
  if (showWeightPreset) return lang === "es" ? "Corte critico" : "Critical cut";
  if (showAdvancedExactThickness) return lang === "es" ? "Control fino" : "Fine control";
  if (showDoneness) return lang === "es" ? "Alta precision" : "High precision";
  return lang === "es" ? "Control fino" : "Fine control";
}

function getCutPositioningLine(style: CookingStyle | undefined, lang: Lang) {
  const positioningByStyle: Record<CookingStyle, Record<Lang, string>> = {
    fast: {
      es: "Tierno / rapido / sensible al punto",
      en: "Tender / fast / point-sensitive",
    },
    thick: {
      es: "Grueso / controlado / necesita centro estable",
      en: "Thick / controlled / needs a stable center",
    },
    reverse: {
      es: "Grueso / sellado inverso / temperatura primero",
      en: "Thick / reverse sear / temperature first",
    },
    fatcap: {
      es: "Grasa / render lento / costra al final",
      en: "Fat cap / slow render / crust at the end",
    },
    lowSlow: {
      es: "Lento / tierno / calor estable",
      en: "Slow / tender / stable heat",
    },
    crispy: {
      es: "Crujiente / grasa controlada / final fuerte",
      en: "Crispy / controlled fat / strong finish",
    },
    poultry: {
      es: "Seguro / jugoso / medir centro",
      en: "Safe / juicy / check the center",
    },
    fish: {
      es: "Delicado / rapido / no sobrecocinar",
      en: "Delicate / fast / do not overcook",
    },
    vegetable: {
      es: "Vegetal / directo / textura visible",
      en: "Vegetable / direct / visual texture",
    },
  };

  return style ? positioningByStyle[style][lang] : positioningByStyle.fast[lang];
}

function CookingDetailsHero({
  animal,
  badge,
  cutMeta,
  lang,
  onBack,
  selectedCut,
}: {
  animal: AnimalLabel;
  badge: string;
  cutMeta?: ProductCut;
  lang: Lang;
  onBack: () => void;
  selectedCut: CutItem;
}) {
  const positioningLine = getCutPositioningLine(cutMeta?.style, lang);
  const cutIconSrc = getCutSelectionIconPath({ id: selectedCut.id });

  return (
    <div className="animate-live-enter">
      <CutIdentityHeader
        compact
        title={selectedCut.name}
        eyebrow={lang === "es" ? "Ajusta detalles" : "Adjust details"}
        description={positioningLine}
        iconSrc={cutIconSrc}
        chips={
          <>
            <CutMetaChip tone="accent">{badge}</CutMetaChip>
            <CutMetaChip>{getAnimalSurfaceLabel(animal, lang)}</CutMetaChip>
            {cutMeta?.restingMinutes ? <CutMetaChip>{cutMeta.restingMinutes} min</CutMetaChip> : null}
          </>
        }
        action={<DetailsBackButton label={selectedCut.name} onBack={onBack} />}
      />
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
    /* allow-arbitrary: pre-slice-a */
    <div className="rounded-[1.1rem] border border-white/[0.08] bg-white/[0.03] p-3 sm:rounded-[1.25rem] sm:p-3.5">
      {/* allow-arbitrary: pre-slice-a */}
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-orange-200/70">
        {title}
      </p>
      <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">{children}</div>
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
      {/* allow-arbitrary: pre-slice-a */}
      <label className="text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400 sm:text-[11px] sm:tracking-[0.12em]">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-sm font-semibold text-slate-100 shadow-inner shadow-black/20 outline-none transition placeholder:text-slate-600 focus:border-orange-400/55 focus:ring-2 focus:ring-orange-500/15"
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
      {/* allow-arbitrary: pre-slice-a */}
      <label className="text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400 sm:text-[11px] sm:tracking-[0.12em]">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-sm font-semibold text-slate-100 shadow-inner shadow-black/20 outline-none transition focus:border-orange-400/55 focus:ring-2 focus:ring-orange-500/15"
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

function EquipmentOptionCards({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="min-[390px]:col-span-2">
      {/* allow-arbitrary: pre-slice-a */}
      <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400 sm:text-[11px] sm:tracking-[0.12em]">
        {label}
      </p>
      <div className="mt-1 grid grid-cols-2 gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          const icon = resolveEquipmentIconKey(option.value) ?? resolveEquipmentIconKey(option.label);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={
                selected
                  /* allow-arbitrary: pre-slice-a */
                  ? "flex min-h-[48px] min-w-0 items-center gap-2 rounded-xl border border-orange-300/70 bg-orange-500/18 px-2.5 py-2 text-left text-sm font-black text-orange-50 shadow-[0_10px_28px_rgba(249,115,22,0.14)] ring-1 ring-orange-300/20 transition active:scale-[0.98]"
                  : "flex min-h-[48px] min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-2.5 py-2 text-left text-sm font-semibold text-slate-200 shadow-inner shadow-black/20 transition hover:border-orange-300/35 hover:bg-orange-500/8 active:scale-[0.98]"
              }
              aria-pressed={selected}
            >
              {icon ? (
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/28">
                  <AppIcon
                    category={icon.category}
                    iconKey={icon.key}
                    alt=""
                    size="sm"
                    aria-hidden="true"
                    className="h-5 w-5 opacity-90"
                  />
                </span>
              ) : null}
              <span className="min-w-0 truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
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
  const showDoneness =
    Boolean(cutMeta && shouldShowDonenessSelectorForCut(cutMeta)) &&
    inputProfile.showDoneness &&
    currentDonenessOptions.length > 0;
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
  const measurementsTitle = lang === "es" ? "Tamano y peso" : "Size and weight";
  const cookingTitle = lang === "es" ? "Punto y equipo" : "Doneness and gear";
  const localizedDonenessOptions = currentDonenessOptions.map((option) =>
    typeof option === "string"
      ? option
      : {
          ...option,
          label: option.label,
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
    <section className="relative mx-auto max-w-3xl animate-[fadeIn_220ms_ease-out] space-y-3 pb-4 pt-0 sm:space-y-4 sm:pb-6 sm:pt-1 lg:pb-6">
      <CookingDetailsHero
        animal={animal}
        badge={detailsHeroBadge}
        cutMeta={cutMeta}
        lang={lang}
        onBack={onBack}
        selectedCut={selectedCut}
      />

      {/* allow-arbitrary: pre-slice-a */}
      <div className="animate-live-enter relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(145deg,rgba(12,10,9,0.94),rgba(3,7,18,0.94))] p-3 shadow-[0_14px_42px_rgba(0,0,0,0.34)] ring-1 ring-inset ring-white/[0.04] [animation-delay:70ms] sm:rounded-[1.6rem] sm:p-4">
        <div className="relative space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              {/* allow-arbitrary: pre-slice-a */}
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-200/75">
                {detailsSetupText.section}
              </p>
              <h2 className="mt-0.5 text-lg font-black tracking-tight text-white sm:mt-1 sm:text-xl">
                {detailsSetupText.title}
              </h2>
            </div>
            {/* allow-arbitrary: pre-slice-a */}
            <div className="hidden rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-200 min-[390px]:block">
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
            <EquipmentOptionCards
              label={t.equipment}
              value={equipment}
              onChange={setEquipment}
              options={localizedCookingEquipmentOptions}
            />
          </DetailsFieldGroup>
        </div>
      </div>

      <div className="animate-live-enter [animation-delay:140ms]">
        <PrimaryButton
          onClick={generateCookingPlan}
          loading={loading}
          text={t.generatePlan}
          loadingText={t.generating}
          /* allow-arbitrary: pre-slice-a */
          className="min-h-[3.15rem] rounded-[1.25rem] border border-orange-200/25 shadow-[0_18px_50px_rgba(249,115,22,0.34),0_0_28px_rgba(255,106,0,0.14)] ring-1 ring-orange-300/25 hover:shadow-[0_22px_60px_rgba(249,115,22,0.42),0_0_34px_rgba(255,106,0,0.18)] sm:min-h-[3.3rem]"
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

    if (!saveLiveCookingPayload(payload)) {
      return;
    }
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
        cutId={cutId}
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
  cutId,
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
  cutId?: string;
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
  const cutMeta = cutId ? getCutById(cutId) : undefined;
  const prepGuidance = getPlanPrepGuidance(blocks) ?? (cutId ? getPrepGuidanceForCut(cutMeta ?? { id: cutId }) : undefined);
  const prepGuidanceLine = formatPrepGuidance(prepGuidance, lang);

  function copyText() {
    if (typeof window === "undefined" || !navigator.clipboard) return;

    navigator.clipboard.writeText(buildText(blocks));
    alert(lang === "es" ? "Copiado" : "Copied");
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
        resultBlocks={blocks}
        resultKeys={keys}
        hasResult={hasResult}
        lang={lang}
        onEdit={onEdit}
        saveMenuStatus={saveMenuStatus}
        summary={resultSummary}
        t={{
          copy: t.copy,
          save: lang === "es" ? "Guardar" : "Save",
          saving: lang === "es" ? "Guardando..." : "Saving...",
          share: lang === "es" ? "Compartir" : "Share",
          startCooking:
            lang === "es" ? "Iniciar coccion en vivo" : "Start Live Cooking",
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
        prepGuidanceLine={prepGuidanceLine}
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
