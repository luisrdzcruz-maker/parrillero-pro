"use client";

import type { Blocks } from "@/components/cooking/CookingWizard";
import type { Mode } from "@/components/navigation/AppHeader";
import { animalLabelsById, getInitialDoneness } from "@/components/app/utils/cookingDomain";
import { track } from "@/lib/analytics";
import {
  mapSizePresetToThickness,
  mapThicknessToSizePreset,
} from "@/lib/cooking/inputMapping";
import type { CookingWizardStep } from "@/components/cooking/CookingWizard";
import type { CookingNavContext } from "@/lib/navigation/appNavState";
import type { GeneratedAnimalId, GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import type { Lang } from "@/lib/i18n/texts";
import type { AnimalLabel } from "@/lib/media/animalMedia";

type CommitNav = (
  mode: Mode,
  cookingStep: CookingWizardStep,
  method: "push" | "replace",
  cookingContext?: CookingNavContext,
) => void;

type ResetAdaptiveDetailInputs = (selectedCutId: string | undefined, selectedAnimal: AnimalLabel) => void;

type AdaptiveDetailDefaults = {
  sizePreset: import("@/components/cooking/CookingWizard").CookingSizePreset;
  weightRange: import("@/components/cooking/CookingWizard").CookingWeightRange;
  vegetableFormat: import("@/components/cooking/CookingWizard").VegetableFormat;
};

type GetAdaptiveDetailDefaults = (
  selectedCutId: string | undefined,
  selectedAnimal: AnimalLabel,
) => AdaptiveDetailDefaults;

export type UseCookingInputHandlersArgs = {
  animal: AnimalLabel;
  lang: Lang;
  mode: Mode;
  cookingStep: CookingWizardStep;
  setAnimal: (animal: AnimalLabel) => void;
  setCut: (cutId: string) => void;
  setDoneness: (value: string) => void;
  setThickness: (value: string) => void;
  setSizePreset: (value: import("@/components/cooking/CookingWizard").CookingSizePreset) => void;
  setBlocks: (value: Blocks) => void;
  setCheckedItems: (value: Record<string, boolean>) => void;
  resetSaveMenuState: () => void;
  resetAdaptiveDetailInputs: ResetAdaptiveDetailInputs;
  getAdaptiveDetailDefaults: GetAdaptiveDetailDefaults;
  commitNav: CommitNav;
};

export function useCookingInputHandlers({
  animal,
  lang,
  mode,
  cookingStep,
  setAnimal,
  setCut,
  setDoneness,
  setThickness,
  setSizePreset,
  setBlocks,
  setCheckedItems,
  resetSaveMenuState,
  resetAdaptiveDetailInputs,
  getAdaptiveDetailDefaults,
  commitNav,
}: UseCookingInputHandlersArgs) {
  function handleAnimalChange(selectedAnimal: AnimalLabel) {
    setAnimal(selectedAnimal);
    setCut("");
    resetAdaptiveDetailInputs(undefined, selectedAnimal);
    setDoneness(getInitialDoneness(selectedAnimal));
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
    const navMethod: "push" | "replace" =
      mode === "coccion" && cookingStep === "cut" ? "replace" : "push";
    commitNav("coccion", "cut", navMethod, { animal: selectedAnimal });
    track({ name: "animal_selected", animal: selectedAnimal, lang });
  }

  function replaceCutSelectionAnimal(nextAnimal: AnimalLabel) {
    commitNav("coccion", "cut", "replace", { animal: nextAnimal });
  }

  function handleCutSelectionAnimalChange(selectedAnimalId: GeneratedAnimalId) {
    const selectedAnimal = animalLabelsById[selectedAnimalId] ?? animal;
    if (selectedAnimal === animal) return;

    setAnimal(selectedAnimal);
    setCut("");
    resetAdaptiveDetailInputs(undefined, selectedAnimal);
    setDoneness(getInitialDoneness(selectedAnimal));
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
    replaceCutSelectionAnimal(selectedAnimal);
    track({ name: "animal_selected", animal: selectedAnimal, lang });
  }

  function handleCutChange(selectedCutId: string) {
    const defaults = getAdaptiveDetailDefaults(selectedCutId, animal);
    const defaultThickness = mapSizePresetToThickness(defaults.sizePreset);
    const defaultDoneness = getInitialDoneness(animal, selectedCutId);

    setCut(selectedCutId);
    resetAdaptiveDetailInputs(selectedCutId, animal);
    setDoneness(defaultDoneness);
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
    commitNav("coccion", "details", "push", {
      animal,
      cut: selectedCutId,
      ...(defaultDoneness ? { doneness: defaultDoneness } : {}),
      thickness: defaultThickness,
    });
    track({ name: "cut_selected", animal, cutId: selectedCutId, lang });
  }

  function handleCutSelectionPreviewChange(nextCutId: string | null) {
    if (nextCutId) {
      setCut(nextCutId);
      commitNav("coccion", "cut", "push", {
        animal,
        cut: nextCutId,
      });
      return;
    }

    setCut("");
    commitNav("coccion", "cut", "replace", {});
  }

  function handleCutSelectionStartCooking(profile: GeneratedCutProfile) {
    const selectedAnimal = animalLabelsById[profile.animalId] ?? animal;
    const selectedDoneness = getInitialDoneness(selectedAnimal, profile.id);
    const selectedThickness =
      profile.showThickness && Number.isFinite(profile.defaultThicknessCm)
        ? `${profile.defaultThicknessCm}`
        : "2";

    setAnimal(selectedAnimal);
    setCut(profile.id);
    resetAdaptiveDetailInputs(profile.id, selectedAnimal);
    setDoneness(selectedDoneness);
    setThickness(selectedThickness);
    setSizePreset(mapThicknessToSizePreset(selectedThickness));
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
    commitNav("coccion", "details", "push", {
      animal: selectedAnimal,
      cut: profile.id,
      doneness: selectedDoneness,
      ...(profile.showThickness ? { thickness: selectedThickness } : {}),
    });
    track({ name: "cut_selected", animal: selectedAnimal, cutId: profile.id, lang });
  }

  return {
    handleAnimalChange,
    handleCutSelectionAnimalChange,
    handleCutChange,
    handleCutSelectionPreviewChange,
    handleCutSelectionStartCooking,
  };
}
