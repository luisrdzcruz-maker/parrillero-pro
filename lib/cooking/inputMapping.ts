export type InputSizePreset = "small" | "medium" | "large";
export type InputWeightRange = "light" | "medium" | "large";
export type ThicknessPreset = "thin" | "normal" | "thick";

export function mapSizePresetToThickness(sizePreset: InputSizePreset): string {
  if (sizePreset === "small") return "2.5";
  if (sizePreset === "large") return "5";
  return "3.5";
}

export function mapWeightRangeToKg(weightRange: InputWeightRange, wholeChicken: boolean): string {
  if (wholeChicken) {
    if (weightRange === "light") return "1.2";
    if (weightRange === "large") return "2";
    return "1.6";
  }

  if (weightRange === "light") return "0.8";
  if (weightRange === "large") return "1.8";
  return "1.2";
}

export function mapThicknessToSizePreset(thicknessValue: string): InputSizePreset {
  const parsed = Number(thicknessValue.replace(",", "."));
  if (!Number.isFinite(parsed)) return "medium";
  const preset = thicknessCmToPreset(parsed);
  if (preset === "thin") return "small";
  if (preset === "thick") return "large";
  return "medium";
}

export function thicknessCmToPreset(thicknessCm: number): ThicknessPreset {
  if (thicknessCm < 2) return "thin";
  if (thicknessCm <= 3.5) return "normal";
  return "thick";
}

export function mapBeefLargeWeightPresetToKg(weightRange: InputWeightRange): string {
  if (weightRange === "light") return "0.9";
  if (weightRange === "large") return "1.6";
  return "1.2";
}
