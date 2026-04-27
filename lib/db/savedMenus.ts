import "server-only";

import type { Json } from "@/lib/db/types";
import { getCurrentUserId } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export type { Json } from "@/lib/db/types";

export type SavedMenu = {
  id: string;
  created_at: string;
  updated_at?: string;
  user_id: string | null;
  name: string;
  lang: string;
  people: number | null;
  data: Json;
  is_public: boolean;
  share_slug: string | null;
  published_at: string | null;
};

export type SaveMenuInput = {
  name: string;
  lang: string;
  people?: number | null;
  data: Json;
};

function createShareSlug() {
  return `bbq-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

const savedMenuSelect =
  "id, created_at, updated_at, user_id, name, lang, people, data, is_public, share_slug, published_at";

export async function saveMenu(input: SaveMenuInput): Promise<SavedMenu> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("saved_menus")
    .insert({
      user_id: userId,
      name: input.name,
      lang: input.lang,
      people: input.people ?? null,
      data: input.data,
    })
    .select(savedMenuSelect)
    .single();

  if (error) {
    throw new Error(`Failed to save menu: ${error.message}`);
  }

  return data as SavedMenu;
}

export async function getSavedMenus(): Promise<SavedMenu[]> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  let query = supabase
    .from("saved_menus")
    .select(savedMenuSelect)
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.is.null`);
  } else {
    query = query.is("user_id", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get saved menus: ${error.message}`);
  }

  return (data ?? []) as SavedMenu[];
}

export async function deleteSavedMenu(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("saved_menus").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete saved menu: ${error.message}`);
  }
}

export async function publishSavedMenu(id: string): Promise<SavedMenu> {
  const supabase = await createClient();
  const { data: existingMenu, error: existingError } = await supabase
    .from("saved_menus")
    .select("share_slug")
    .eq("id", id)
    .single();

  if (existingError) {
    throw new Error(`Failed to publish saved menu: ${existingError.message}`);
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
      published_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(savedMenuSelect)
    .single();

  if (error) {
    throw new Error(`Failed to publish saved menu: ${error.message}`);
  }

  return data as SavedMenu;
}

export async function unpublishSavedMenu(id: string): Promise<SavedMenu> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("saved_menus")
    .update({
      is_public: false,
      published_at: null,
    })
    .eq("id", id)
    .select(savedMenuSelect)
    .single();

  if (error) {
    throw new Error(`Failed to unpublish saved menu: ${error.message}`);
  }

  return data as SavedMenu;
}

export async function getPublicSavedMenuBySlug(slug: string): Promise<SavedMenu | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("saved_menus")
    .select(savedMenuSelect)
    .eq("share_slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get public saved menu: ${error.message}`);
  }

  return (data as SavedMenu | null) ?? null;
}
