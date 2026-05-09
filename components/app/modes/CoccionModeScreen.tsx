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

export type CoccionModeScreenProps = {
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

  // Cooking wizard inputs
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

  // Wizard helpers
  getAnimalPreview: (animal: AnimalLabel, lang: Lang) => string;

  // Wizard handlers
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

export function CoccionModeScreen({
  cookingStep,
  lang,
  t,
  selectedAnimalId,
  selectedCutId,
  isAnimalPreselected,
  onCutSelectionAnimalChange,
  onCutSelectionPreviewChange,
  onCutSelectionStartCooking,
  animal,
  cut,
  cuts,
  selectedCut,
  currentDonenessOptions,
  doneness,
  equipment,
  thickness,
  showThickness,
  advancedThicknessEnabled,
  sizePreset,
  weightRange,
  vegetableFormat,
  loading,
  blocks,
  checkedItems,
  saveMenuStatus,
  saveMenuMessage,
  getAnimalPreview,
  onAnimalChange,
  onCutChange,
  onCookingStepChange,
  onAdvancedThicknessEnabledChange,
  onDonenessChange,
  onEquipmentChange,
  onSizePresetChange,
  onThicknessChange,
  onVegetableFormatChange,
  onWeightRangeChange,
  onCheckedItemsChange,
  onGenerateCookingPlan,
  onSaveMenu,
}: CoccionModeScreenProps) {
  if (cookingStep === "cut") {
    return (
      <CutSelectionScreen
        selectedAnimal={selectedAnimalId}
        selectedCutId={selectedCutId}
        lang={lang}
        isAnimalPreselected={isAnimalPreselected}
        onAnimalChange={onCutSelectionAnimalChange}
        onPreviewCutChange={onCutSelectionPreviewChange}
        onStartCooking={onCutSelectionStartCooking}
      />
    );
  }

  return (
    <CookingWizard
      advancedThicknessEnabled={advancedThicknessEnabled}
      animal={animal}
      cookingStep={cookingStep}
      currentDonenessOptions={currentDonenessOptions}
      cut={cut}
      cuts={cuts}
      equipment={equipment}
      generateCookingPlan={onGenerateCookingPlan}
      getAnimalPreview={getAnimalPreview}
      handleAnimalChange={onAnimalChange}
      handleCutChange={onCutChange}
      lang={lang}
      loading={loading}
      selectedCut={selectedCut}
      saveMenuMessage={saveMenuMessage}
      saveMenuStatus={saveMenuStatus}
      setCookingStep={onCookingStepChange}
      setAdvancedThicknessEnabled={onAdvancedThicknessEnabledChange}
      setDoneness={onDonenessChange}
      setEquipment={onEquipmentChange}
      setSizePreset={onSizePresetChange}
      setThickness={onThicknessChange}
      setVegetableFormat={onVegetableFormatChange}
      setWeightRange={onWeightRangeChange}
      sizePreset={sizePreset}
      showThickness={showThickness}
      onSaveMenu={onSaveMenu}
      t={t}
      thickness={thickness}
      vegetableFormat={vegetableFormat}
      weightRange={weightRange}
      doneness={doneness}
      blocks={blocks}
      checkedItems={checkedItems}
      setCheckedItems={onCheckedItemsChange}
    />
  );
}
