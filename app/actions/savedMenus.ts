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

type SaveGeneratedMenuResult =
  | {
      ok: true;
      menu: Awaited<ReturnType<typeof saveMenu>>;
    }
  | {
      ok: false;
      error: string;
    };

export async function saveGeneratedMenu(input: SaveGeneratedMenuInput) {
  try {
    const savedMenu = await saveMenu({
      name: input.name,
      lang: input.lang,
      people: input.people,
      data: input.data as Json,
    });

    revalidatePath("/saved");

    return {
      ok: true,
      menu: savedMenu,
    } satisfies SaveGeneratedMenuResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el menú.";
    console.error("[savedMenusAction] Failed to save generated menu", error);

    return {
      ok: false,
      error: message,
    } satisfies SaveGeneratedMenuResult;
  }
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
