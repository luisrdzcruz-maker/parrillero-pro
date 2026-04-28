import "server-only";

import type { Json } from "@/lib/db/types";
import { getCurrentUserId } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export type { Json } from "@/lib/db/types";

export type SavedMenu = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  name: string;
  lang: string;
  people: number | null;
  data: Json;
  is_public: boolean;
  share_slug: string | null;
};

export type PublishSavedMenuResult =
  | {
      ok: true;
      menu: SavedMenu;
    }
  | {
      ok: false;
      error: string;
    };

export type SaveMenuInput = {
  name: string;
  lang: string;
  people?: number | null;
  data: Json;
};

type SavedMenuRow = {
  id: string;
  created_at: string;
  updated_at: string | null;
  user_id?: string | null;
  name: string;
  lang: string;
  people: number | null;
  data: Json;
  is_public: boolean | null;
  share_slug: string | null;
};

function createShareSlug() {
  return `plan-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function createFallbackSavedMenu(input: SaveMenuInput): SavedMenu {
  const createdAt = new Date().toISOString();

  console.log("[saveMenu] Using local fallback saved menu");

  return {
    id: `local_${Date.now()}`,
    created_at: createdAt,
    updated_at: createdAt,
    user_id: null,
    name: input.name,
    lang: input.lang,
    people: input.people ?? null,
    data: input.data,
    is_public: false,
    share_slug: null,
  };
}

async function safeGetCurrentUserId(): Promise<string | null> {
  try {
    return await getCurrentUserId();
  } catch (error) {
    console.error("[savedMenus] Could not read auth user; continuing anonymously", error);
    return null;
  }
}

const savedMenuSelect =
  "id, user_id, created_at, updated_at, name, lang, people, data, is_public, share_slug";

function toSavedMenu(row: SavedMenuRow): SavedMenu {
  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    user_id: row.user_id ?? null,
    name: row.name,
    lang: row.lang,
    people: row.people,
    data: row.data,
    is_public: row.is_public ?? false,
    share_slug: row.share_slug ?? null,
  };
}

export async function saveMenu(input: SaveMenuInput): Promise<SavedMenu> {
  try {
    const supabase = await createClient();
    const userId = await safeGetCurrentUserId();
    const insertPayload: Record<string, Json | string | number | null> = {
      name: input.name,
      lang: input.lang,
      people: input.people ?? null,
      data: input.data,
      is_public: false,
      share_slug: null,
    };

    if (userId) {
      insertPayload.user_id = userId;
    }

    const result = await supabase
      .from("saved_menus")
      .insert(insertPayload)
      .select(savedMenuSelect)
      .single();

    if (result.error || !result.data) {
      console.error("[saveMenu] Supabase failed", result.error);
      return createFallbackSavedMenu(input);
    }

    return toSavedMenu(result.data as SavedMenuRow);
  } catch (error) {
    console.error("[saveMenu] Supabase failed", error);
    return createFallbackSavedMenu(input);
  }
}

export async function getSavedMenus(): Promise<SavedMenu[]> {
  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    supabase = await createClient();
  } catch (error) {
    console.error("[savedMenus] Supabase failed while loading saved menus", error);
    return [];
  }

  const userId = await safeGetCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("saved_menus")
    .select(savedMenuSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!error) {
    return ((data ?? []) as SavedMenuRow[]).map(toSavedMenu);
  }

  console.error("[savedMenus] Failed to get saved menus", error);
  return [];
}

export async function deleteSavedMenu(id: string): Promise<void> {
  if (id.startsWith("local_")) return;

  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    supabase = await createClient();
  } catch (error) {
    console.error("[savedMenus] Supabase failed while deleting saved menu", error);
    return;
  }

  const { error } = await supabase.from("saved_menus").delete().eq("id", id);

  if (error) {
    console.error("[savedMenus] Failed to delete saved menu", error);
  }
}

export async function publishSavedMenu(id: string): Promise<PublishSavedMenuResult> {
  if (!id || id.startsWith("local_")) {
    return {
      ok: false,
      error: "Este plan solo está guardado en este dispositivo.",
    };
  }

  try {
    const supabase = await createClient();
    const { data: existingMenu, error: existingError } = await supabase
      .from("saved_menus")
      .select("share_slug")
      .eq("id", id)
      .single();

    if (existingError) {
      console.error("[savedMenus] Failed to read menu before publish", existingError);
      return {
        ok: false,
        error: `No se pudo publicar el plan: ${existingError.message}`,
      };
    }

    const slug =
      typeof existingMenu?.share_slug === "string" && existingMenu.share_slug
        ? existingMenu.share_slug
        : createShareSlug();

    const { data, error } = await supabase
      .from("saved_menus")
      .update({
        is_public: true,
        share_slug: slug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(savedMenuSelect)
      .single();

    if (error || !data) {
      console.error("[savedMenus] Failed to publish menu", error);
      return {
        ok: false,
        error: `No se pudo publicar el plan: ${error?.message ?? "No se encontró el plan actualizado"}`,
      };
    }

    return {
      ok: true,
      menu: toSavedMenu(data as SavedMenuRow),
    };
  } catch (error) {
    console.error("[savedMenus] Failed to publish menu", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo publicar el plan.",
    };
  }
}

export async function unpublishSavedMenu(id: string): Promise<SavedMenu> {
  if (id.startsWith("local_")) {
    throw new Error("Local saved menus cannot be unpublished.");
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("saved_menus")
      .update({
        is_public: false,
      })
      .eq("id", id)
      .select(savedMenuSelect)
      .single();

    if (error || !data) {
      console.error("[savedMenus] Failed to unpublish menu", error);
      throw new Error(`Failed to unpublish saved menu: ${error?.message ?? "No row returned"}`);
    }

    return toSavedMenu(data as SavedMenuRow);
  } catch (error) {
    console.error("[savedMenus] Failed to unpublish menu", error);
    throw error;
  }
}

export async function getPublicSavedMenuBySlug(slug: string): Promise<SavedMenu | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("saved_menus")
      .select(savedMenuSelect)
      .eq("share_slug", slug)
      .eq("is_public", true)
      .maybeSingle();

    if (error) {
      console.error("[savedMenus] Failed to get public saved menu", error);
      return null;
    }

    return data ? toSavedMenu(data as SavedMenuRow) : null;
  } catch (error) {
    console.error("[savedMenus] Failed to get public saved menu", error);
    return null;
  }
}
