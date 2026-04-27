export type SetupImageInput = {
  equipment?: string;
  heatType?: string;
  method?: string;
};

type EquipmentKind = "gas" | "charcoal" | "kamado";
type SetupMethod = "direct" | "indirect" | "oneZone";

export const SETUP_PLACEHOLDER_IMAGE = "/visuals/setup/setup-placeholder.webp";

function normalize(value = "") {
  return value.toLowerCase();
}

function getEquipmentKind(equipment = ""): EquipmentKind | null {
  const value = normalize(equipment);

  if (value.includes("kamado")) return "kamado";
  if (value.includes("carbón") || value.includes("carbon") || value.includes("charcoal")) return "charcoal";
  if (value.includes("gas") || value.includes("napoleon") || value.includes("rogue")) return "gas";

  return null;
}

function getSetupMethod(method = "", heatType = ""): SetupMethod {
  const value = `${normalize(method)} ${normalize(heatType)}`;

  if (
    value.includes("1 zone") ||
    value.includes("one zone") ||
    value.includes("una zona")
  ) {
    return "oneZone";
  }

  if (
    value.includes("2 zone") ||
    value.includes("two zone") ||
    value.includes("dos zonas") ||
    value.includes("indirect") ||
    value.includes("indirecto") ||
    value.includes("reverse")
  ) {
    return "indirect";
  }

  return "direct";
}

export function getSetupImage({ equipment, heatType, method }: SetupImageInput) {
  const equipmentKind = getEquipmentKind(equipment);
  if (!equipmentKind) return SETUP_PLACEHOLDER_IMAGE;

  if (equipmentKind === "kamado") return "/visuals/setup/kamado-airflow.webp";

  const setupMethod = getSetupMethod(method, heatType);

  if (equipmentKind === "charcoal") {
    if (setupMethod === "oneZone") return "/visuals/setup/charcoal-1zone.webp";
    if (setupMethod === "indirect") return "/visuals/setup/charcoal-2zone.webp";
    return "/visuals/setup/charcoal-direct.webp";
  }

  return setupMethod === "indirect"
    ? "/visuals/setup/gas-indirect.webp"
    : "/visuals/setup/gas-direct.webp";
}
