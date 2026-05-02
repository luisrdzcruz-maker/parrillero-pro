"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { GeneratedAnimalId, GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import { CutBottomSheet } from "./CutBottomSheet";
import { CutList } from "./CutList";
import { CutMap } from "./CutMap";
import { CutViewToggle } from "./CutViewToggle";
import { IntentSelector } from "./IntentSelector";
import { QuickPicks } from "./QuickPicks";
import {
  filterCutsByIntent,
  getCategoryLabel,
  getCategoryGroups,
  getCutsByAnimal,
  getCutsByAnimalAndCategory,
} from "./cutProfileSelectors";
import type { CutIntent, CutSelectionScreenProps, CutViewMode } from "./cutSelectionTypes";
import { getAnimalLabel, getAnimalLabels, getIntentLabel } from "./cutSelectionTypes";

function buildCookingWizardHref(profile: GeneratedCutProfile) {
  const params = new URLSearchParams({
    mode: "coccion",
    step: "details",
    animal: profile.animalId,
    cutId: profile.id,
  });

  if (profile.defaultDoneness) {
    params.set("doneness", profile.defaultDoneness);
  }

  if (profile.showThickness && Number.isFinite(profile.defaultThicknessCm)) {
    params.set("thickness", `${profile.defaultThicknessCm}`);
  }

  return `/?${params.toString()}`;
}

