// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data\assets\cuts-prompts.json

export const cutsVisualMap: Record<string, string> = {
  "beef:ribeye": "/cuts/beef_ribeye_grilled.webp",
  "beef:tomahawk": "/cuts/beef_tomahawk_grilled.webp",
  "beef:picanha": "/cuts/beef_picanha_grilled.webp",
  "beef:entrecote": "/cuts/beef_entrecote_grilled.webp",
  "beef:chuck": "/cuts/beef_chuck_grilled.webp"
};

export const CUTS_VISUAL_FALLBACK = "/cuts/beef_ribeye_raw.webp";

export function getCutsVisual(key?: string): string {
  if (!key) {
    return CUTS_VISUAL_FALLBACK;
  }
  return cutsVisualMap[key] ?? CUTS_VISUAL_FALLBACK;
}
