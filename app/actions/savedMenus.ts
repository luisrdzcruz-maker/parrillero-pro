"use server";

import { revalidatePath } from "next/cache";
import {
  deleteSavedMenu,
  publishSavedMenu,
  saveMenu,
  unpublishSavedMenu,
  type Json,
} from "@/lib/db/savedMenus";

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

export async function publishGeneratedMenu(id: string) {
  const savedMenu = await publishSavedMenu(id);
  revalidatePath("/saved");
  if (savedMenu.share_slug) revalidatePath(`/share/${savedMenu.share_slug}`);
  return savedMenu;
}

export async function unpublishGeneratedMenu(id: string) {
  const savedMenu = await unpublishSavedMenu(id);
  revalidatePath("/saved");
  if (savedMenu.share_slug) revalidatePath(`/share/${savedMenu.share_slug}`);
  return savedMenu;
}
