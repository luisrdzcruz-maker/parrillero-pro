// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data\assets\steps-prompts.json

export const stepsVisualMap: Record<string, string> = {
  "step_preheat_grill": "/steps/step_preheat_grill.webp",
  "step_sear_side_a": "/steps/step_sear_side_a.webp",
  "step_flip_steak": "/steps/step_flip_steak.webp",
  "step_indirect_cooking": "/steps/step_indirect_cooking.webp",
  "step_rest_board": "/steps/step_rest_board.webp",
  "step_slice_serve": "/steps/step_slice_serve.webp"
};

export const STEPS_VISUAL_FALLBACK = "/steps/step_preheat_grill.webp";

export function getStepsVisual(key?: string): string {
  if (!key) {
    return STEPS_VISUAL_FALLBACK;
  }
  return stepsVisualMap[key] ?? STEPS_VISUAL_FALLBACK;
}
