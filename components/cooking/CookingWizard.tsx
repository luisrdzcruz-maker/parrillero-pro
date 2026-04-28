"use client";

import ResultGrid from "@/components/ResultGrid";
import ResultHero from "@/components/ResultHero";
import FoodCard from "@/components/FoodCard";
import { Badge, Button, Section } from "@/components/ui";
import type { Mode } from "@/components/navigation/AppHeader";
import { ds } from "@/lib/design-system";
import type { AppText, Lang } from "@/lib/i18n/texts";
import { animalOptions, type Animal } from "@/lib/media/animalMedia";
import Image from "next/image";
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

const foodImages: Record<Animal, string> = {
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
  setEquipment,
  setMode,
  setThickness,
  setWeight,
  showThickness,
  t,
  thickness,
  weight,
}: {
  animal: Animal;
  blocks: Blocks;
  checkedItems: Record<string, boolean>;
  cookingStep: CookingWizardStep;
  currentDonenessOptions: SelectOption[];
  cut: string;
  cuts: CutItem[];
  doneness: string;
  equipment: string;
  generateCookingPlan: () => Promise<void>;
  getAnimalPreview: (animal: Animal, lang: Lang) => string;
  handleAnimalChange: (animal: Animal) => void;
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
  setEquipment: (value: string) => void;
  setMode: (mode: Mode) => void;
  setThickness: (value: string) => void;
  setWeight: (value: string) => void;
  showThickness: boolean;
  t: AppText;
  thickness: string;
  weight: string;
}) {
  const hasCookingResult = Object.keys(blocks).length > 0;
  const visibleCookingStep =
    cookingStep === "result" && !hasCookingResult
      ? selectedCut
        ? "details"
        : cut
          ? "cut"
          : "animal"
      : cookingStep;

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
            onBack={() => setCookingStep("animal")}
            onSelectCut={handleCutChange}
            t={t}
          />
        ) : visibleCookingStep === "details" && selectedCut ? (
          <CookingDetailsStep
            animal={animal}
            currentDonenessOptions={currentDonenessOptions}
            doneness={doneness}
            equipment={equipment}
            generateCookingPlan={generateCookingPlan}
            loading={loading}
            onBack={() => setCookingStep("cut")}
            selectedCut={selectedCut}
            setDoneness={setDoneness}
            setEquipment={setEquipment}
            setThickness={setThickness}
            setWeight={setWeight}
            showThickness={showThickness}
            t={t}
            thickness={thickness}
            weight={weight}
          />
        ) : visibleCookingStep === "result" ? (
          <CookingResultStep
            animal={animal}
            blocks={blocks}
            checkedItems={checkedItems}
            equipment={equipment}
            onEdit={() => setCookingStep("details")}
            onSaveMenu={onSaveMenu}
            saveMenuMessage={saveMenuMessage}
            saveMenuStatus={saveMenuStatus}
            setCheckedItems={setCheckedItems}
            setMode={setMode}
            t={t}
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
  animal: Animal;
  getAnimalPreview: (animal: Animal, lang: Lang) => string;
  lang: Lang;
  onSelectAnimal: (animal: Animal) => void;
  t: AppText;
}) {
  return (
    <Section className="animate-[fadeIn_220ms_ease-out] space-y-6 sm:space-y-7" title="¿Qué quieres cocinar?">
      <p className="-mt-3 max-w-xl text-sm font-medium leading-6 text-slate-300 sm:text-base">
        Elige el ingrediente principal y Parrillero Pro ajusta cortes, fuego y tiempos.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5">
        {animalOptions.map((item) => (
          <FoodCard
            key={item}
            selected={animal === item}
            title={item}
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
    <div className="flex min-h-12 items-center">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-sm font-black text-slate-100 shadow-lg shadow-black/10 transition-all duration-200 hover:bg-white/[0.08] active:scale-[0.97]"
      >
        <span className="text-lg leading-none">←</span>
        <span className="truncate">{backLabel}</span>
      </button>
    </div>
  );
}

function CookingCutStep({
  animal,
  cut,
  cuts,
  onBack,
  onSelectCut,
  t,
}: {
  animal: Animal;
  cut: string;
  cuts: CutItem[];
  onBack: () => void;
  onSelectCut: (cut: string) => void;
  t: AppText;
}) {
  return (
    <section className="animate-[fadeIn_220ms_ease-out] space-y-5 sm:space-y-7">
      <AppTopBar backLabel={animal} onBack={onBack} />

      <div className="max-w-2xl">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-300/75">
          Categoría
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
          {t.chooseCut}
        </h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-400 sm:text-base">
          Selecciona el corte para ajustar fuego y tiempos.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
        {cuts.map((item) => (
          <CutCard
            key={item.id}
            active={cut === item.id}
            cut={item}
            badge={undefined}
            activeLabel={t.active}
            onClick={() => onSelectCut(item.id)}
          />
        ))}
      </div>
    </section>
  );
}

function CookingDetailsStep({
  animal,
  currentDonenessOptions,
  doneness,
  equipment,
  generateCookingPlan,
  loading,
  onBack,
  selectedCut,
  setDoneness,
  setEquipment,
  setThickness,
  setWeight,
  showThickness,
  t,
  thickness,
  weight,
}: {
  animal: Animal;
  currentDonenessOptions: SelectOption[];
  doneness: string;
  equipment: string;
  generateCookingPlan: () => Promise<void>;
  loading: boolean;
  onBack: () => void;
  selectedCut: CutItem;
  setDoneness: (value: string) => void;
  setEquipment: (value: string) => void;
  setThickness: (value: string) => void;
  setWeight: (value: string) => void;
  showThickness: boolean;
  t: AppText;
  thickness: string;
  weight: string;
}) {
  return (
    <section className="mx-auto max-w-2xl animate-[fadeIn_220ms_ease-out] space-y-5 sm:space-y-7">
      <AppTopBar backLabel={selectedCut.name} onBack={onBack} />

      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-300/75">
          {animal}
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
          Ajusta los detalles
        </h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-400 sm:text-base">
          Define punto, grosor y equipo para calcular tiempos precisos.
        </p>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/25 sm:p-5">
        <h2 className="text-lg font-black text-white">{selectedCut.name}</h2>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">{selectedCut.description}</p>
      </div>

      <div className="space-y-4">
        <Input label={t.weight} value={weight} onChange={setWeight} placeholder="Ej: 1.2" />

        {showThickness && (
          <Input
            label={t.thickness}
            value={thickness}
            onChange={setThickness}
            placeholder="Ej: 5"
          />
        )}

        {currentDonenessOptions.length > 0 && (
          <Select
            label={t.doneness}
            value={doneness}
            onChange={setDoneness}
            options={currentDonenessOptions}
          />
        )}
        <Select
          label={t.equipment}
          value={equipment}
          onChange={setEquipment}
          options={equipmentOptions}
        />
      </div>

      <PrimaryButton
        onClick={generateCookingPlan}
        loading={loading}
        text={t.generatePlan}
        loadingText={t.generating}
      />
    </section>
  );
}

function CookingResultStep({
  animal,
  blocks,
  checkedItems,
  equipment,
  onEdit,
  onSaveMenu,
  saveMenuMessage,
  saveMenuStatus,
  setCheckedItems,
  setMode,
  t,
}: {
  animal: Animal;
  blocks: Blocks;
  checkedItems: Record<string, boolean>;
  equipment: string;
  onEdit: () => void;
  onSaveMenu: () => Promise<void>;
  saveMenuMessage: string;
  saveMenuStatus: SaveMenuStatus;
  setCheckedItems: (value: Record<string, boolean>) => void;
  setMode: (mode: Mode) => void;
  t: AppText;
}) {
  return (
    <div className="space-y-4">
      <ResultCards
        blocks={blocks}
        context={`${animal} · ${equipment}`}
        loading={false}
        checkedItems={checkedItems}
        onEdit={onEdit}
        onSaveMenu={onSaveMenu}
        saveMenuMessage={saveMenuMessage}
        saveMenuStatus={saveMenuStatus}
        setCheckedItems={setCheckedItems}
        onStartCooking={() => {
          setMode("cocina");
        }}
        t={t}
      />
    </div>
  );
}

export function ResultCards({
  blocks,
  context,
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
  blocks: Blocks;
  context?: string;
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

  function copyText() {
    if (typeof window === "undefined" || !navigator.clipboard) return;

    navigator.clipboard.writeText(buildText(blocks));
    alert("Copiado");
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
        context={context}
        hasResult={hasResult}
        onEdit={onEdit}
        saveMenuStatus={saveMenuStatus}
        t={{
          copy: t.copy,
          result: t.result,
          save: "Guardar",
          saving: "Guardando...",
          share: "Compartir",
          startCooking: "Empezar Live Cooking",
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
        keys={keys}
        loading={loading}
        setCheckedItems={setCheckedItems}
        t={t}
      />
    </div>
  );
}

function CutCard({
  active,
  cut,
  badge,
  activeLabel,
  onClick,
}: {
  active: boolean;
  cut: CutItem;
  badge?: string;
  activeLabel: string;
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
      <div className="relative aspect-[4/5] overflow-hidden">
        {!showImage && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_16%,rgba(255,106,0,0.30),transparent_34%),radial-gradient(circle_at_82%_0%,rgba(251,146,60,0.12),transparent_28%),linear-gradient(145deg,#18181b_0%,#09090b_48%,#000000_100%)]" />
        )}
        {showImage && (
          <Image
            src={cut.image}
            alt={cut.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 50vw"
            className="object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/78 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,106,0,0.18),transparent_34%)]" />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent opacity-50" />
        <div
          className={
            active
              ? "absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-300 via-[#FF6A00] to-amber-300"
              : "absolute inset-x-0 bottom-0 h-px bg-white/10"
          }
        />

        {badge && (
          <Badge
            className="absolute left-2 top-2 z-10 text-[9px] shadow-lg shadow-black/20 backdrop-blur-md sm:left-3 sm:top-3 sm:text-[11px]"
            tone="glass"
          >
            {badge}
          </Badge>
        )}
        {active && (
          <span
            className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6A00] text-xs font-black leading-none text-black shadow-lg shadow-orange-500/50 ring-2 ring-white/25 sm:right-3 sm:top-3"
            title={activeLabel}
            aria-label={activeLabel}
          >
            ✓
          </span>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <h3 className="line-clamp-2 text-lg font-black leading-5 tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)] sm:text-2xl sm:leading-tight">
            {cut.name}
          </h3>
          <p className="mt-1 line-clamp-2 max-w-[24rem] text-[11px] font-medium leading-4 text-slate-200/80 sm:mt-2 sm:text-sm sm:leading-5">
            {cut.description}
          </p>
        </div>
      </div>
    </button>
  );
}

export function PrimaryButton({
  onClick,
  loading,
  text,
  loadingText,
}: {
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
      className="inline-flex min-h-[3.25rem] touch-manipulation items-center justify-center gap-2 px-5 py-4 font-bold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-85 disabled:active:scale-100"
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
