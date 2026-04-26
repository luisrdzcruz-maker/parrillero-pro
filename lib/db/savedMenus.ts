import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SavedMenu = {
  id: string
  created_at: string
  name: string
  lang: string
  people: number | null
  data: Json
}

export type SaveMenuInput = {
  name: string
  lang: string
  people?: number | null
  data: Json
}

export async function saveMenu(input: SaveMenuInput): Promise<SavedMenu> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('saved_menus')
    .insert({
      name: input.name,
      lang: input.lang,
      people: input.people ?? null,
      data: input.data,
    })
    .select('id, created_at, name, lang, people, data')
    .single()

  if (error) {
    throw new Error(`Failed to save menu: ${error.message}`)
  }

  return data as SavedMenu
}

export async function getSavedMenus(): Promise<SavedMenu[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('saved_menus')
    .select('id, created_at, name, lang, people, data')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get saved menus: ${error.message}`)
  }

  return (data ?? []) as SavedMenu[]
}

export async function deleteSavedMenu(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('saved_menus').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete saved menu: ${error.message}`)
  }
}
