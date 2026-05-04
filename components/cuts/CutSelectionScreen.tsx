"use client";

import { BrandImageIcon } from "@/components/ui/BrandImageIcon";
import { categoryIconAssets } from "@/lib/brand/categoryIconAssets";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { GeneratedAnimalId, GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import { CutBottomSheet } from "./CutBottomSheet";
import { CutList } from "./CutList";
import { CutMap } from "./CutMap";
import { CutViewToggle } from "./CutViewToggle";
import { IntentSelector } from "./IntentSelector";
import { QuickPicks } from "./QuickPicks";
import { normalizeCutSearchText, searchCutProfiles } from "./cutSearch";
import {
  filterCutsByIntent,
  getCategoryLabel,
  getCategoryGroups,
  getCutsByAnimal,
  getCutsByAnimalAndCategory,
} from "./cutProfileSelectors";
import type { CutIntent, CutSelectionScreenProps, CutViewMode } from "./cutSelectionTypes";
import {
  getAllGoalsLabel,
  getAnimalLabel,
  getAnimalLabels,
  getCutSearchAriaLabel,
  getCutSearchClearLabel,
  getCutSearchNoResultsMessage,
  getCutSearchNoResultsTitle,
  getCutSearchPlaceholder,
  getClearZoneLabel,
  getCompactAnimalLabel,
  getCurrentSelectionLabel,
  getCutsUnitLabel,
  getHideAllLabel,
  getIntentLabel,
  getViewAllLabel,
} from "./cutSelectionTypes";

function buildCookingWizardHref(profile: GeneratedCutProfile, lang?: "es" | "en" | "fi") {
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
  if (lang) {
    params.set("lang", lang);
  }

  return `/?${params.toString()}`;
}

function getCategoryIcon(animalId: GeneratedAnimalId) {
  return animalId in categoryIconAssets
    ? categoryIconAssets[animalId as keyof typeof categoryIconAssets]
    : undefined;
}

function FishFallbackIcon() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-orange-300/16 bg-black/35 shadow-[0_8px_22px_rgba(249,115,22,0.12)] ring-1 ring-inset ring-white/[0.035] sm:h-11 sm:w-11"
    >
      <svg viewBox="0 0 48 48" className="h-7 w-7 text-orange-300 drop-shadow-[0_0_10px_rgba(249,115,22,0.45)] sm:h-8 sm:w-8">
        <path
          d="M6 24c5.8-7.4 13.2-11.1 22.1-11.1 5.2 0 9.7 2.4 13.5 7.1l4.4-4.3v16.6L41.6 28c-3.8 4.7-8.3 7.1-13.5 7.1C19.2 35.1 11.8 31.4 6 24Z"
          fill="currentColor"
          opacity="0.92"
        />
        <circle cx="30" cy="21" r="1.8" fill="#090604" />
        <path d="M16 17.5c2.5 3.5 2.5 9.5 0 13" fill="none" stroke="#090604" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </span>
  );
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
  const [searchQuery, setSearchQuery] = useState("");
  const catalogContentRef = useRef<HTMLDivElement>(null);
  const isSelectedCutControlled = selectedCutId !== undefined;

  const selectedIntent =
    intentState.sourceFilter === intentFilter ? intentState.selectedIntent : intentFilter;
  const selectedZone =
    zoneState.sourceAnimal === selectedAnimal ? zoneState.selectedZone : null;
  const effectiveSelectedCutId = isSelectedCutControlled ? selectedCutId : localSelectedCutId;
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
    if (!isSelectedCutControlled) {
      setLocalSelectedCutId(nextProfile?.id ?? null);
    }
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
  const normalizedSearchQuery = useMemo(() => normalizeCutSearchText(searchQuery), [searchQuery]);
  const isSearchActive = normalizedSearchQuery.length > 0;
  const searchedProfiles = useMemo(
    () => searchCutProfiles(visibleProfiles, searchQuery, { lang: effectiveLang, animalId: selectedAnimal }),
    [effectiveLang, searchQuery, selectedAnimal, visibleProfiles],
  );
  const searchedGroups = useMemo(
    () => getCategoryGroups(searchedProfiles, effectiveLang),
    [effectiveLang, searchedProfiles],
  );
  const catalogGroups = isSearchActive ? searchedGroups : groupedProfiles;
  const chipAnimalLabel = (animalId: GeneratedAnimalId) => getCompactAnimalLabel(animalId, effectiveLang);
  const activeFilterLabel =
    selectedIntent
      ? getIntentLabel(selectedIntent, effectiveLang)
      : getAllGoalsLabel(effectiveLang);
  const selectedAnimalLabel = getAnimalLabel(selectedAnimal, effectiveLang);
  const compactStatusLine = `${selectedAnimalLabel} · ${totalCutsByAnimal} ${getCutsUnitLabel(effectiveLang)} · ${activeFilterLabel}`;
  const hasActiveFilters = Boolean(selectedZone);
  const handleStartCooking = (profile: GeneratedCutProfile) => {
    if (onStartCooking) {
      onStartCooking(profile);
      return;
    }

    router.push(buildCookingWizardHref(profile, effectiveLang));
  };
  const handleResetFilters = () => {
    handleIntentChange(null);
    handleZoneChange(null);
  };
  const handleAnimalSelect = (nextAnimal: GeneratedAnimalId) => {
    if (!onAnimalChange || nextAnimal === selectedAnimal) return;
    setCatalogExpanded(false);
    setViewMode("list");
    setSearchQuery("");
    handleZoneChange(null);
    onAnimalChange(nextAnimal);
  };
  const handleCatalogExpandedChange = (nextExpanded: boolean) => {
    setCatalogExpanded(nextExpanded);
    if (nextExpanded && typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          catalogContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }
    if (!nextExpanded) {
      setSearchQuery("");
    }
  };
  const handleViewModeChange = (nextMode: CutViewMode) => {
    setViewMode(nextMode);
    if (nextMode === "map") {
      setSearchQuery("");
    }
  };
  const clearSearch = () => {
    setSearchQuery("");
  };
  const viewAllLabel = getViewAllLabel(totalCutsByAnimal, selectedAnimal, effectiveLang);
  const hideAllLabel = getHideAllLabel(effectiveLang);
  const sectionBottomPaddingClass = catalogExpanded
    ? "pb-6 sm:pb-8 lg:pb-8"
    : "pb-4 sm:pb-6 lg:pb-6";

  return (
    <main className="relative w-full max-w-full overflow-x-clip overflow-y-visible text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-44 h-[340px] w-[340px] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute -right-20 top-10 h-[300px] w-[300px] rounded-full bg-red-600/7 blur-[130px]" />
      </div>

      <section className={`relative mx-auto flex w-full max-w-[1000px] flex-col px-0 pt-0.5 sm:px-2 sm:pt-2 ${sectionBottomPaddingClass}`}>
        <header className="rounded-[1.05rem] border border-orange-300/14 bg-white/[0.035] px-2 py-1.5 shadow-[0_12px_34px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:rounded-[1.2rem] sm:px-3 sm:py-2.5">
          <div className="grid grid-cols-5 gap-1 touch-pan-y sm:gap-2">
            {animalOptions.map(([animalId]) => {
              const selected = animalId === selectedAnimal;
              const iconSrc = getCategoryIcon(animalId);
              const label = chipAnimalLabel(animalId);
              return (
                <button
                  key={animalId}
                  type="button"
                  aria-label={label}
                  title={label}
                  onClick={() => handleAnimalSelect(animalId)}
                  className={`flex min-h-[46px] min-w-0 items-center justify-center rounded-[0.95rem] border p-1 transition active:scale-[0.98] sm:min-h-[66px] sm:rounded-[1.35rem] sm:p-2 ${
                    selected
                      ? "border-orange-300/85 bg-orange-500/18 shadow-[0_0_0_1px_rgba(251,146,60,0.28),0_12px_30px_rgba(249,115,22,0.18)]"
                      : "border-white/12 bg-black/25 hover:border-orange-300/35 hover:bg-orange-500/8"
                  }`}
                >
                  {iconSrc ? (
                    <BrandImageIcon
                      src={iconSrc}
                      alt=""
                      size="lg"
                      shape="plain"
                      aria-hidden="true"
                      className={selected ? "h-9 w-9 rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl" : "h-8 w-8 rounded-xl opacity-86 sm:h-12 sm:w-12 sm:rounded-2xl"}
                    />
                  ) : (
                    <FishFallbackIcon />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 px-0.5 text-[10px] font-semibold text-zinc-400 sm:mt-2 sm:text-xs">
            <span className="block truncate">{compactStatusLine}</span>
            {selectedZone && <span className="block truncate text-orange-200">· {getCategoryLabel(selectedZone, effectiveLang)}</span>}
          </div>
        </header>

        {!catalogExpanded && (
          <div className="mt-2 sm:mt-3">
            <IntentSelector lang={effectiveLang} selectedIntent={selectedIntent} onIntentChange={handleIntentChange} />
          </div>
        )}

        <div className="mt-2 grid min-w-0 gap-3 sm:mt-3 lg:grid-cols-[1fr_300px] lg:gap-4">
          <div className="min-w-0 space-y-2 sm:space-y-4">
            {!catalogExpanded && (
              <QuickPicks
                profiles={animalProfiles}
                intent={selectedIntent}
                lang={effectiveLang}
                limit={4}
                selectedCutId={selectedProfile?.id}
                onSelect={handleStartCooking}
                onViewDetails={handleProfileChange}
              />
            )}
            <button
              type="button"
              onClick={() => handleCatalogExpandedChange(!catalogExpanded)}
              className="w-full rounded-2xl border border-white/14 bg-white/[0.035] px-4 py-3 text-left text-sm font-black text-zinc-100 shadow-[0_10px_28px_rgba(0,0,0,0.20)] transition hover:border-orange-300/45 hover:bg-orange-500/10 active:scale-[0.99]"
              aria-expanded={catalogExpanded}
            >
              {catalogExpanded ? hideAllLabel : viewAllLabel}
            </button>

            {catalogExpanded && (
              <div ref={catalogContentRef} className="scroll-mt-3 space-y-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <CutViewToggle lang={effectiveLang} value={viewMode} onChange={handleViewModeChange} />
                  {selectedZone && (
                    <button
                      type="button"
                      onClick={() => handleZoneChange(null)}
                      className="w-full rounded-2xl border border-orange-400/25 bg-orange-500/10 px-4 py-3 text-xs font-black text-orange-200 transition active:scale-[0.98] sm:w-auto"
                    >
                      {getClearZoneLabel(getCategoryLabel(selectedZone, effectiveLang), effectiveLang)}
                    </button>
                  )}
                </div>
                {viewMode === "list" && (
                  <div className="relative">
                    <label htmlFor="cut-search-input" className="sr-only">
                      {getCutSearchAriaLabel(effectiveLang)}
                    </label>
                    <input
                      id="cut-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={getCutSearchPlaceholder(effectiveLang)}
                      aria-label={getCutSearchAriaLabel(effectiveLang)}
                      className="h-11 w-full rounded-2xl border border-white/15 bg-black/35 px-4 pr-12 text-sm font-semibold text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-orange-300/60 focus:ring-2 focus:ring-orange-400/30"
                    />
                    {isSearchActive && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        aria-label={getCutSearchClearLabel(effectiveLang)}
                        className="absolute right-1.5 top-1/2 flex h-8 min-w-8 -translate-y-1/2 items-center justify-center rounded-full border border-orange-400/25 bg-orange-500/12 px-2 text-xs font-black text-orange-200 transition hover:bg-orange-500/20 active:scale-[0.97]"
                      >
                        &#10005;
                      </button>
                    )}
                  </div>
                )}

                {viewMode === "map" && (
                  <CutMap
                    animal={selectedAnimal}
                    lang={effectiveLang}
                    selectedZone={selectedZone}
                    onZoneChange={handleZoneChange}
                  />
                )}
                {isSearchActive && catalogGroups.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-center">
                    <p className="text-lg font-black tracking-tight text-white">
                      {getCutSearchNoResultsTitle(searchQuery.trim(), effectiveLang)}
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-zinc-500">
                      {getCutSearchNoResultsMessage(effectiveLang)}
                    </p>
                  </div>
                ) : (
                  <CutList
                    groups={catalogGroups}
                    lang={effectiveLang}
                    selectedCutId={selectedProfile?.id}
                    hasActiveFilters={hasActiveFilters && !isSearchActive}
                    onResetFilters={handleResetFilters}
                    onSelect={handleStartCooking}
                    onViewDetails={handleProfileChange}
                  />
                )}
              </div>
            )}

            <CutBottomSheet
              profile={selectedProfile}
              lang={effectiveLang}
              onClose={() => handleProfileChange(null)}
              onStartCooking={handleStartCooking}
            />
          </div>
          <aside className="hidden min-w-0 max-w-full lg:sticky lg:top-4 lg:block lg:self-start">
            <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.035] p-3 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                {getCurrentSelectionLabel(effectiveLang)}
              </p>
              <p className="mt-2 text-sm font-black text-white">{getAnimalLabel(selectedAnimal, effectiveLang)}</p>
              <p className="mt-1 text-xs font-semibold text-zinc-500">
                {activeFilterLabel} · {visibleProfiles.length}{" "}
                {getCutsUnitLabel(effectiveLang)}
              </p>
            </div>
          </aside>
        </div>
      </section>

    </main>
  );
}
