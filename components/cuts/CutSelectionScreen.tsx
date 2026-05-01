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
  getCategoryGroups,
  getCutsByAnimal,
  getCutsByAnimalAndCategory,
} from "./cutProfileSelectors";
import type { CutIntent, CutSelectionScreenProps, CutViewMode } from "./cutSelectionTypes";
import { animalLabels, intentLabels } from "./cutSelectionTypes";

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
  onStartCooking,
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
  const [profileState, setProfileState] = useState<{
    sourceAnimal: CutSelectionScreenProps["selectedAnimal"];
    selectedProfile: GeneratedCutProfile | null;
  }>({
    sourceAnimal: selectedAnimal,
    selectedProfile: null,
  });

  const selectedIntent =
    intentState.sourceFilter === intentFilter ? intentState.selectedIntent : intentFilter;
  const selectedZone =
    zoneState.sourceAnimal === selectedAnimal ? zoneState.selectedZone : null;
  const selectedProfile =
    profileState.sourceAnimal === selectedAnimal ? profileState.selectedProfile : null;
  const animalOptions = Object.entries(animalLabels) as [GeneratedAnimalId, string][];

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
    setProfileState({
      sourceAnimal: selectedAnimal,
      selectedProfile: nextProfile,
    });
  };

  const visibleProfiles = useMemo(() => {
    const animalCuts = selectedZone
      ? getCutsByAnimalAndCategory(selectedAnimal, selectedZone)
      : getCutsByAnimal(selectedAnimal);
    return filterCutsByIntent(animalCuts, selectedIntent);
  }, [selectedAnimal, selectedIntent, selectedZone]);

  const groupedProfiles = useMemo(() => getCategoryGroups(visibleProfiles), [visibleProfiles]);
  const activeFilterLabel = selectedIntent ? intentLabels[selectedIntent] : "All goals";
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
        <div className="absolute -left-32 -top-36 h-[420px] w-[420px] rounded-full bg-orange-500/20 blur-[110px]" />
        <div className="absolute right-[-180px] top-32 h-[380px] w-[380px] rounded-full bg-red-600/15 blur-[120px]" />
        <div className="absolute bottom-[-220px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[150px]" />
      </div>

      <section className="relative mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:px-8 lg:pb-36">
        <header className="rounded-[2rem] border border-orange-300/15 bg-white/[0.045] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="inline-flex rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-orange-200">
            Cut selection
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_300px] lg:items-end">
            <div>
              <h1 className="text-[clamp(2.25rem,12vw,5.5rem)] font-black leading-[0.9] tracking-[-0.06em]">
                {isAnimalPreselected ? "Choose your cut first." : "Choose what you are cooking."}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
                {isAnimalPreselected
                  ? "Pick a cut, see why it fits, then review details before live cooking starts."
                  : "Start by choosing an animal or category, then pick a cut and continue to details."}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Animal</p>
              <p className="mt-2 text-2xl font-black text-orange-300">{animalLabels[selectedAnimal]}</p>
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
                          ? "border-orange-400/60 bg-orange-500/20 text-orange-200"
                          : "border-white/15 bg-white/5 text-zinc-200 hover:border-orange-300/40 hover:bg-orange-500/10"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {visibleProfiles.length} cuts · {activeFilterLabel}
              </p>
              {!isAnimalPreselected && (
                <p className="mt-2 text-xs font-semibold text-orange-200">
                  Choose what you are cooking to unlock the best cuts.
                </p>
              )}
            </div>
          </div>
        </header>

        <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-[340px_1fr]">
          <aside className="min-w-0 max-w-full space-y-4 lg:sticky lg:top-5 lg:self-start">
            <IntentSelector selectedIntent={selectedIntent} onIntentChange={handleIntentChange} />
            <QuickPicks
              animal={selectedAnimal}
              intent={selectedIntent}
              selectedCutId={selectedProfile?.id}
              onSelect={handleProfileChange}
            />
            <CutViewToggle value={viewMode} onChange={setViewMode} />
            {selectedZone && (
              <button
                type="button"
                onClick={() => handleZoneChange(null)}
                className="w-full rounded-2xl border border-orange-400/25 bg-orange-500/10 px-4 py-3 text-xs font-black text-orange-200 transition active:scale-[0.98]"
              >
                Clear zone: {selectedZone}
              </button>
            )}
          </aside>

          <div className="min-w-0 space-y-4">
            {viewMode === "map" && (
              <CutMap animal={selectedAnimal} selectedZone={selectedZone} onZoneChange={handleZoneChange} />
            )}
            <CutList
              groups={groupedProfiles}
              selectedCutId={selectedProfile?.id}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleResetFilters}
              onSelect={handleProfileChange}
            />
          </div>
        </div>
      </section>

      <CutBottomSheet
        profile={selectedProfile}
        lang={lang}
        onClose={() => handleProfileChange(null)}
        onStartCooking={handleStartCooking}
      />
    </main>
  );
}
