import type {
  Blocks,
  CookingSizePreset,
  CookingWeightRange,
  CookingWizardStep,
  SaveMenuStatus,
  SelectOption,
  VegetableFormat,
} from "@/components/cooking/CookingWizard";
import type { HomeModeScreenProps } from "@/components/app/modes/HomeModeScreen";
import type { CoccionModeScreenProps } from "@/components/app/modes/CoccionModeScreen";
import type { MenuModeScreenProps } from "@/components/app/modes/MenuModeScreen";
import type { GuardadosModeScreenProps } from "@/components/app/modes/GuardadosModeScreen";
import type { ParrilladaModeScreenProps } from "@/components/app/modes/ParrilladaModeScreen";
import type { PlanModeScreenProps } from "@/components/app/modes/PlanModeScreen";
import type { ParrilladaFlowStep } from "@/components/parrillada";
import type { Mode } from "@/components/navigation/AppHeader";
import type { GeneratedAnimalId, GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import type { AppText, Lang } from "@/lib/i18n/texts";
import type { AnimalLabel } from "@/lib/media/animalMedia";
import type { SavedMenu, ShareStatus } from "@/components/results/CookingResultScreen";
import {
  mapSizePresetToThickness,
  mapThicknessToSizePreset,
} from "@/lib/cooking/inputMapping";

type CutItem = {
  id: string;
  name: string;
  image: string;
  description: string;
};

export type BuildHomeModePropsArgs = {
  lang: Lang;
  t: AppText;
  onLangChange: (lang: Lang) => void;
  onModeChange: (mode: Mode) => void;
  onPrimaryCtaClick: () => void;
};

export function buildHomeModeProps(args: BuildHomeModePropsArgs): HomeModeScreenProps {
  return {
    lang: args.lang,
    onLangChange: args.onLangChange,
    t: args.t,
    onModeChange: args.onModeChange,
    onPrimaryCtaClick: args.onPrimaryCtaClick,
  };
}

export type BuildCoccionModePropsArgs = {
  cookingStep: CookingWizardStep;
  lang: Lang;
  t: AppText;
  // Cut selection
  selectedAnimalId: GeneratedAnimalId;
  selectedCutId: string | null;
  isAnimalPreselected: boolean;
  onCutSelectionAnimalChange: (animalId: GeneratedAnimalId) => void;
  onCutSelectionPreviewChange: (cutId: string | null) => void;
  onCutSelectionStartCooking: (profile: GeneratedCutProfile) => void;
  // Wizard data
  animal: AnimalLabel;
  cut: string;
  cuts: CutItem[];
  selectedCut: CutItem | undefined;
  currentDonenessOptions: SelectOption[];
  doneness: string;
  equipment: string;
  thickness: string;
  showThickness: boolean;
  advancedThicknessEnabled: boolean;
  sizePreset: CookingSizePreset;
  weightRange: CookingWeightRange;
  vegetableFormat: VegetableFormat;
  loading: boolean;
  blocks: Blocks;
  checkedItems: Record<string, boolean>;
  saveMenuStatus: SaveMenuStatus;
  saveMenuMessage: string;
  getAnimalPreview: (animal: AnimalLabel, lang: Lang) => string;
  // Wizard handlers (from useCookingInputHandlers)
  onAnimalChange: (selectedAnimal: AnimalLabel) => void;
  onCutChange: (selectedCutId: string) => void;
  onCookingStepChange: (step: CookingWizardStep, method?: "push" | "replace") => void;
  // Raw setters wrapped here with resetSaveMenuState
  setAdvancedThicknessEnabled: (value: boolean) => void;
  setDoneness: (value: string) => void;
  setEquipment: (value: string) => void;
  setSizePreset: (value: CookingSizePreset) => void;
  setThickness: (value: string) => void;
  setVegetableFormat: (value: VegetableFormat) => void;
  setWeightRange: (value: CookingWeightRange) => void;
  resetSaveMenuState: () => void;
  setCheckedItems: (value: Record<string, boolean>) => void;
  onGenerateCookingPlan: () => Promise<void>;
  onSaveMenu: () => Promise<void>;
};

export function buildCoccionModeProps(args: BuildCoccionModePropsArgs): CoccionModeScreenProps {
  return {
    cookingStep: args.cookingStep,
    lang: args.lang,
    t: args.t,
    cutSelection: {
      selectedAnimalId: args.selectedAnimalId,
      selectedCutId: args.selectedCutId,
      isAnimalPreselected: args.isAnimalPreselected,
      onAnimalChange: args.onCutSelectionAnimalChange,
      onPreviewCutChange: args.onCutSelectionPreviewChange,
      onStartCooking: args.onCutSelectionStartCooking,
    },
    wizard: {
      animal: args.animal,
      cut: args.cut,
      cuts: args.cuts,
      selectedCut: args.selectedCut,
      currentDonenessOptions: args.currentDonenessOptions,
      doneness: args.doneness,
      equipment: args.equipment,
      thickness: args.thickness,
      showThickness: args.showThickness,
      advancedThicknessEnabled: args.advancedThicknessEnabled,
      sizePreset: args.sizePreset,
      weightRange: args.weightRange,
      vegetableFormat: args.vegetableFormat,
      loading: args.loading,
      blocks: args.blocks,
      checkedItems: args.checkedItems,
      saveMenuStatus: args.saveMenuStatus,
      saveMenuMessage: args.saveMenuMessage,
      getAnimalPreview: args.getAnimalPreview,
      onAnimalChange: args.onAnimalChange,
      onCutChange: args.onCutChange,
      onCookingStepChange: args.onCookingStepChange,
      onAdvancedThicknessEnabledChange: (value) => {
        args.setAdvancedThicknessEnabled(value);
        args.resetSaveMenuState();
      },
      onDonenessChange: (value) => {
        args.setDoneness(value);
        args.resetSaveMenuState();
      },
      onEquipmentChange: (value) => {
        args.setEquipment(value);
        args.resetSaveMenuState();
      },
      onSizePresetChange: (value) => {
        args.setSizePreset(value);
        args.setThickness(mapSizePresetToThickness(value));
        args.resetSaveMenuState();
      },
      onThicknessChange: (value) => {
        args.setThickness(value);
        args.setSizePreset(mapThicknessToSizePreset(value));
        args.resetSaveMenuState();
      },
      onVegetableFormatChange: (value) => {
        args.setVegetableFormat(value);
        args.resetSaveMenuState();
      },
      onWeightRangeChange: (value) => {
        args.setWeightRange(value);
        args.resetSaveMenuState();
      },
      onCheckedItemsChange: args.setCheckedItems,
      onGenerateCookingPlan: args.onGenerateCookingPlan,
      onSaveMenu: args.onSaveMenu,
    },
  };
}

export type BuildMenuModePropsArgs = {
  t: AppText;
  people: string;
  setPeople: (value: string) => void;
  eventType: string;
  setEventType: (value: string) => void;
  menuMeats: string;
  setMenuMeats: (value: string) => void;
  sides: string;
  setSides: (value: string) => void;
  budget: string;
  setBudget: (value: string) => void;
  difficulty: string;
  setDifficulty: (value: string) => void;
  equipment: string;
  setEquipment: (value: string) => void;
  loading: boolean;
  blocks: Blocks;
  checkedItems: Record<string, boolean>;
  setCheckedItems: (value: Record<string, boolean>) => void;
  saveMenuStatus: SaveMenuStatus;
  saveMenuMessage: string;
  onGenerateMenuPlan: () => Promise<void>;
  onSaveCurrentMenu: () => Promise<void>;
};

export function buildMenuModeProps(args: BuildMenuModePropsArgs): MenuModeScreenProps {
  return {
    t: args.t,
    people: args.people,
    setPeople: args.setPeople,
    eventType: args.eventType,
    setEventType: args.setEventType,
    menuMeats: args.menuMeats,
    setMenuMeats: args.setMenuMeats,
    sides: args.sides,
    setSides: args.setSides,
    budget: args.budget,
    setBudget: args.setBudget,
    difficulty: args.difficulty,
    setDifficulty: args.setDifficulty,
    equipment: args.equipment,
    setEquipment: args.setEquipment,
    loading: args.loading,
    blocks: args.blocks,
    checkedItems: args.checkedItems,
    setCheckedItems: args.setCheckedItems,
    saveMenuStatus: args.saveMenuStatus,
    saveMenuMessage: args.saveMenuMessage,
    onGenerateMenuPlan: args.onGenerateMenuPlan,
    onSaveCurrentMenu: args.onSaveCurrentMenu,
  };
}

export type BuildGuardadosModePropsArgs = {
  lang: Lang;
  t: AppText;
  guardadosTab: "plans" | "cooks";
  onGuardadosTabChange: (tab: "plans" | "cooks") => void;
  checkedItems: Record<string, boolean>;
  setCheckedItems: (value: Record<string, boolean>) => void;
  savedMenus: SavedMenu[];
  selectedSavedMenu: SavedMenu | null;
  shareMessage: string;
  shareMessageMenuId: string | null;
  shareStatus: ShareStatus;
  sharingMenuId: string | null;
  onClearSelectedSavedMenu: () => void;
  onCopyShareLink: (menu: SavedMenu) => void;
  onCopySavedMenu: (menu: SavedMenu) => void;
  onDeleteMenu: (id: string) => void;
  onLoadMenu: (menu: SavedMenu) => void;
  onCookAgainLive: (menu: SavedMenu) => void;
  onCookAgainReview: (menu: SavedMenu) => void;
  onPublishMenu: (menu: SavedMenu) => void;
  onUnpublishMenu: (menu: SavedMenu) => void;
  onStartCookingFromSavedCooks: () => void;
};

export type BuildParrilladaModePropsArgs = {
  lang: Lang;
  t: AppText;
  step: ParrilladaFlowStep;
  onStepChange: (next: ParrilladaFlowStep) => void;
};

export function buildParrilladaModeProps(args: BuildParrilladaModePropsArgs): ParrilladaModeScreenProps {
  return {
    lang: args.lang,
    t: args.t,
    step: args.step,
    onStepChange: args.onStepChange,
  };
}

export type BuildPlanModePropsArgs = {
  step: ParrilladaFlowStep;
  onStepChange: (next: ParrilladaFlowStep) => void;
};

export function buildPlanModeProps(args: BuildPlanModePropsArgs): PlanModeScreenProps {
  return {
    step: args.step,
    onStepChange: args.onStepChange,
  };
}

export function buildGuardadosModeProps(args: BuildGuardadosModePropsArgs): GuardadosModeScreenProps {
  return {
    lang: args.lang,
    t: args.t,
    guardadosTab: args.guardadosTab,
    onGuardadosTabChange: args.onGuardadosTabChange,
    plans: {
      checkedItems: args.checkedItems,
      setCheckedItems: args.setCheckedItems,
      savedMenus: args.savedMenus,
      selectedSavedMenu: args.selectedSavedMenu,
      shareMessage: args.shareMessage,
      shareMessageMenuId: args.shareMessageMenuId,
      shareStatus: args.shareStatus,
      sharingMenuId: args.sharingMenuId,
      onClearSelectedSavedMenu: args.onClearSelectedSavedMenu,
      onCopyShareLink: args.onCopyShareLink,
      onCopySavedMenu: args.onCopySavedMenu,
      onDeleteMenu: args.onDeleteMenu,
      onLoadMenu: args.onLoadMenu,
      onCookAgainLive: args.onCookAgainLive,
      onCookAgainReview: args.onCookAgainReview,
      onPublishMenu: args.onPublishMenu,
      onUnpublishMenu: args.onUnpublishMenu,
    },
    cooks: {
      onStartCooking: args.onStartCookingFromSavedCooks,
    },
  };
}
