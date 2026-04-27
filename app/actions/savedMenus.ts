"use server";

import { revalidatePath } from "next/cache";
import {
  deleteSavedMenu,
  publishSavedMenu,
  saveMenu,
  unpublishSavedMenu,
  type Json,
} from "@/lib/db/savedMenus";
import {
  REQUIRED_COOKING_BLOCKS,
  REQUIRED_MENU_BLOCKS,
  REQUIRED_PARRILLADA_BLOCKS,
  normalizeBlocks,
  type NormalizedBlockType,
} from "@/lib/parser/normalizeBlocks";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeGeneratedMenuData(data: Record<string, unknown>) {
  const blocks = data.blocks;
  const rawBlocks = isRecord(blocks) ? blocks : {};
  const safeBlocks = Object.fromEntries(
    Object.entries(rawBlocks).filter(
      ([key, value]) => key.trim().toUpperCase() !== "ERR" && typeof value === "string",
    ),
  ) as Record<string, string>;
  const type = getNormalizedBlockType(data.type);
  const required =
    type === "cooking_plan"
      ? REQUIRED_COOKING_BLOCKS
      : type === "parrillada_plan"
        ? REQUIRED_PARRILLADA_BLOCKS
        : REQUIRED_MENU_BLOCKS;

  return {
    ...data,
    type,
    blocks: normalizeBlocks(safeBlocks, required, type),
  };
}

function getNormalizedBlockType(value: unknown): NormalizedBlockType {
  if (value === "cooking_plan" || value === "parrillada_plan" || value === "generated_menu") {
    return value;
  }

  return "generated_menu";
}

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch (error) {
    console.error(`[savedMenusAction] Failed to revalidate ${path}`, error);
  }
}

export async function saveGeneratedMenu(input: SaveGeneratedMenuInput) {
  try {
    const savedMenu = await saveMenu({
      name: input.name,
      lang: input.lang,
      people: input.people,
      data: sanitizeGeneratedMenuData(input.data) as Json,
    });

    safeRevalidate("/saved");

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
  safeRevalidate("/saved");
}

export async function publishGeneratedMenu(id: string) {
  const savedMenu = await publishSavedMenu(id);
  safeRevalidate("/saved");
  if (savedMenu.share_slug) safeRevalidate(`/share/${savedMenu.share_slug}`);
  return savedMenu;
}

export async function unpublishGeneratedMenu(id: string) {
  const savedMenu = await unpublishSavedMenu(id);
  safeRevalidate("/saved");
  if (savedMenu.share_slug) safeRevalidate(`/share/${savedMenu.share_slug}`);
  return savedMenu;
}
