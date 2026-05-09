"use client";

import {
  buildCookingPlanPrompt,
  buildMenuPrompt,
  buildPlanPrompt,
} from "@/components/app/utils/aiPayload";
import {
  parseMenuReply,
  parseResponse,
} from "@/components/app/utils/blocks";
import { engineLang } from "@/components/app/utils/i18n";
import {
  buildText,
  type SavedMenu,
} from "@/components/results/CookingResultScreen";
import type {
  Blocks,
  CookingSizePreset,
  CookingWeightRange,
  VegetableFormat,
} from "@/components/cooking/CookingWizard";
import { type PlanMode } from "@/components/planning/PlanHub";
import { track } from "@/lib/analytics";
import { getInputProfileForCut } from "@/lib/cooking/inputProfiles";
import {
  mapBeefLargeWeightPresetToKg,
  mapSizePresetToThickness,
} from "@/lib/cooking/inputMapping";
import { mapWeightRangeToKg } from "@/lib/cooking/inputMapping";
import {
  generateCookingPlan as generateLocalCookingPlan,
  generateCookingSteps as generateLocalCookingSteps,
  getCutById,
} from "@/lib/cookingRules";
import type { Lang } from "@/lib/i18n/texts";
import { animalIdsByLabel, type AnimalLabel } from "@/lib/media/animalMedia";
import {
  REQUIRED_COOKING_BLOCKS,
  REQUIRED_PARRILLADA_BLOCKS,
  normalizeBlocks,
} from "@/lib/parser/normalizeBlocks";
import { generateParrilladaPlan } from "@/lib/parrilladaEngine";

type CutItem = {
  id: string;
  name: string;
  image: string;
  description: string;
};

type PushCookingResultHistory = (
  fallbackContext?: { doneness?: string; thickness?: string },
) => void;

export type UsePlanGenerationControllerArgs = {
  // Cooking flow inputs
  animal: AnimalLabel;
  cut: string;
  selectedCut: CutItem | undefined;
  weight: string;
  thickness: string;
  advancedThicknessEnabled: boolean;
  sizePreset: CookingSizePreset;
  weightRange: CookingWeightRange;
  vegetableFormat: VegetableFormat;
  doneness: string;
  equipment: string;
  // Result blocks (read-only for copy/share)
  blocks: Blocks;
  // Menu composer inputs
  planMode: PlanMode;
  people: string;
  eventType: string;
  menuMeats: string;
  sides: string;
  budget: string;
  difficulty: string;
  planProduct: string;
  parrilladaPeople: string;
  serveTime: string;
  parrilladaProducts: string;
  parrilladaSides: string;
  // App
  lang: Lang;
  // Setters / actions
  setLoading: (value: boolean) => void;
  setBlocks: (value: Blocks) => void;
  setCheckedItems: (value: Record<string, boolean>) => void;
  setPlanGenerated: (value: boolean) => void;
  resetSaveMenuState: () => void;
  pushCookingResultHistoryWithContext: PushCookingResultHistory;
  saveCurrentMenu: () => Promise<SavedMenu | null>;
  publishMenu: (menu: SavedMenu) => Promise<void>;
};

