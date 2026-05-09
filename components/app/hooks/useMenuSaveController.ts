"use client";

import { saveGeneratedMenu } from "@/app/actions/savedMenus";
import {
  getSafeBlocksForSave,
  hasSavableBlocks,
} from "@/components/app/utils/blocks";
import { localeForLang } from "@/components/app/utils/i18n";
import { buildSavedMenuPayload } from "@/components/app/utils/menuPayload";
import { asRecord } from "@/components/app/utils/text";
import type {
  Blocks,
  SaveMenuStatus,
} from "@/components/cooking/CookingWizard";
import type { Mode } from "@/components/navigation/AppHeader";
import type { PlanMode } from "@/components/planning/PlanHub";
import type { SavedMenu } from "@/components/results/CookingResultScreen";
import type { AppText, Lang } from "@/lib/i18n/texts";
import type { AnimalLabel } from "@/lib/media/animalMedia";

type CutItem = {
  id: string;
  name: string;
  image: string;
  description: string;
};

type SavedMenuActionMenu = {
  id: string;
  name: string;
  created_at: string;
  data?: Record<string, unknown>;
  is_public?: boolean;
  share_slug?: string | null;
};

type SaveGeneratedMenuResponse =
  | { ok: true; menu: SavedMenuActionMenu }
  | { ok: false; error?: string }
  | SavedMenuActionMenu;

export type UseMenuSaveControllerArgs = {
  // App
  lang: Lang;
  t: AppText;
  // Mode
  mode: Mode;
  planMode: PlanMode;
  // Cooking
  animal: AnimalLabel;
  cut: string;
  selectedCut: CutItem | undefined;
  weight: string;
  thickness: string;
  doneness: string;
  equipment: string;
  // Parrillada
  parrilladaPeople: string;
  serveTime: string;
  parrilladaProducts: string;
  parrilladaSides: string;
  // Menu composer
  people: string;
  eventType: string;
  menuMeats: string;
  sides: string;
  budget: string;
  difficulty: string;
  planProduct: string;
  // Result blocks
  blocks: Blocks;
  // Saved menus controller
  savedMenus: SavedMenu[];
  setSaveMenuStatus: (value: SaveMenuStatus) => void;
  setSaveMenuMessage: (value: string) => void;
  updateSavedMenus: (next: SavedMenu[]) => void;
};

export function useMenuSaveController(args: UseMenuSaveControllerArgs) {
  const {
    lang,
    t,
    mode,
    planMode,
    animal,
    cut,
    selectedCut,
    weight,
    thickness,
    doneness,
    equipment,
    parrilladaPeople,
    serveTime,
    parrilladaProducts,
    parrilladaSides,
    people,
    eventType,
    menuMeats,
    sides,
    budget,
    difficulty,
    planProduct,
    blocks,
    savedMenus,
    setSaveMenuStatus,
    setSaveMenuMessage,
    updateSavedMenus,
  } = args;

  async function saveCurrentMenu(): Promise<SavedMenu | null> {
    if (typeof window === "undefined") return null;
    if (!hasSavableBlocks(blocks)) {
      setSaveMenuStatus("error");
      setSaveMenuMessage(t.menuSaveError);
      return null;
    }

    const now = new Date();
    const cutName = selectedCut?.name ?? cut;
    const { savedType, menuName, peopleValue, inputs } = buildSavedMenuPayload({
      mode,
      planMode,
      animal,
      cut,
      cutName,
      weight,
      thickness,
      doneness,
      equipment,
      parrilladaPeople,
      serveTime,
      parrilladaProducts,
      parrilladaSides,
      people,
      eventType,
      menuMeats,
      sides,
      budget,
      difficulty,
      planProduct,
      lang,
      now,
    });

    setSaveMenuStatus("saving");
    setSaveMenuMessage("");

    try {
      const safeBlocks = getSafeBlocksForSave(blocks, savedType);
      if (Object.keys(safeBlocks).length === 0) {
        setSaveMenuStatus("error");
        setSaveMenuMessage(t.menuSaveError);
        return null;
      }

      const savedMenuResult = (await saveGeneratedMenu({
        name: menuName,
        lang,
        people: peopleValue,
        data: {
          type: savedType,
          generatedAt: now.toISOString(),
          inputs,
          blocks: safeBlocks,
        },
      })) as SaveGeneratedMenuResponse;

      if ("ok" in savedMenuResult && !savedMenuResult.ok) {
        setSaveMenuStatus("error");
        setSaveMenuMessage(savedMenuResult.error || t.menuSaveError);
        return null;
      }

      const savedMenu = "ok" in savedMenuResult ? savedMenuResult.menu : savedMenuResult;

      const newMenu: SavedMenu = {
        id: savedMenu.id,
        title: savedMenu.name,
        date: new Date(savedMenu.created_at).toLocaleDateString(localeForLang(lang)),
        blocks: safeBlocks,
        data: asRecord(savedMenu.data) ?? {
          type: savedType,
          lang,
          inputs,
          blocks: safeBlocks,
        },
        type: savedType,
        is_public: savedMenu.is_public ?? false,
        share_slug: savedMenu.share_slug ?? null,
      };

      updateSavedMenus([newMenu, ...savedMenus.filter((menu) => menu.id !== newMenu.id)]);
      setSaveMenuStatus("success");
      setSaveMenuMessage(t.menuSaved);
      return newMenu;
    } catch {
      setSaveMenuStatus("error");
      setSaveMenuMessage(t.menuSaveError);
      return null;
    }
  }

  return { saveCurrentMenu };
}
