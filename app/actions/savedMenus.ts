"use server";

import { revalidatePath } from "next/cache";
import { deleteSavedMenu, saveMenu, type Json } from "@/lib/db/savedMenus";

type SaveGeneratedMenuInput = {
  name: string;
  lang: string;
  people: number | null;
  data: Record<string, unknown>;
};

export async function saveGeneratedMenu(input: SaveGeneratedMenuInput) {
  const savedMenu = await saveMenu({
    name: input.name,
    lang: input.lang,
    people: input.people,
    data: input.data as Json,
  });

  revalidatePath("/saved");

  return savedMenu;
}

export async function deleteGeneratedMenu(id: string) {
  await deleteSavedMenu(id);
  revalidatePath("/saved");
}