export function usePlanGenerationController(args: UsePlanGenerationControllerArgs) {
  const {
    animal,
    cut,
    selectedCut,
    weight,
    thickness,
    advancedThicknessEnabled,
    sizePreset,
    weightRange,
    vegetableFormat,
    doneness,
    equipment,
    blocks,
    planMode,
    people,
    eventType,
    menuMeats,
    sides,
    budget,
    difficulty,
    planProduct,
    parrilladaPeople,
    serveTime,
    parrilladaProducts,
    parrilladaSides,
    lang,
    setLoading,
    setBlocks,
    setCheckedItems,
    setPlanGenerated,
    resetSaveMenuState,
    pushCookingResultHistoryWithContext,
    saveCurrentMenu,
    publishMenu,
  } = args;

  async function callAI(
    message: string,
    createCookSteps = false,
    parseAsMenu = false,
  ): Promise<boolean> {
    setLoading(true);
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        if (createCookSteps) {
          track({ name: "cooking_failure", where: "ai_http", status: res.status });
        }
        setLoading(false);
        return false;
      }

      const data = await res.json();
      const reply = typeof data.reply === "string" ? data.reply : "";
      const parsed = parseAsMenu ? parseMenuReply(reply) : parseResponse(reply);
      const normalized = parseAsMenu
        ? parsed
        : normalizeBlocks(parsed, REQUIRED_COOKING_BLOCKS, "cooking_plan");

      setBlocks(normalized);
    } catch (e) {
      if (createCookSteps) {
        const msg = e instanceof Error ? e.message : String(e);
        if (e instanceof TypeError) {
          track({ name: "cooking_failure", where: "ai_network", message: msg });
        } else {
          track({ name: "cooking_failure", where: "ai_exception", message: msg });
        }
      }
      setLoading(false);
      return false;
    }

    setLoading(false);
    return true;
  }

  async function generateCookingPlan() {
    const cutMeta = getCutById(cut);
    const inputProfile = cutMeta
      ? getInputProfileForCut({
          cutId: cutMeta.id,
          animalId: cutMeta.animalId,
          style: cutMeta.style,
          inputProfileId: cutMeta.inputProfileId,
        })
      : getInputProfileForCut({
          cutId: cut,
          animalId: animalIdsByLabel[animal],
          style: "fast",
        });
    const isVegetableCut = inputProfile.showVegetableFormat;
    const isWholeChicken = cut === "pollo_entero";

    const resolvedWeightKg =
      inputProfile.showWeightRange
        ? mapWeightRangeToKg(weightRange, isWholeChicken)
        : inputProfile.showWeightPreset
          ? mapBeefLargeWeightPresetToKg(weightRange)
          : weight;

    let resolvedThicknessCm = "2";
    if (inputProfile.showSizePreset) {
      resolvedThicknessCm = mapSizePresetToThickness(sizePreset);
      if (inputProfile.allowAdvancedExactThickness && advancedThicknessEnabled && thickness.trim()) {
        resolvedThicknessCm = thickness;
      }
    }

    const input = {
      animal,
      cut,
      weightKg: resolvedWeightKg,
      thicknessCm: resolvedThicknessCm,
      format: isVegetableCut ? vegetableFormat : undefined,
      doneness,
      equipment,
      language: engineLang(lang),
    };

    const localPlan = generateLocalCookingPlan(input);
    const localSteps = generateLocalCookingSteps(input);

    if (localPlan && localSteps) {
      track({ name: "cooking_plan_result", path: "local" });
      const normalizedPlan = normalizeBlocks(localPlan, REQUIRED_COOKING_BLOCKS, "cooking_plan");
      setBlocks(normalizedPlan);
      setCheckedItems({});
      resetSaveMenuState();
      pushCookingResultHistoryWithContext({
        doneness: input.doneness,
        thickness: resolvedThicknessCm,
      });
      return;
    }

    track({ name: "cooking_ai_fallback" });
    const ok = await callAI(
      buildCookingPlanPrompt({
        animal,
        cutName: selectedCut?.name ?? cut,
        resolvedWeightKg,
        resolvedThicknessCm,
        isVegetableCut,
        vegetableFormat,
        doneness,
        equipment,
        lang,
      }),
      true,
    );
    if (ok) {
      track({ name: "cooking_plan_result", path: "ai" });
    }
    pushCookingResultHistoryWithContext({
      doneness: input.doneness,
      thickness: resolvedThicknessCm,
    });
  }

  async function generateMenuPlan() {
    await callAI(
      buildMenuPrompt({
        people,
        eventType,
        menuMeats,
        sides,
        budget,
        difficulty,
        equipment,
        lang,
      }),
      false,
      true,
    );
  }

  function generateParrillada() {
    const plan = generateParrilladaPlan({
      people: parrilladaPeople,
      serveTime,
      products: parrilladaProducts,
      sides: parrilladaSides,
      equipment,
      language: engineLang(lang),
    });

    setBlocks(normalizeBlocks(plan, REQUIRED_PARRILLADA_BLOCKS, "parrillada_plan"));
    setCheckedItems({});
    resetSaveMenuState();
  }

  async function generatePlanExperience() {
    setPlanGenerated(false);
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();

    if (planMode === "evento") {
      generateParrillada();
      setPlanGenerated(true);
      return;
    }

    const productInput = planMode === "rapido" ? planProduct : menuMeats;
    const sidesInput = planMode === "rapido" ? "guarnición simple" : sides;
    const difficultyInput = planMode === "rapido" ? "fácil" : difficulty;

    const ok = await callAI(
      buildPlanPrompt({
        planMode,
        people,
        eventType,
        productInput,
        sidesInput,
        budget,
        difficultyInput,
        equipment,
        lang,
      }),
      false,
      true,
    );

    if (ok) setPlanGenerated(true);
  }

  function editPlanExperience() {
    setPlanGenerated(false);
    resetSaveMenuState();
  }

  function copyCurrentPlan() {
    if (typeof window === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(buildText(blocks));
  }

  async function shareCurrentPlan() {
    const savedMenu = await saveCurrentMenu();
    if (!savedMenu) return;

    await publishMenu(savedMenu);
  }

  return {
    callAI,
    generateCookingPlan,
    generateMenuPlan,
    generateParrillada,
    generatePlanExperience,
    editPlanExperience,
    copyCurrentPlan,
    shareCurrentPlan,
  };
}
