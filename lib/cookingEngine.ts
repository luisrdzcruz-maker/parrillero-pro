export {
  animalCatalog,
  animalDoneness,
  beefTemps,
  chickenTemps,
  donenessCatalog,
  fishTemps,
  porkTemps,
  productCatalog,
} from "./cookingCatalog";

export type {
  AnimalId,
  CatalogAnimal,
  CookingInput,
  CookingMethod,
  CookingPlan,
  CookingStep,
  CookingStyle,
  DonenessId,
  DonenessOption,
  Language,
  ProductCut,
  TargetTemp,
} from "./cookingCatalog";

export {
  generateCookingPlan,
  generateCookingSteps,
  getAnimalByName,
  getCutById,
  getCutForInput,
  getCutsByAnimal,
  getDonenessOptions,
  shouldShowThickness,
} from "./cookingRules";
export {
  adaptLegacyCookingInput,
  applyCookingSafetyRules,
  resolveLegacyAnimalId,
  resolveLegacyCutId,
  resolveLegacyDonenessId,
} from "./legacyCookingInputAdapter";
export { resolveCookingProfile, resolveProductCut } from "./resolveCookingProfile";
export { validateCookingEngineOutput, COOKING_WARNING_CODES } from "./cookingOutputValidation";
export type {
  CookingOutputWarning,
  CookingValidationResult,
  CookingWarningCode,
  ValidateCookingOutputOptions,
} from "./cookingOutputValidation";
export type { AdaptedCookingInput } from "./legacyCookingInputAdapter";
export type { CookingProfileSource, ResolvedCookingProfile } from "./resolveCookingProfile";
