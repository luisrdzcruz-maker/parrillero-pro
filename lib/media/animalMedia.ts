import type { AnimalId } from "@/lib/cookingCatalog";

export type AnimalLabel = "Vacuno" | "Cerdo" | "Pollo" | "Pescado" | "Verduras";

export type AnimalMedia = {
  image: string;
};

export const animalIdsByLabel: Record<AnimalLabel, AnimalId> = {
  Vacuno: "beef",
  Cerdo: "pork",
  Pollo: "chicken",
  Pescado: "fish",
  Verduras: "vegetables",
};

export const animalOptions: AnimalLabel[] = ["Vacuno", "Cerdo", "Pollo", "Pescado", "Verduras"];

export const animalMedia: Record<AnimalLabel, AnimalMedia> = {
  Vacuno: { image: "/animals/vacuno.jpg" },
  Cerdo: { image: "/animals/cerdo.jpg" },
  Pollo: { image: "/animals/pollo.jpg" },
  Pescado: { image: "/animals/pescado.jpg" },
  Verduras: { image: "/animals/vegetales.jpg" },
};
