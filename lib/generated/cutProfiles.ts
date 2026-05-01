// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data\cuts\cut-profiles.csv

export type GeneratedAnimalId = "beef" | "pork" | "chicken" | "fish" | "vegetables";
export type GeneratedCookingMethod =
  | "grill_direct"
  | "grill_indirect"
  | "reverse_sear"
  | "oven_pan"
  | "vegetables_grill";
export type GeneratedDonenessId =
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
export type GeneratedCookingStyle =
  | "fast"
  | "thick"
  | "reverse"
  | "fatcap"
  | "lowSlow"
  | "crispy"
  | "poultry"
  | "fish"
  | "vegetable";

export type GeneratedCutProfile = {
  id: string;
  animalId: GeneratedAnimalId;
  canonicalNameEn: string;
  inputProfileId: string;
  defaultThicknessCm: number;
  showThickness: boolean;
  allowedMethods: GeneratedCookingMethod[];
  defaultMethod: GeneratedCookingMethod;
  allowedDoneness: GeneratedDonenessId[];
  style: GeneratedCookingStyle;
  restingMinutes: number;
  cookingMinutes?: number;
  errorEn: string;
  aliasesEn: string[];
  notesEn?: string;
  tipsEn: string[];
};

export const generatedCutProfiles = [
  {
    "id": "aguja",
    "animalId": "beef",
    "canonicalNameEn": "Chuck",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 5,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "grill_indirect",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "blue",
      "rare",
      "medium_rare",
      "medium",
      "medium_well",
      "well_done"
    ],
    "style": "thick",
    "restingMinutes": 7,
    "errorEn": "Treating it like a thin steak: it needs control and a little more time.",
    "aliasesEn": [
      "Aguja",
      "Chuck"
    ],
    "tipsEn": []
  },
  {
    "id": "lomo_alto",
    "animalId": "beef",
    "canonicalNameEn": "Rib steak",
    "inputProfileId": "beef-large",
    "defaultThicknessCm": 5,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "grill_indirect",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "blue",
      "rare",
      "medium_rare",
      "medium",
      "medium_well",
      "well_done"
    ],
    "style": "thick",
    "restingMinutes": 7,
    "errorEn": "Overshooting the temperature: it climbs quickly at the end.",
    "aliasesEn": [
      "Lomo alto",
      "Rib steak"
    ],
    "tipsEn": []
  },
  {
    "id": "tomahawk",
    "animalId": "beef",
    "canonicalNameEn": "Tomahawk",
    "inputProfileId": "beef-large",
    "defaultThicknessCm": 6,
    "showThickness": true,
    "allowedMethods": [
      "reverse_sear",
      "grill_indirect",
      "oven_pan"
    ],
    "defaultMethod": "reverse_sear",
    "allowedDoneness": [
      "blue",
      "rare",
      "medium_rare",
      "medium",
      "medium_well",
      "well_done"
    ],
    "style": "reverse",
    "restingMinutes": 10,
    "errorEn": "Cooking it only over direct heat: it burns outside before the center is ready.",
    "aliasesEn": [
      "Tomahawk"
    ],
    "tipsEn": []
  },
  {
    "id": "entrecote",
    "animalId": "beef",
    "canonicalNameEn": "Ribeye",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "blue",
      "rare",
      "medium_rare",
      "medium",
      "medium_well",
      "well_done"
    ],
    "style": "fast",
    "restingMinutes": 5,
    "errorEn": "Moving it too much and losing the crust.",
    "aliasesEn": [
      "Entrecote",
      "Ribeye"
    ],
    "tipsEn": []
  },
  {
    "id": "picanha",
    "animalId": "beef",
    "canonicalNameEn": "Picanha",
    "inputProfileId": "beef-large",
    "defaultThicknessCm": 4,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "grill_indirect",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "blue",
      "rare",
      "medium_rare",
      "medium",
      "medium_well",
      "well_done"
    ],
    "style": "fatcap",
    "restingMinutes": 7,
    "errorEn": "Burning the fat cap before rendering it.",
    "aliasesEn": [
      "Picanha"
    ],
    "tipsEn": []
  },
  {
    "id": "maminha",
    "animalId": "beef",
    "canonicalNameEn": "Tri-tip",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 4,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "grill_indirect",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "blue",
      "rare",
      "medium_rare",
      "medium",
      "medium_well",
      "well_done"
    ],
    "style": "thick",
    "restingMinutes": 7,
    "errorEn": "Slicing it in the wrong direction.",
    "aliasesEn": [
      "Maminha",
      "Tri-tip"
    ],
    "tipsEn": []
  },
  {
    "id": "bavette",
    "animalId": "beef",
    "canonicalNameEn": "Bavette",
    "inputProfileId": "default",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "blue",
      "rare",
      "medium_rare",
      "medium",
      "medium_well",
      "well_done"
    ],
    "style": "fast",
    "restingMinutes": 5,
    "errorEn": "Overcooking it: it gets tough quickly.",
    "aliasesEn": [
      "Bavette",
      "Babette"
    ],
    "tipsEn": []
  },
  {
    "id": "entrana",
    "animalId": "beef",
    "canonicalNameEn": "Skirt steak",
    "inputProfileId": "default",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "blue",
      "rare",
      "medium_rare",
      "medium",
      "medium_well",
      "well_done"
    ],
    "style": "fast",
    "restingMinutes": 5,
    "errorEn": "Not slicing against the grain.",
    "aliasesEn": [
      "Entrana",
      "Skirt steak"
    ],
    "tipsEn": []
  },
  {
    "id": "secreto_iberico",
    "animalId": "pork",
    "canonicalNameEn": "Iberian secreto",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "juicy_safe",
      "medium_safe",
      "well_done"
    ],
    "style": "fast",
    "restingMinutes": 4,
    "errorEn": "Overcooking it: it loses juice and turns greasy or dry.",
    "aliasesEn": [
      "Iberian secreto"
    ],
    "tipsEn": []
  },
  {
    "id": "presa_iberica",
    "animalId": "pork",
    "canonicalNameEn": "Iberian presa",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 4,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "grill_indirect",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "juicy_safe",
      "medium_safe",
      "well_done"
    ],
    "style": "thick",
    "restingMinutes": 7,
    "errorEn": "Slicing it immediately: it needs rest to stay juicy.",
    "aliasesEn": [
      "Iberian presa"
    ],
    "tipsEn": []
  },
  {
    "id": "costillas",
    "animalId": "pork",
    "canonicalNameEn": "Ribs",
    "inputProfileId": "default",
    "defaultThicknessCm": 5,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "well_done"
    ],
    "style": "lowSlow",
    "restingMinutes": 15,
    "errorEn": "Cooking them fast over direct heat: they turn tough and burnt.",
    "aliasesEn": [
      "Ribs"
    ],
    "tipsEn": []
  },
  {
    "id": "panceta",
    "animalId": "pork",
    "canonicalNameEn": "Pork belly",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 4,
    "showThickness": true,
    "allowedMethods": [
      "grill_indirect",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "well_done"
    ],
    "style": "crispy",
    "restingMinutes": 8,
    "errorEn": "Starting at maximum heat: it burns before becoming tender.",
    "aliasesEn": [
      "Pork belly"
    ],
    "tipsEn": []
  },
  {
    "id": "solomillo",
    "animalId": "pork",
    "canonicalNameEn": "Tenderloin",
    "inputProfileId": "default",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "juicy_safe",
      "medium_safe",
      "well_done"
    ],
    "style": "fast",
    "restingMinutes": 5,
    "errorEn": "Overshooting the temperature: it is lean and dries very fast.",
    "aliasesEn": [
      "Tenderloin"
    ],
    "tipsEn": []
  },
  {
    "id": "pork_chop",
    "animalId": "pork",
    "canonicalNameEn": "Pork chop",
    "inputProfileId": "default",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "grill_indirect",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "juicy_safe",
      "medium_safe",
      "well_done"
    ],
    "style": "thick",
    "restingMinutes": 5,
    "errorEn": "Skipping the rest: the chop loses juice when sliced.",
    "aliasesEn": [
      "Pork chop"
    ],
    "tipsEn": []
  },
  {
    "id": "muslos",
    "animalId": "chicken",
    "canonicalNameEn": "Thighs",
    "inputProfileId": "default",
    "defaultThicknessCm": 4,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect",
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "safe",
      "well_done"
    ],
    "style": "poultry",
    "restingMinutes": 5,
    "errorEn": "Browning hard before cooking through: the skin burns while the center stays underdone.",
    "aliasesEn": [
      "Thighs"
    ],
    "tipsEn": []
  },
  {
    "id": "alitas",
    "animalId": "chicken",
    "canonicalNameEn": "Wings",
    "inputProfileId": "default",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect",
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "safe",
      "well_done"
    ],
    "style": "poultry",
    "restingMinutes": 3,
    "errorEn": "Keeping them over constant flame: they burn before staying juicy.",
    "aliasesEn": [
      "Wings"
    ],
    "tipsEn": []
  },
  {
    "id": "pechuga",
    "animalId": "chicken",
    "canonicalNameEn": "Breast",
    "inputProfileId": "chicken-breast",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "grill_indirect",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "safe",
      "well_done"
    ],
    "style": "poultry",
    "restingMinutes": 5,
    "errorEn": "Holding it past 74C for too long: it dries quickly.",
    "aliasesEn": [
      "Breast"
    ],
    "tipsEn": []
  },
  {
    "id": "pollo_entero",
    "animalId": "chicken",
    "canonicalNameEn": "Whole chicken",
    "inputProfileId": "poultry-whole",
    "defaultThicknessCm": 6,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "safe",
      "well_done"
    ],
    "style": "poultry",
    "restingMinutes": 10,
    "errorEn": "Cooking it only direct: it burns outside before the center is ready.",
    "aliasesEn": [
      "Whole chicken"
    ],
    "tipsEn": []
  },
  {
    "id": "rodaballo",
    "animalId": "fish",
    "canonicalNameEn": "Turbot",
    "inputProfileId": "fish-whole",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "juicy",
      "medium",
      "well_done"
    ],
    "style": "fish",
    "restingMinutes": 2,
    "errorEn": "Moving it too much: the skin sticks and tears.",
    "aliasesEn": [
      "Turbot"
    ],
    "tipsEn": []
  },
  {
    "id": "salmon",
    "animalId": "fish",
    "canonicalNameEn": "Salmon",
    "inputProfileId": "fish-fillet",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "juicy",
      "medium",
      "well_done"
    ],
    "style": "fish",
    "restingMinutes": 2,
    "errorEn": "Cooking without drying the skin: it loses crust and sticks.",
    "aliasesEn": [
      "Salmon"
    ],
    "tipsEn": []
  },
  {
    "id": "lubina",
    "animalId": "fish",
    "canonicalNameEn": "Sea bass",
    "inputProfileId": "fish-whole",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "juicy",
      "medium",
      "well_done"
    ],
    "style": "fish",
    "restingMinutes": 2,
    "errorEn": "Using excessive heat the whole time: it dries before browning well.",
    "aliasesEn": [
      "Sea bass"
    ],
    "tipsEn": []
  },
  {
    "id": "dorada",
    "animalId": "fish",
    "canonicalNameEn": "Sea bream",
    "inputProfileId": "fish-whole",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "juicy",
      "medium",
      "well_done"
    ],
    "style": "fish",
    "restingMinutes": 2,
    "errorEn": "Turning it too often: it breaks and loses juices.",
    "aliasesEn": [
      "Sea bream"
    ],
    "tipsEn": []
  },
  {
    "id": "maiz",
    "animalId": "vegetables",
    "canonicalNameEn": "Corn",
    "inputProfileId": "vegetable-format",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "vegetables_grill"
    ],
    "defaultMethod": "vegetables_grill",
    "allowedDoneness": [],
    "style": "vegetable",
    "restingMinutes": 1,
    "cookingMinutes": 25,
    "errorEn": "Burning the outside before the inside softens.",
    "aliasesEn": [
      "Corn"
    ],
    "notesEn": "Use oil salt and controlled direct heat. Pull when tender and browned.",
    "tipsEn": [
      "Base time: 25 min",
      "Cut evenly",
      "Oil before grilling"
    ]
  },
  {
    "id": "berenjena",
    "animalId": "vegetables",
    "canonicalNameEn": "Eggplant",
    "inputProfileId": "vegetable-format",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "vegetables_grill"
    ],
    "defaultMethod": "vegetables_grill",
    "allowedDoneness": [],
    "style": "vegetable",
    "restingMinutes": 1,
    "cookingMinutes": 18,
    "errorEn": "Burning the outside before the inside softens.",
    "aliasesEn": [
      "Eggplant"
    ],
    "notesEn": "Use oil salt and controlled direct heat. Pull when tender and browned.",
    "tipsEn": [
      "Base time: 18 min",
      "Cut evenly",
      "Oil before grilling"
    ]
  },
  {
    "id": "patata",
    "animalId": "vegetables",
    "canonicalNameEn": "Potato",
    "inputProfileId": "vegetable-format",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "vegetables_grill"
    ],
    "defaultMethod": "vegetables_grill",
    "allowedDoneness": [],
    "style": "vegetable",
    "restingMinutes": 1,
    "cookingMinutes": 45,
    "errorEn": "Burning the outside before the inside softens.",
    "aliasesEn": [
      "Potato"
    ],
    "notesEn": "Use oil salt and controlled direct heat. Pull when tender and browned.",
    "tipsEn": [
      "Base time: 45 min",
      "Cut evenly",
      "Oil before grilling"
    ]
  },
  {
    "id": "esparragos",
    "animalId": "vegetables",
    "canonicalNameEn": "Asparagus",
    "inputProfileId": "vegetable-format",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "vegetables_grill"
    ],
    "defaultMethod": "vegetables_grill",
    "allowedDoneness": [],
    "style": "vegetable",
    "restingMinutes": 1,
    "cookingMinutes": 8,
    "errorEn": "Burning the outside before the inside softens.",
    "aliasesEn": [
      "Asparagus"
    ],
    "notesEn": "Use oil salt and controlled direct heat. Pull when tender and browned.",
    "tipsEn": [
      "Base time: 8 min",
      "Cut evenly",
      "Oil before grilling"
    ]
  },
  {
    "id": "pimientos",
    "animalId": "vegetables",
    "canonicalNameEn": "Peppers",
    "inputProfileId": "vegetable-format",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "vegetables_grill"
    ],
    "defaultMethod": "vegetables_grill",
    "allowedDoneness": [],
    "style": "vegetable",
    "restingMinutes": 1,
    "cookingMinutes": 14,
    "errorEn": "Burning the outside before the inside softens.",
    "aliasesEn": [
      "Peppers"
    ],
    "notesEn": "Use oil salt and controlled direct heat. Pull when tender and browned.",
    "tipsEn": [
      "Base time: 14 min",
      "Cut evenly",
      "Oil before grilling"
    ]
  },
  {
    "id": "calabacin",
    "animalId": "vegetables",
    "canonicalNameEn": "Zucchini",
    "inputProfileId": "vegetable-format",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "vegetables_grill"
    ],
    "defaultMethod": "vegetables_grill",
    "allowedDoneness": [],
    "style": "vegetable",
    "restingMinutes": 1,
    "cookingMinutes": 10,
    "errorEn": "Burning the outside before the inside softens.",
    "aliasesEn": [
      "Zucchini"
    ],
    "notesEn": "Use oil salt and controlled direct heat. Pull when tender and browned.",
    "tipsEn": [
      "Base time: 10 min",
      "Cut evenly",
      "Oil before grilling"
    ]
  },
  {
    "id": "setas",
    "animalId": "vegetables",
    "canonicalNameEn": "Mushrooms",
    "inputProfileId": "vegetable-format",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "vegetables_grill"
    ],
    "defaultMethod": "vegetables_grill",
    "allowedDoneness": [],
    "style": "vegetable",
    "restingMinutes": 1,
    "cookingMinutes": 10,
    "errorEn": "Burning the outside before the inside softens.",
    "aliasesEn": [
      "Mushrooms"
    ],
    "notesEn": "Use oil salt and controlled direct heat. Pull when tender and browned.",
    "tipsEn": [
      "Base time: 10 min",
      "Cut evenly",
      "Oil before grilling"
    ]
  }
] satisfies GeneratedCutProfile[];

export const generatedCutProfilesById: Record<string, GeneratedCutProfile> = Object.fromEntries(
  generatedCutProfiles.map((profile) => [profile.id, profile]),
);

export function getGeneratedCutProfile(id: string): GeneratedCutProfile | undefined {
  return generatedCutProfilesById[id];
}
