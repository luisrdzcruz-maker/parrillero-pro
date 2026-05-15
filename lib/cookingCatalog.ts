import type { Animal } from "@/lib/types/domain";
import type { Lang } from "@/lib/i18n/texts";
import type { CookingTimeSemantics } from "./cookingTimeSemantics";
import type { PrepGuidance } from "./prepGuidance";
import type { PlanningMetadata } from "./planning/types";
import { getTargetTempsForProfile, type DonenessTemperatureProfileId } from "./donenessProfiles";

export type CookingInput = {
  animal: string;
  cut: string;
  weightKg: string;
  thicknessCm: string;
  doneness: string;
  equipment: string;
  language: "es" | "en";
};

export type CookingPlan = Record<string, string> & {
  readonly timeSemantics?: CookingTimeSemantics;
  readonly prepGuidance?: PrepGuidance;
  readonly planningMetadata?: PlanningMetadata;
};

export type CookingStep = {
  title: string;
  duration: number;
  description: string;
  image?: string;
  tips?: string[];
  assistantCue?: string;
  warningCue?: string;
};

export type AnimalId = Animal;
export type CookingMethod =
  | "grill_direct"
  | "grill_indirect"
  | "reverse_sear"
  | "oven_pan"
  | "vegetables_grill";
export type DonenessId =
  | "blue"
  | "rare"
  | "medium_rare"
  | "medium"
  | "medium_well"
  | "well_done"
  | "juicy_safe"
  | "medium_safe"
  | "safe"
  | "juicy";

export type CookingStyle =
  | "fast"
  | "thick"
  | "reverse"
  | "fatcap"
  | "lowSlow"
  | "crispy"
  | "poultry"
  | "fish"
  | "vegetable";

export type CatalogAnimal = {
  id: AnimalId;
  names: Record<Lang, string>;
};

export type DonenessOption = {
  id: DonenessId;
  names: Record<Lang, string>;
};

export type TargetTemp = {
  pull: number;
  final: number;
};

export type ProductCut = {
  id: string;
  animalId: AnimalId;
  inputProfileId?: string;
  donenessProfileId?: DonenessTemperatureProfileId;
  names: Record<Lang, string>;
  defaultThicknessCm: number;
  showThickness: boolean;
  allowedMethods: CookingMethod[];
  allowedDoneness: DonenessId[];
  targetTempsC?: Partial<Record<DonenessId, TargetTemp>>;
  restingMinutes: number;
  cookingMinutes?: number;
  notes?: Partial<Record<Lang, string>>;
  tips?: Partial<Record<Lang, string[]>>;
  style: CookingStyle;
  defaultMethod: CookingMethod;
  error: Record<"es" | "en", string>;
  aliases?: string[];
};

type VegetableSeed = readonly [id: string, es: string, en: string, minutes: number];

export const animalCatalog: CatalogAnimal[] = [
  { id: "beef", names: { es: "Vacuno", en: "Beef" } },
  { id: "pork", names: { es: "Cerdo", en: "Pork" } },
  { id: "chicken", names: { es: "Pollo", en: "Chicken" } },
  { id: "fish", names: { es: "Pescado", en: "Fish" } },
  { id: "vegetables", names: { es: "Verduras", en: "Vegetables" } },
];

export const donenessCatalog: Record<DonenessId, DonenessOption> = {
  blue: { id: "blue", names: { es: "blue", en: "blue" } },
  rare: { id: "rare", names: { es: "poco hecho", en: "rare" } },
  medium_rare: {
    id: "medium_rare",
    names: { es: "medium rare", en: "medium rare" },
  },
  medium: { id: "medium", names: { es: "medium", en: "medium" } },
  medium_well: { id: "medium_well", names: { es: "hecho", en: "medium well" } },
  well_done: { id: "well_done", names: { es: "muy hecho", en: "well done" } },
  juicy_safe: {
    id: "juicy_safe",
    names: { es: "jugoso seguro", en: "juicy safe" },
  },
  medium_safe: {
    id: "medium_safe",
    names: { es: "medio seguro", en: "medium safe" },
  },
  safe: { id: "safe", names: { es: "seguro", en: "safe" } },
  juicy: { id: "juicy", names: { es: "jugoso", en: "juicy" } },
};

