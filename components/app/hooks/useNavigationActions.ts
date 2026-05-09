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
import {
  buildSearchFromNav,
  type CookingNavContext,
} from "@/lib/navigation/appNavState";
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
    // Mode-root back hierarchy (B4.1): bypass Next router for the replace step
    // because synchronous router.replace + router.push in one handler get
    // coalesced — only the push lands. window.history.replaceState is immediate,
    // so the subsequent commitNav push lands on top of a freshly-replaced Home
    // entry. This produces history [..., Home, TargetModeRoot] so browser-back
    // from the new mode root returns to Home, not the previous technical state.
    if (mode !== "inicio" && nextMode !== "inicio" && typeof window !== "undefined") {
      const homeSearch = buildSearchFromNav("inicio", "animal", {}, lang);
      const homeUrl = `${window.location.pathname}${homeSearch}${window.location.hash}`;
      window.history.replaceState(window.history.state, "", homeUrl);
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
