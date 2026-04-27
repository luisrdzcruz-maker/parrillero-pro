import type { AnimalId } from "@/lib/cookingCatalog";

export type Animal = "Vacuno" | "Cerdo" | "Pollo" | "Pescado" | "Verduras";

export type AnimalMedia = {
  image: string;
};

export const animalIdsByLabel: Record<Animal, AnimalId> = {
  Vacuno: "beef",
  Cerdo: "pork",
  Pollo: "chicken",
  Pescado: "fish",
  Verduras: "vegetables",
};

export const animalOptions: Animal[] = ["Vacuno", "Cerdo", "Pollo", "Pescado", "Verduras"];

export const animalMedia: Record<Animal, AnimalMedia> = {
  Vacuno: { image: "/animals/vacuno.jpg" },
  Cerdo: { image: "/animals/cerdo.jpg" },
  Pollo: { image: "/animals/pollo.jpg" },
  Pescado: { image: "/animals/pescado.jpg" },
  Verduras: { image: "/animals/vegetales.jpg" },
};
