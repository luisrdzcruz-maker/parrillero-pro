"use client";

import type { useRouter } from "next/navigation";

import type { Blocks } from "@/components/cooking/CookingWizard";
import type { SavedMenu } from "@/components/results/CookingResultScreen";
import type { Mode } from "@/components/navigation/AppHeader";
import {
  parseSavedCookConfig,
  toLiveDoneness,
} from "@/components/app/utils/cookingDomain";
import { engineLang } from "@/components/app/utils/i18n";
import {
  generateCookingPlan as generateLocalCookingPlan,
  shouldShowThickness,
} from "@/lib/cookingRules";
import { mapThicknessToSizePreset } from "@/lib/cooking/inputMapping";
import type { CookingSizePreset, CookingWizardStep } from "@/components/cooking/CookingWizard";
import type { CookingNavContext } from "@/lib/navigation/appNavState";
import type { Lang } from "@/lib/i18n/texts";
import { createLiveCookingPayload, saveLiveCookingPayload } from "@/lib/liveCookingPlan";
import { buildLiveUrl } from "@/lib/navigation/buildLiveUrl";
import { animalIdsByLabel, type AnimalLabel } from "@/lib/media/animalMedia";
import {
  REQUIRED_COOKING_BLOCKS,
  REQUIRED_COOKING_BLOCKS_EN,
  normalizeBlocks,
} from "@/lib/parser/normalizeBlocks";

type CommitNav = (
  mode: Mode,
  cookingStep: CookingWizardStep,
  method: "push" | "replace",
  cookingContext?: CookingNavContext,
) => void;

type ResetAdaptiveDetailInputs = (selectedCutId: string | undefined, selectedAnimal: AnimalLabel) => void;

export type UseCookAgainControllerArgs = {
  // Snapshot used as fallback when parsing the saved menu
  animal: AnimalLabel;
  equipment: string;
  doneness: string;
  weight: string;
  thickness: string;
  lang: Lang;
  // Cooking input setters
  setLang: (value: Lang) => void;
  setAnimal: (animal: AnimalLabel) => void;
  setCut: (cutId: string) => void;
  setWeight: (value: string) => void;
  setThickness: (value: string) => void;
  setSizePreset: (value: CookingSizePreset) => void;
  setDoneness: (value: string) => void;
  setEquipment: (value: string) => void;
  setBlocks: (value: Blocks) => void;
  setCheckedItems: (value: Record<string, boolean>) => void;
  // Saved-menus actions
  setSelectedSavedMenu: (value: SavedMenu | null) => void;
  resetSaveMenuState: () => void;
  // Other helpers
  resetAdaptiveDetailInputs: ResetAdaptiveDetailInputs;
  commitNav: CommitNav;
  navigateMode: (mode: Mode) => void;
  router: ReturnType<typeof useRouter>;
};

export function useCookAgainController({
  animal,
  equipment,
  doneness,
  weight,
  thickness,
  lang,
  setLang,
  setAnimal,
  setCut,
  setWeight,
  setThickness,
  setSizePreset,
  setDoneness,
  setEquipment,
  setBlocks,
  setCheckedItems,
  setSelectedSavedMenu,
  resetSaveMenuState,
  resetAdaptiveDetailInputs,
  commitNav,
  navigateMode,
  router,
}: UseCookAgainControllerArgs) {
  function loadMenu(menu: SavedMenu) {
    setSelectedSavedMenu(menu);
    resetSaveMenuState();
    navigateMode("guardados");
  }

  function buildCookingPlanFromSavedConfig(menu: SavedMenu) {
    const config = parseSavedCookConfig(menu, {
      animal,
      equipment,
      doneness,
      weight,
      thickness,
      lang,
    });
    if (!config) return null;

    const thicknessForPlan = shouldShowThickness(config.cut) ? config.thickness : "2";
    const localPlan = generateLocalCookingPlan({
      animal: config.animal,
      cut: config.cut,
      weightKg: config.weight,
      thicknessCm: thicknessForPlan,
      doneness: config.doneness,
      equipment: config.equipment,
      language: engineLang(config.lang),
    });
    const localPlanRepeat = generateLocalCookingPlan({
      animal: config.animal,
      cut: config.cut,
      weightKg: config.weight,
      thicknessCm: thicknessForPlan,
      doneness: config.doneness,
      equipment: config.equipment,
      language: engineLang(config.lang),
    });
    if (
      localPlan &&
      localPlanRepeat &&
      JSON.stringify(localPlan) !== JSON.stringify(localPlanRepeat)
    ) {
      console.warn("[cook-again] Non-deterministic local cooking plan detected", config);
    }

    const requiredBlocks = config.lang === "en" ? REQUIRED_COOKING_BLOCKS_EN : REQUIRED_COOKING_BLOCKS;
    const normalizedPlan = normalizeBlocks(
      localPlan ?? menu.blocks,
      requiredBlocks,
      "cooking_plan",
    );

    return { config, blocks: normalizedPlan };
  }

  function reviewSavedCook(menu: SavedMenu) {
    if (menu.type !== "cooking_plan") {
      loadMenu(menu);
      return;
    }

    const rebuilt = buildCookingPlanFromSavedConfig(menu);
    if (!rebuilt) {
      loadMenu(menu);
      return;
    }

    setLang(rebuilt.config.lang);
    setAnimal(rebuilt.config.animal);
    setCut(rebuilt.config.cut);
    setWeight(rebuilt.config.weight);
    resetAdaptiveDetailInputs(rebuilt.config.cut, rebuilt.config.animal);
    setThickness(rebuilt.config.thickness);
    setSizePreset(mapThicknessToSizePreset(rebuilt.config.thickness));
    setDoneness(rebuilt.config.doneness);
    setEquipment(rebuilt.config.equipment);
    setBlocks(rebuilt.blocks);
    setCheckedItems({});
    resetSaveMenuState();
    setSelectedSavedMenu(null);
    commitNav("coccion", "result", "push", {
      animal: rebuilt.config.animal,
      cut: rebuilt.config.cut,
      doneness: rebuilt.config.doneness,
      thickness: rebuilt.config.thickness,
    });
  }

  function startSavedCookLive(menu: SavedMenu) {
    const rebuilt = buildCookingPlanFromSavedConfig(menu);
    if (!rebuilt) {
      loadMenu(menu);
      return;
    }

    const payload = createLiveCookingPayload({
      input: {
        animal: rebuilt.config.animal,
        cut: rebuilt.config.cut,
        equipment: rebuilt.config.equipment,
        doneness: rebuilt.config.doneness,
        thickness: shouldShowThickness(rebuilt.config.cut) ? rebuilt.config.thickness : "2",
        lang: rebuilt.config.lang,
      },
      blocks: rebuilt.blocks,
    });

    if (!saveLiveCookingPayload(payload)) {
      return;
    }
    const cutShowsThickness = shouldShowThickness(rebuilt.config.cut);
    const liveThicknessRaw = Number(rebuilt.config.thickness);
    const liveThickness =
      cutShowsThickness && Number.isFinite(liveThicknessRaw) && liveThicknessRaw > 0
        ? liveThicknessRaw
        : undefined;
    router.push(
      buildLiveUrl({
        animal: animalIdsByLabel[rebuilt.config.animal],
        cutId: rebuilt.config.cut,
        doneness: toLiveDoneness(rebuilt.config.doneness),
        thickness: liveThickness,
        lang: rebuilt.config.lang,
      }),
    );
  }

  return {
    loadMenu,
    reviewSavedCook,
    startSavedCookLive,
  };
}