export function CutSelectionScreen({
  selectedAnimal,
  lang,
  intentFilter = null,
  selectedCutId,
  onStartCooking,
  onPreviewCutChange,
  onAnimalChange,
  isAnimalPreselected = true,
}: CutSelectionScreenProps) {
  const router = useRouter();
  const [intentState, setIntentState] = useState<{
    sourceFilter: CutIntent | null;
    selectedIntent: CutIntent | null;
  }>({
    sourceFilter: intentFilter,
    selectedIntent: intentFilter,
  });
  const [viewMode, setViewMode] = useState<CutViewMode>("list");
  const [zoneState, setZoneState] = useState<{
    sourceAnimal: CutSelectionScreenProps["selectedAnimal"];
    selectedZone: string | null;
  }>({
    sourceAnimal: selectedAnimal,
    selectedZone: null,
  });
  const [localSelectedCutId, setLocalSelectedCutId] = useState<string | null>(null);

  const selectedIntent =
    intentState.sourceFilter === intentFilter ? intentState.selectedIntent : intentFilter;
  const selectedZone =
    zoneState.sourceAnimal === selectedAnimal ? zoneState.selectedZone : null;
  const effectiveSelectedCutId = selectedCutId ?? localSelectedCutId;
  const selectedProfile = useMemo(
    () =>
      effectiveSelectedCutId
        ? getCutsByAnimal(selectedAnimal).find((profile) => profile.id === effectiveSelectedCutId) ?? null
        : null,
    [effectiveSelectedCutId, selectedAnimal],
  );
  const effectiveLang = lang ?? "en";
  const animalOptions = Object.entries(getAnimalLabels(effectiveLang)) as [GeneratedAnimalId, string][];

  const handleIntentChange = (nextIntent: CutIntent | null) => {
    setIntentState({
      sourceFilter: intentFilter,
      selectedIntent: nextIntent,
    });
  };
  const handleZoneChange = (nextZone: string | null) => {
    setZoneState({
      sourceAnimal: selectedAnimal,
      selectedZone: nextZone,
    });
  };
  const handleProfileChange = (nextProfile: GeneratedCutProfile | null) => {
    setLocalSelectedCutId(nextProfile?.id ?? null);
    onPreviewCutChange?.(nextProfile?.id ?? null);
  };

  const visibleProfiles = useMemo(() => {
    const animalCuts = selectedZone
      ? getCutsByAnimalAndCategory(selectedAnimal, selectedZone)
      : getCutsByAnimal(selectedAnimal);
    return filterCutsByIntent(animalCuts, selectedIntent);
  }, [selectedAnimal, selectedIntent, selectedZone]);

  const groupedProfiles = useMemo(
    () => getCategoryGroups(visibleProfiles, effectiveLang),
    [effectiveLang, visibleProfiles],
  );
  const activeFilterLabel =
    selectedIntent
      ? getIntentLabel(selectedIntent, effectiveLang)
      : effectiveLang === "es"
        ? "Todos los objetivos"
        : effectiveLang === "fi"
          ? "Kaikki tavoitteet"
          : "All goals";
  const sectionTitle =
    effectiveLang === "es" ? "Selección de cortes" : effectiveLang === "fi" ? "Leikkausvalinta" : "Cut selection";
  const selectionOptimizedLabel =
    effectiveLang === "es"
      ? `Sugerencias optimizadas para ${getAnimalLabel(selectedAnimal, effectiveLang)}`
      : effectiveLang === "fi"
        ? `Suositukset optimoitu: ${getAnimalLabel(selectedAnimal, effectiveLang)}`
        : `Suggestions optimized for ${getAnimalLabel(selectedAnimal, effectiveLang)}`;
  const compactHeading = isAnimalPreselected
    ? effectiveLang === "es"
      ? "Elige tu corte"
      : effectiveLang === "fi"
        ? "Valitse leikkaus"
        : "Choose your cut"
    : effectiveLang === "es"
      ? "Elige qué vas a cocinar"
      : effectiveLang === "fi"
        ? "Valitse mitä kokkaat"
        : "Choose what you are cooking";
  const compactHelper = isAnimalPreselected
    ? effectiveLang === "es"
      ? "Filtra rápido y toca un corte para ver detalles."
      : effectiveLang === "fi"
        ? "Suodata nopeasti ja avaa tiedot napauttamalla leikkausta."
        : "Filter quickly, then tap a cut to preview details."
    : effectiveLang === "es"
      ? "Empieza con animal y objetivo, luego selecciona un corte."
      : effectiveLang === "fi"
        ? "Aloita eläimestä ja tavoitteesta, valitse sitten leikkaus."
        : "Start with animal and goal, then choose a cut.";
  const hasActiveFilters = Boolean(selectedIntent || selectedZone);
  const handleStartCooking = (profile: GeneratedCutProfile) => {
    if (onStartCooking) {
      onStartCooking(profile);
      return;
    }

    router.push(buildCookingWizardHref(profile));
  };
  const handleResetFilters = () => {
    handleIntentChange(null);
    handleZoneChange(null);
  };
  const handleAnimalSelect = (nextAnimal: GeneratedAnimalId) => {
    if (!onAnimalChange || nextAnimal === selectedAnimal) return;
    onAnimalChange(nextAnimal);
  };

  return (
    <main className="relative min-h-full w-full max-w-full overflow-x-hidden bg-[#030201] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[320px] w-[320px] rounded-full bg-orange-500/14 blur-[110px]" />
        <div className="absolute right-[-180px] top-16 h-[280px] w-[280px] rounded-full bg-red-600/10 blur-[120px]" />
      </div>

      <section className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 lg:pb-36">
        <header className="rounded-[1.4rem] border border-orange-300/15 bg-white/[0.045] p-3 shadow-[0_20px_72px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex rounded-full border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-200">
                {sectionTitle}
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-[2rem]">{compactHeading}</h1>
              <p className="mt-1 text-xs font-semibold leading-5 text-zinc-400 sm:text-sm">{compactHelper}</p>
            </div>
            <div className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs font-black text-zinc-300">
              <span className="text-zinc-500">{effectiveLang === "es" ? "Animal:" : effectiveLang === "fi" ? "Eläin:" : "Animal:"}</span>{" "}
              <span className="text-orange-300">{getAnimalLabel(selectedAnimal, effectiveLang)}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {animalOptions.map(([animalId, label]) => {
              const selected = animalId === selectedAnimal;
              return (
                <button
                  key={animalId}
                  type="button"
                  onClick={() => handleAnimalSelect(animalId)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-black transition active:scale-[0.98] ${
                    selected
                      ? "border-orange-400/65 bg-orange-500/20 text-orange-200"
                      : "border-white/15 bg-white/5 text-zinc-200 hover:border-orange-300/40 hover:bg-orange-500/10"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-zinc-400">
            <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1">
              {visibleProfiles.length} {effectiveLang === "es" ? "cortes" : effectiveLang === "fi" ? "leikkausta" : "cuts"}
            </span>
            <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1">{activeFilterLabel}</span>
            {selectedZone && (
              <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-2.5 py-1 text-orange-200">
                {getCategoryLabel(selectedZone, effectiveLang)}
              </span>
            )}
            <span className="text-orange-200">{selectionOptimizedLabel}</span>
          </div>
        </header>

        <div className="mt-3 space-y-3">
          <IntentSelector lang={effectiveLang} selectedIntent={selectedIntent} onIntentChange={handleIntentChange} />
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <CutViewToggle lang={effectiveLang} value={viewMode} onChange={setViewMode} />
            {selectedZone && (
              <button
                type="button"
                onClick={() => handleZoneChange(null)}
                className="w-full rounded-2xl border border-orange-400/25 bg-orange-500/10 px-4 py-3 text-xs font-black text-orange-200 transition active:scale-[0.98] sm:w-auto"
              >
                {effectiveLang === "es"
                  ? `Limpiar zona: ${getCategoryLabel(selectedZone, effectiveLang)}`
                  : effectiveLang === "fi"
                    ? `Tyhjennä alue: ${getCategoryLabel(selectedZone, effectiveLang)}`
                    : `Clear zone: ${getCategoryLabel(selectedZone, effectiveLang)}`}
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 grid min-w-0 gap-4 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-4">
            <QuickPicks
              animal={selectedAnimal}
              intent={selectedIntent}
              lang={effectiveLang}
              selectedCutId={selectedProfile?.id}
              onSelect={handleProfileChange}
            />

            {viewMode === "map" && (
              <CutMap
                animal={selectedAnimal}
                lang={effectiveLang}
                selectedZone={selectedZone}
                onZoneChange={handleZoneChange}
              />
            )}
            <CutList
              groups={groupedProfiles}
              lang={effectiveLang}
              selectedCutId={selectedProfile?.id}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleResetFilters}
              onSelect={handleProfileChange}
            />
          </div>
          <aside className="hidden min-w-0 max-w-full lg:sticky lg:top-4 lg:block lg:self-start">
            <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.035] p-3 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                {effectiveLang === "es" ? "Selección activa" : effectiveLang === "fi" ? "Aktiivinen valinta" : "Current selection"}
              </p>
              <p className="mt-2 text-sm font-black text-white">{getAnimalLabel(selectedAnimal, effectiveLang)}</p>
              <p className="mt-1 text-xs font-semibold text-zinc-500">
                {activeFilterLabel} · {visibleProfiles.length}{" "}
                {effectiveLang === "es" ? "cortes" : effectiveLang === "fi" ? "leikkausta" : "cuts"}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <CutBottomSheet
        profile={selectedProfile}
        lang={effectiveLang}
        onClose={() => handleProfileChange(null)}
        onStartCooking={handleStartCooking}
      />
    </main>
  );
}
