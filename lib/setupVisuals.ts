export type SetupImageInput = {
  equipment?: string;
  method?: string;
};

type EquipmentKind = "gas" | "charcoal" | "kamado";
type SetupMethod = "direct" | "indirect";

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

function getSetupMethod(method = ""): SetupMethod {
  const value = normalize(method);

  if (
    value.includes("indirect") ||
    value.includes("indirecto") ||
    value.includes("reverse") ||
    value.includes("2 zone") ||
    value.includes("dos zonas")
  ) {
    return "indirect";
  }

  return "direct";
}

export function getSetupImage({ equipment, method }: SetupImageInput) {
  const equipmentKind = getEquipmentKind(equipment);
  if (!equipmentKind) return null;

  if (equipmentKind === "kamado") return "/visuals/setup/kamado.webp";

  const setupMethod = getSetupMethod(method);

  if (equipmentKind === "charcoal") {
    return setupMethod === "indirect"
      ? "/visuals/setup/charcoal-2zone.webp"
      : "/visuals/setup/charcoal-direct.webp";
  }

  return setupMethod === "indirect"
    ? "/visuals/setup/gas-indirect.webp"
    : "/visuals/setup/gas-direct.webp";
}
