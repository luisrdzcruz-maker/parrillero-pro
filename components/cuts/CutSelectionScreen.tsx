"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { GeneratedAnimalId, GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import { CutBottomSheet } from "./CutBottomSheet";
import { CutList } from "./CutList";
import { CutMap } from "./CutMap";
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
}: CutSelectionScreenProps) {
  const router = useRouter();
  const [intentState, setIntentState] = useState<{
    sourceFilter: CutIntent | null;
    selectedIntent: CutIntent | null;
  }>({
    sourceFilter: intentFilter,
    selectedIntent: intentFilter,
  });
  const [zoneState, setZoneState] = useState<{
    sourceAnimal: CutSelectionScreenProps["selectedAnimal"];
    selectedZone: string | null;
  }>({
    sourceAnimal: selectedAnimal,
    selectedZone: null,
  });
  const [localSelectedCutId, setLocalSelectedCutId] = useState<string | null>(null);
  const [catalogExpanded, setCatalogExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<CutViewMode>("list");

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

  const animalProfiles = useMemo(
    () =>
      selectedZone
      ? getCutsByAnimalAndCategory(selectedAnimal, selectedZone)
      : getCutsByAnimal(selectedAnimal),
    [selectedAnimal, selectedZone],
  );
  const visibleProfiles = useMemo(
    () => filterCutsByIntent(animalProfiles, selectedIntent),
    [animalProfiles, selectedIntent],
  );
  const totalCutsByAnimal = useMemo(() => getCutsByAnimal(selectedAnimal).length, [selectedAnimal]);

  const groupedProfiles = useMemo(
    () => getCategoryGroups(animalProfiles, effectiveLang),
    [animalProfiles, effectiveLang],
  );
  const chipAnimalLabel = (animalId: GeneratedAnimalId) => {
    if (effectiveLang === "es" && animalId === "beef") return "Vaca";
    return getAnimalLabel(animalId, effectiveLang);
  };
  const activeFilterLabel =
    selectedIntent
      ? getIntentLabel(selectedIntent, effectiveLang)
      : effectiveLang === "es"
        ? "Todos los objetivos"
        : effectiveLang === "fi"
          ? "Kaikki tavoitteet"
          : "All goals";
  const compactStatusLine = `${totalCutsByAnimal} ${
    effectiveLang === "es" ? "cortes" : effectiveLang === "fi" ? "leikkausta" : "cuts"
  } · ${activeFilterLabel}`;
  const hasActiveFilters = Boolean(selectedZone);
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
    setCatalogExpanded(false);
    setViewMode("list");
    handleZoneChange(null);
    onAnimalChange(nextAnimal);
  };
  const viewAllLabel =
    effectiveLang === "es"
      ? `Ver todos los cortes de ${chipAnimalLabel(selectedAnimal).toLowerCase()} (${totalCutsByAnimal})`
      : effectiveLang === "fi"
        ? `Näytä kaikki ${chipAnimalLabel(selectedAnimal).toLowerCase()} leikkaukset (${totalCutsByAnimal})`
        : `View all ${chipAnimalLabel(selectedAnimal).toLowerCase()} cuts (${totalCutsByAnimal})`;
  const hideAllLabel =
    effectiveLang === "es" ? "Ocultar catálogo completo" : effectiveLang === "fi" ? "Piilota koko valikoima" : "Hide full catalog";

  return (
    <main className="relative min-h-full w-full max-w-full overflow-x-hidden bg-[#030201] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[320px] w-[320px] rounded-full bg-orange-500/14 blur-[110px]" />
        <div className="absolute right-[-180px] top-16 h-[280px] w-[280px] rounded-full bg-red-600/10 blur-[120px]" />
      </div>

      <section className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-2 sm:px-6 lg:pb-36">
        <header className="rounded-[1.2rem] border border-orange-300/15 bg-white/[0.04] px-2.5 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-3 sm:py-2.5">
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max items-center gap-1.5 sm:gap-2">
            {animalOptions.map(([animalId]) => {
              const selected = animalId === selectedAnimal;
              return (
                <button
                  key={animalId}
                  type="button"
                  onClick={() => handleAnimalSelect(animalId)}
                  className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-black leading-none transition active:scale-[0.98] sm:px-3 sm:text-xs ${
                    selected
                      ? "border-orange-300/80 bg-orange-500/25 text-orange-100 shadow-[0_0_0_1px_rgba(251,146,60,0.25)]"
                      : "border-white/15 bg-white/5 text-zinc-200 hover:border-orange-300/40 hover:bg-orange-500/10"
                  }`}
                >
                  {chipAnimalLabel(animalId)}
                </button>
              );
            })}
            </div>
          </div>
          <div className="mt-2 px-0.5 text-[11px] font-semibold text-zinc-400 sm:text-xs">
            <span className="truncate">{compactStatusLine}</span>
            {selectedZone && <span className="ml-1 text-orange-200">· {getCategoryLabel(selectedZone, effectiveLang)}</span>}
          </div>
        </header>

        <div className="mt-3 space-y-3">
          <IntentSelector lang={effectiveLang} selectedIntent={selectedIntent} onIntentChange={handleIntentChange} />
        </div>

        <div className="mt-3 grid min-w-0 gap-4 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-4">
            <QuickPicks
              profiles={animalProfiles}
              intent={selectedIntent}
              lang={effectiveLang}
              limit={4}
              selectedCutId={selectedProfile?.id}
              onSelect={handleProfileChange}
            />
            <button
              type="button"
              onClick={() => setCatalogExpanded((prev) => !prev)}
              className="w-full rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-left text-sm font-black text-zinc-100 transition hover:border-orange-300/45 hover:bg-orange-500/10 active:scale-[0.99]"
              aria-expanded={catalogExpanded}
            >
              {catalogExpanded ? hideAllLabel : viewAllLabel}
            </button>

            {catalogExpanded && (
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <div className="w-full max-w-full rounded-[1.2rem] border border-white/10 bg-black/30 p-1.5 backdrop-blur-xl">
                    <div className="grid w-full min-w-0 grid-cols-2 gap-1">
                      {(["list", "map"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setViewMode(mode)}
                          className={`min-w-0 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition active:scale-[0.98] ${
                            viewMode === mode
                              ? "bg-white text-black"
                              : "text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
                          }`}
                          aria-pressed={viewMode === mode}
                        >
                          {mode === "list"
                            ? effectiveLang === "es"
                              ? "Lista"
                              : effectiveLang === "fi"
                                ? "Lista"
                                : "List"
                            : effectiveLang === "es"
                              ? "Mapa"
                              : effectiveLang === "fi"
                                ? "Kartta"
                                : "Map"}
                        </button>
                      ))}
                    </div>
                  </div>
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
            )}
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