export const animalDoneness: Record<AnimalId, DonenessId[]> = {
  beef: ["blue", "rare", "medium_rare", "medium", "medium_well", "well_done"],
  pork: ["juicy_safe", "medium_safe", "well_done"],
  chicken: ["safe", "well_done"],
  fish: ["juicy", "medium", "well_done"],
  vegetables: [],
};

export const beefTemps = getTargetTempsForProfile("beefSteakCuts") as Record<DonenessId, TargetTemp>;

export const porkTemps = getTargetTempsForProfile("porkSafeCuts") as Record<DonenessId, TargetTemp>;

export const chickenTemps = getTargetTempsForProfile("chickenSafeCuts") as Partial<
  Record<DonenessId, TargetTemp>
>;

export const fishTemps = getTargetTempsForProfile("fishCuts") as Partial<
  Record<DonenessId, TargetTemp>
>;

export const productCatalog: ProductCut[] = [
  {
    id: "aguja",
    animalId: "beef",
    names: { es: "Aguja", en: "Chuck" },
    defaultThicknessCm: 5,
    showThickness: true,
    allowedMethods: ["grill_direct", "grill_indirect", "oven_pan"],
    allowedDoneness: animalDoneness.beef,
    targetTempsC: beefTemps,
    restingMinutes: 7,
    style: "thick",
    defaultMethod: "grill_indirect",
    error: {
      es: "Tratarlo como un steak fino: necesita control y algo más de tiempo.",
      en: "Treating it like a thin steak: it needs control and a little more time.",
    },
    aliases: ["Aguja", "Chuck", "Aguja / Chuck"],
  },
  {
    id: "lomo_alto",
    animalId: "beef",
    inputProfileId: "beef-large",
    names: { es: "Lomo alto", en: "Rib steak" },
    defaultThicknessCm: 5,
    showThickness: true,
    allowedMethods: ["grill_direct", "grill_indirect", "oven_pan"],
    allowedDoneness: animalDoneness.beef,
    targetTempsC: beefTemps,
    restingMinutes: 7,
    style: "thick",
    defaultMethod: "grill_indirect",
    error: {
      es: "Pasarse de temperatura: sube rápido al final.",
      en: "Overshooting the temperature: it climbs quickly at the end.",
    },
    aliases: ["Lomo alto"],
  },
  {
    id: "tomahawk",
    animalId: "beef",
    inputProfileId: "beef-large",
    names: { es: "Tomahawk", en: "Tomahawk" },
    defaultThicknessCm: 6,
    showThickness: true,
    allowedMethods: ["reverse_sear", "grill_indirect", "oven_pan"],
    allowedDoneness: animalDoneness.beef,
    targetTempsC: beefTemps,
    restingMinutes: 10,
    style: "reverse",
    defaultMethod: "reverse_sear",
    error: {
      es: "Cocinarlo solo directo: se quema fuera antes de llegar dentro.",
      en: "Cooking it only over direct heat: it burns outside before the center is ready.",
    },
    aliases: ["Tomahawk"],
  },
  {
    id: "entrecote",
    animalId: "beef",
    inputProfileId: "beef-steak",
    names: { es: "Entrecote", en: "Ribeye" },
    defaultThicknessCm: 3,
    showThickness: true,
    allowedMethods: ["grill_direct", "oven_pan"],
    allowedDoneness: animalDoneness.beef,
    targetTempsC: beefTemps,
    restingMinutes: 5,
    style: "fast",
    defaultMethod: "grill_direct",
    error: {
      es: "Moverlo demasiado y perder costra.",
      en: "Moving it too much and losing the crust.",
    },
    aliases: ["Entrecote", "Ribeye", "Entrecote / Ribeye"],
  },
  {
    id: "picanha",
    animalId: "beef",
    inputProfileId: "beef-large",
    names: { es: "Picanha", en: "Picanha" },
    defaultThicknessCm: 4,
    showThickness: true,
    allowedMethods: ["grill_direct", "grill_indirect", "oven_pan"],
    allowedDoneness: animalDoneness.beef,
    targetTempsC: beefTemps,
    restingMinutes: 7,
    style: "fatcap",
    defaultMethod: "grill_indirect",
    error: {
      es: "Quemar la grasa antes de fundirla.",
      en: "Burning the fat cap before rendering it.",
    },
    aliases: ["Picanha"],
  },
  {
    id: "maminha",
    animalId: "beef",
    names: { es: "Maminha", en: "Tri-tip" },
    defaultThicknessCm: 4,
    showThickness: true,
    allowedMethods: ["grill_direct", "grill_indirect", "oven_pan"],
    allowedDoneness: animalDoneness.beef,
    targetTempsC: beefTemps,
    restingMinutes: 7,
    style: "thick",
    defaultMethod: "grill_indirect",
    error: {
      es: "Cortarla en dirección incorrecta.",
      en: "Slicing it in the wrong direction.",
    },
    aliases: ["Maminha"],
  },
  {
    id: "bavette",
    animalId: "beef",
    names: { es: "Bavette", en: "Bavette" },
    defaultThicknessCm: 2,
    showThickness: false,
    allowedMethods: ["grill_direct", "oven_pan"],
    allowedDoneness: animalDoneness.beef,
    targetTempsC: beefTemps,
    restingMinutes: 5,
    style: "fast",
    defaultMethod: "grill_direct",
    error: {
      es: "Pasarla de punto: se endurece rápido.",
      en: "Overcooking it: it gets tough quickly.",
    },
    aliases: ["Bavette", "Babette"],
  },
  {
    id: "entrana",
    animalId: "beef",
    names: { es: "Entraña", en: "Skirt steak" },
    defaultThicknessCm: 2,
    showThickness: false,
    allowedMethods: ["grill_direct", "oven_pan"],
    allowedDoneness: animalDoneness.beef,
    targetTempsC: beefTemps,
    restingMinutes: 5,
    style: "fast",
    defaultMethod: "grill_direct",
    error: {
      es: "No cortar contra la fibra.",
      en: "Not slicing against the grain.",
    },
    aliases: ["Entraña", "Skirt steak", "Skirt steak / Entraña"],
  },
  {
    id: "secreto_iberico",
    animalId: "pork",
    inputProfileId: "pork-fast",
    names: { es: "Secreto ibérico", en: "Iberian secreto" },
    defaultThicknessCm: 2,
    showThickness: false,
    allowedMethods: ["grill_direct", "oven_pan"],
    allowedDoneness: animalDoneness.pork,
    targetTempsC: porkTemps,
    restingMinutes: 4,
    style: "fast",
    defaultMethod: "grill_direct",
    error: {
      es: "Pasarlo demasiado: pierde jugos y se vuelve grasiento/seco.",
      en: "Overcooking it: it loses juice and turns greasy or dry.",
    },
    aliases: ["Secreto ibérico"],
  },
  {
    id: "presa_iberica",
    animalId: "pork",
    inputProfileId: "pork-fast",
    names: { es: "Presa ibérica", en: "Iberian presa" },
    defaultThicknessCm: 4,
    showThickness: true,
    allowedMethods: ["grill_direct", "grill_indirect", "oven_pan"],
    allowedDoneness: animalDoneness.pork,
    targetTempsC: porkTemps,
    restingMinutes: 7,
    style: "thick",
    defaultMethod: "grill_indirect",
    error: {
      es: "Cortarla nada más salir: necesita reposo para quedar jugosa.",
      en: "Slicing it immediately: it needs rest to stay juicy.",
    },
    aliases: ["Presa ibérica"],
  },
  {
    id: "costillas",
    animalId: "pork",
    names: { es: "Costillas", en: "Ribs" },
    defaultThicknessCm: 5,
    showThickness: false,
    allowedMethods: ["grill_indirect"],
    allowedDoneness: ["well_done"],
    targetTempsC: porkTemps,
    restingMinutes: 15,
    style: "lowSlow",
    defaultMethod: "grill_indirect",
    error: {
      es: "Hacerlas rápido a fuego directo: quedan duras y quemadas.",
      en: "Cooking them fast over direct heat: they turn tough and burnt.",
    },
    aliases: ["Costillas"],
  },
  {
    id: "panceta",
    animalId: "pork",
    inputProfileId: "pork-fast",
    names: { es: "Panceta", en: "Pork belly" },
    defaultThicknessCm: 4,
    showThickness: true,
    allowedMethods: ["grill_indirect", "oven_pan"],
    allowedDoneness: ["well_done"],
    targetTempsC: porkTemps,
    restingMinutes: 8,
    style: "crispy",
    defaultMethod: "grill_indirect",
    error: {
      es: "Ponerla al fuego máximo desde el principio: se quema antes de quedar tierna.",
      en: "Starting at maximum heat: it burns before becoming tender.",
    },
    aliases: ["Panceta"],
  },
  {
    id: "solomillo",
    animalId: "pork",
    names: { es: "Solomillo", en: "Tenderloin" },
    defaultThicknessCm: 3,
    showThickness: true,
    allowedMethods: ["grill_direct", "oven_pan"],
    allowedDoneness: animalDoneness.pork,
    targetTempsC: porkTemps,
    restingMinutes: 5,
    style: "fast",
    defaultMethod: "grill_direct",
    error: {
      es: "Pasarlo de temperatura: es magro y se seca muy rápido.",
      en: "Overshooting the temperature: it is lean and dries very fast.",
    },
    aliases: ["Solomillo"],
  },
  {
    id: "pork_chop",
    animalId: "pork",
    names: { es: "Chuleta de cerdo", en: "Pork chop" },
    defaultThicknessCm: 3,
    showThickness: true,
    allowedMethods: ["grill_direct", "grill_indirect", "oven_pan"],
    allowedDoneness: animalDoneness.pork,
    targetTempsC: porkTemps,
    restingMinutes: 5,
    style: "thick",
    defaultMethod: "grill_indirect",
    error: {
      es: "Cocinarla sin reposo: la chuleta pierde jugo al cortarla.",
      en: "Skipping the rest: the chop loses juice when sliced.",
    },
    aliases: ["Chuleta de cerdo", "Pork chop"],
  },
  {
    id: "muslos",
    animalId: "chicken",
    names: { es: "Muslos", en: "Thighs" },
    defaultThicknessCm: 4,
    showThickness: false,
    allowedMethods: ["grill_indirect", "grill_direct", "oven_pan"],
    allowedDoneness: animalDoneness.chicken,
    targetTempsC: chickenTemps,
    restingMinutes: 5,
    style: "poultry",
    defaultMethod: "grill_indirect",
    error: {
      es: "Dorarlo fuerte antes de cocinar el interior: la piel se quema y queda crudo dentro.",
      en: "Browning hard before cooking through: the skin burns while the center stays underdone.",
    },
    aliases: ["Muslos", "Thighs"],
  },
  {
    id: "alitas",
    animalId: "chicken",
    names: { es: "Alitas", en: "Wings" },
    defaultThicknessCm: 2,
    showThickness: false,
    allowedMethods: ["grill_indirect", "grill_direct", "oven_pan"],
    allowedDoneness: animalDoneness.chicken,
    targetTempsC: chickenTemps,
    restingMinutes: 3,
    style: "poultry",
    defaultMethod: "grill_indirect",
    error: {
      es: "Ponerlas sobre llama constante: se queman antes de quedar jugosas.",
      en: "Keeping them over constant flame: they burn before staying juicy.",
    },
    aliases: ["Alitas", "Wings"],
  },
  {
    id: "pechuga",
    animalId: "chicken",
    inputProfileId: "chicken-breast",
    names: { es: "Pechuga", en: "Breast" },
    defaultThicknessCm: 3,
    showThickness: true,
    allowedMethods: ["grill_direct", "grill_indirect", "oven_pan"],
    allowedDoneness: animalDoneness.chicken,
    targetTempsC: chickenTemps,
    restingMinutes: 5,
    style: "poultry",
    defaultMethod: "grill_indirect",
    error: {
      es: "Pasarla de 74°C durante demasiado tiempo: se seca rápido.",
      en: "Holding it past 74°C for too long: it dries quickly.",
    },
    aliases: ["Pechuga", "Breast"],
  },
  {
    id: "pollo_entero",
    animalId: "chicken",
    inputProfileId: "poultry-whole",
    names: { es: "Pollo entero", en: "Whole chicken" },
    defaultThicknessCm: 6,
    showThickness: false,
    allowedMethods: ["grill_indirect", "oven_pan"],
    allowedDoneness: animalDoneness.chicken,
    targetTempsC: chickenTemps,
    restingMinutes: 10,
    style: "poultry",
    defaultMethod: "grill_indirect",
    error: {
      es: "Cocinarlo solo directo: se quema fuera antes de llegar al interior.",
      en: "Cooking it only direct: it burns outside before the center is ready.",
    },
    aliases: ["Pollo entero", "Whole chicken"],
  },
  {
    id: "rodaballo",
    animalId: "fish",
    inputProfileId: "fish-whole",
    names: { es: "Rodaballo", en: "Turbot" },
    defaultThicknessCm: 3,
    showThickness: true,
    allowedMethods: ["grill_direct", "oven_pan"],
    allowedDoneness: animalDoneness.fish,
    targetTempsC: fishTemps,
    restingMinutes: 2,
    style: "fish",
    defaultMethod: "grill_direct",
    error: {
      es: "Moverlo demasiado: la piel se pega y se rompe.",
      en: "Moving it too much: the skin sticks and tears.",
    },
    aliases: ["Rodaballo", "Turbot"],
  },
  {
    id: "salmon",
    animalId: "fish",
    inputProfileId: "fish-fillet",
    names: { es: "Salmón", en: "Salmon" },
    defaultThicknessCm: 3,
    showThickness: true,
    allowedMethods: ["grill_direct", "oven_pan"],
    allowedDoneness: animalDoneness.fish,
    targetTempsC: fishTemps,
    restingMinutes: 2,
    style: "fish",
    defaultMethod: "grill_direct",
    error: {
      es: "Cocinarlo sin secar la piel: pierde costra y se pega.",
      en: "Cooking without drying the skin: it loses crust and sticks.",
    },
    aliases: ["Salmón", "Salmon"],
  },
  {
    id: "lubina",
    animalId: "fish",
    inputProfileId: "fish-whole",
    names: { es: "Lubina", en: "Sea bass" },
    defaultThicknessCm: 2,
    showThickness: true,
    allowedMethods: ["grill_direct", "oven_pan"],
    allowedDoneness: animalDoneness.fish,
    targetTempsC: fishTemps,
    restingMinutes: 2,
    style: "fish",
    defaultMethod: "grill_direct",
    error: {
      es: "Fuego excesivo todo el tiempo: se seca antes de dorar bien.",
      en: "Using excessive heat the whole time: it dries before browning well.",
    },
    aliases: ["Lubina", "Sea bass"],
  },
  {
    id: "dorada",
    animalId: "fish",
    inputProfileId: "fish-whole",
    names: { es: "Dorada", en: "Sea bream" },
    defaultThicknessCm: 2,
    showThickness: true,
    allowedMethods: ["grill_direct", "oven_pan"],
    allowedDoneness: animalDoneness.fish,
    targetTempsC: fishTemps,
    restingMinutes: 2,
    style: "fish",
    defaultMethod: "grill_direct",
    error: {
      es: "Darle demasiadas vueltas: se rompe y pierde jugos.",
      en: "Turning it too often: it breaks and loses juices.",
    },
    aliases: ["Dorada", "Sea bream"],
  },
  ...(
    [
      ["maiz", "Maíz", "Corn", 25],
      ["berenjena", "Berenjena", "Eggplant", 18],
      ["patata", "Patata", "Potato", 45],
      ["esparragos", "Espárragos", "Asparagus", 8],
      ["pimientos", "Pimientos", "Peppers", 14],
      ["calabacin", "Calabacín", "Zucchini", 10],
      ["setas", "Setas", "Mushrooms", 10],
    ] satisfies VegetableSeed[]
  ).map(
    ([id, es, en, minutes]) =>
      ({
        id,
        animalId: "vegetables",
        inputProfileId: "vegetable-format",
        names: { es, en },
        defaultThicknessCm: 2,
        showThickness: false,
        allowedMethods: ["vegetables_grill"],
        allowedDoneness: [],
        restingMinutes: 1,
        cookingMinutes: minutes,
        notes: {
          es: "Usa aceite, sal y calor directo controlado. Retira cuando esté tierno y dorado.",
          en: "Use oil, salt and controlled direct heat. Pull when tender and browned.",
        },
        style: "vegetable",
        defaultMethod: "vegetables_grill",
        error: {
          es: "Quemarlas por fuera antes de ablandarlas.",
          en: "Burning the outside before the inside softens.",
        },
        aliases: [es, en],
        tips: {
          es: [`Tiempo base: ${minutes} min`, "Cortar uniforme", "Aceite antes de la parrilla"],
          en: [`Base time: ${minutes} min`, "Cut evenly", "Oil before grilling"],
        },
      }) satisfies ProductCut,
  ),
];
