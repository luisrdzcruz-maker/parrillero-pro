"use client";

import {
  CookingWizard,
  type Blocks,
  type CookingSizePreset,
  type CookingWeightRange,
  type CookingWizardStep,
  type SaveMenuStatus,
  type SelectOption,
  type VegetableFormat,
} from "@/components/cooking/CookingWizard";
import { CutSelectionScreen } from "@/components/cuts/CutSelectionScreen";
import type { GeneratedAnimalId, GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import type { AnimalLabel } from "@/lib/media/animalMedia";
import type { AppText, Lang } from "@/lib/i18n/texts";

type CutItem = {
  id: string;
  name: string;
  image: string;
  description: string;
};

export type CutSelectionPanelProps = {
  selectedAnimalId: GeneratedAnimalId;
  selectedCutId: string | null;
  isAnimalPreselected: boolean;
  onAnimalChange: (animalId: GeneratedAnimalId) => void;
  onPreviewCutChange: (cutId: string | null) => void;
  onStartCooking: (profile: GeneratedCutProfile) => void;
};

export type CookingWizardPanelProps = {
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
  onAnimalChange: (selectedAnimal: AnimalLabel) => void;
  onCutChange: (selectedCutId: string) => void;
  onCookingStepChange: (step: CookingWizardStep, method?: "push" | "replace") => void;
  onAdvancedThicknessEnabledChange: (value: boolean) => void;
  onDonenessChange: (value: string) => void;
  onEquipmentChange: (value: string) => void;
  onSizePresetChange: (value: CookingSizePreset) => void;
  onThicknessChange: (value: string) => void;
  onVegetableFormatChange: (value: VegetableFormat) => void;
  onWeightRangeChange: (value: CookingWeightRange) => void;
  onCheckedItemsChange: (value: Record<string, boolean>) => void;
  onGenerateCookingPlan: () => Promise<void>;
  onSaveMenu: () => Promise<void>;
};

export type CoccionModeScreenProps = {
  cookingStep: CookingWizardStep;
  lang: Lang;
  t: AppText;
  cutSelection: CutSelectionPanelProps;
  wizard: CookingWizardPanelProps;
};

export function CoccionModeScreen({
  cookingStep,
  lang,
  t,
  cutSelection,
  wizard,
}: CoccionModeScreenProps) {
  if (cookingStep === "cut") {
    return (
      <CutSelectionScreen
        selectedAnimal={cutSelection.selectedAnimalId}
        selectedCutId={cutSelection.selectedCutId}
        lang={lang}
        isAnimalPreselected={cutSelection.isAnimalPreselected}
        onAnimalChange={cutSelection.onAnimalChange}
        onPreviewCutChange={cutSelection.onPreviewCutChange}
        onStartCooking={cutSelection.onStartCooking}
      />
    );
  }

  return (
    <CookingWizard
      advancedThicknessEnabled={wizard.advancedThicknessEnabled}
      animal={wizard.animal}
      cookingStep={cookingStep}
      currentDonenessOptions={wizard.currentDonenessOptions}
      cut={wizard.cut}
      cuts={wizard.cuts}
      equipment={wizard.equipment}
      generateCookingPlan={wizard.onGenerateCookingPlan}
      getAnimalPreview={wizard.getAnimalPreview}
      handleAnimalChange={wizard.onAnimalChange}
      handleCutChange={wizard.onCutChange}
      lang={lang}
      loading={wizard.loading}
      selectedCut={wizard.selectedCut}
      saveMenuMessage={wizard.saveMenuMessage}
      saveMenuStatus={wizard.saveMenuStatus}
      setCookingStep={wizard.onCookingStepChange}
      setAdvancedThicknessEnabled={wizard.onAdvancedThicknessEnabledChange}
      setDoneness={wizard.onDonenessChange}
      setEquipment={wizard.onEquipmentChange}
      setSizePreset={wizard.onSizePresetChange}
      setThickness={wizard.onThicknessChange}
      setVegetableFormat={wizard.onVegetableFormatChange}
      setWeightRange={wizard.onWeightRangeChange}
      sizePreset={wizard.sizePreset}
      showThickness={wizard.showThickness}
      onSaveMenu={wizard.onSaveMenu}
      t={t}
      thickness={wizard.thickness}
      vegetableFormat={wizard.vegetableFormat}
      weightRange={wizard.weightRange}
      doneness={wizard.doneness}
      blocks={wizard.blocks}
      checkedItems={wizard.checkedItems}
      setCheckedItems={wizard.onCheckedItemsChange}
    />
  );
}
