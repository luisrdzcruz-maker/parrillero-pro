"use client";

import type { useRouter } from "next/navigation";

import type { Blocks } from "@/components/cooking/CookingWizard";
import type { CookingWizardStep } from "@/components/cooking/CookingWizard";
import type { SavedMenu } from "@/components/results/CookingResultScreen";
import type { Mode } from "@/components/navigation/AppHeader";
import { isPro } from "@/lib/proStatus";
import type { Lang } from "@/lib/i18n/texts";
import {
  buildCookingDetailsUrl,
  buildHomeUrl,
} from "@/lib/navigation/cookingNavigation";
import type { CookingNavContext } from "@/lib/navigation/appNavState";
import { parseLiveParams } from "@/lib/navigation/parseLiveParams";

type CommitNav = (
  mode: Mode,
  cookingStep: CookingWizardStep,
  method: "push" | "replace",
  cookingContext?: CookingNavContext,
) => void;

export type UseNavigationActionsArgs = {
  mode: Mode;
  cookingStep: CookingWizardStep;
  lang: Lang;
  setLang: (lang: Lang) => void;
  setBlocks: (value: Blocks) => void;
  setCheckedItems: (value: Record<string, boolean>) => void;
  setPlanGenerated: (value: boolean) => void;
  resetSaveMenuState: () => void;
  setSelectedSavedMenu: (value: SavedMenu | null) => void;
  openPlanningProModal: () => void;
  commitNav: CommitNav;
  router: ReturnType<typeof useRouter>;
};

export function useNavigationActions({
  mode,
  cookingStep,
  lang,
  setLang,
  setBlocks,
  setCheckedItems,
  setPlanGenerated,
  resetSaveMenuState,
  setSelectedSavedMenu,
  openPlanningProModal,
  commitNav,
  router,
}: UseNavigationActionsArgs) {
  function handleLanguageChange(nextLang: Lang) {
    setLang(nextLang);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("lang", nextLang);
      const query = params.toString();
      router.replace(`${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    }
    setBlocks({});
    setCheckedItems({});
    setPlanGenerated(false);
    resetSaveMenuState();
  }

  function navigateMode(nextMode: Mode) {
    if (nextMode === mode) return;
    const nextStep: CookingWizardStep = nextMode === "coccion" ? "cut" : cookingStep;
    if (nextMode !== "guardados") setSelectedSavedMenu(null);
    // Soft Pro prompt for multi-item planning (non-blocking — navigation still proceeds)
    if ((nextMode === "plan" || nextMode === "parrillada") && !isPro()) {
      openPlanningProModal();
    }
    // Mode-root back hierarchy (B4.1): a bottom-nav / tab mode switch should
    // normalize history so the new root has Home — not the previous technical
    // state — as its back target. Replace the current entry with Home before
    // pushing the new root when transitioning between non-inicio modes.
    if (mode !== "inicio" && nextMode !== "inicio") {
      commitNav("inicio", "animal", "replace");
    }
    commitNav(nextMode, nextStep, "push");
  }

  function handleHomePrimaryCtaClick() {
    commitNav("coccion", "cut", "push");
  }

  function handleModeChange(nextMode: Mode) {
    navigateMode(nextMode);
  }

  function handleLivePlanNavigation() {
    if (typeof window === "undefined") return;
    // Result-block re-hydration after reload-in-Live happens in the Result-step
    // fallback effect (it survives applyCookingNavContext's blocks wipe).
    const { animal, cutId, doneness, thickness } = parseLiveParams(window.location.search);
    const targetUrl =
      animal && cutId
        ? buildCookingDetailsUrl({
            animal,
            cutId,
            doneness,
            thickness: thickness !== undefined ? String(thickness) : undefined,
            lang,
          })
        : buildHomeUrl(lang);
    router.push(targetUrl);
  }

  return {
    handleLanguageChange,
    navigateMode,
    handleHomePrimaryCtaClick,
    handleModeChange,
    handleLivePlanNavigation,
  };
}
