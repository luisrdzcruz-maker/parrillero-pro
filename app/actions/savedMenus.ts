"use server";

import { saveMenu, type Json } from "@/lib/db/savedMenus";

type SaveGeneratedMenuInput = {
  name: string;
  lang: string;
  people: number | null;
  data: Record<string, unknown>;
};

export async function saveGeneratedMenu(input: SaveGeneratedMenuInput) {
  return saveMenu({
    name: input.name,
    lang: input.lang,
    people: input.people,
    data: input.data as Json,
  });
}
