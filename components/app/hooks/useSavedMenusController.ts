"use client";

import { useCallback, useEffect, useState } from "react";

import {
  publishGeneratedMenu,
  unpublishGeneratedMenu,
} from "@/app/actions/savedMenus";
import {
  isLocalSavedMenu,
  type SavedMenu,
  type ShareStatus,
} from "@/components/results/CookingResultScreen";
import type { SaveMenuStatus } from "@/components/cooking/CookingWizard";

const SAVED_MENUS_STORAGE_KEY = "parrillero_saved_menus";

type PublishSavedMenuResponse =
  | {
      ok: true;
      menu: {
        id: string;
        is_public: boolean;
        share_slug: string | null;
      };
    }
  | { ok: false; error?: string };

export function useSavedMenusController() {
  const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
  const [selectedSavedMenu, setSelectedSavedMenu] = useState<SavedMenu | null>(null);
  const [saveMenuStatus, setSaveMenuStatus] = useState<SaveMenuStatus>("idle");
  const [saveMenuMessage, setSaveMenuMessage] = useState("");
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const [shareMessage, setShareMessage] = useState("");
  const [shareMessageMenuId, setShareMessageMenuId] = useState<string | null>(null);
  const [sharingMenuId, setSharingMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(SAVED_MENUS_STORAGE_KEY);
    if (!stored) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;

      try {
        setSavedMenus(JSON.parse(stored) as SavedMenu[]);
      } catch {
        // Ignore malformed legacy localStorage data.
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateSavedMenus = useCallback((nextMenus: SavedMenu[]) => {
    setSavedMenus(nextMenus);
    if (typeof window === "undefined") return;

    localStorage.setItem(SAVED_MENUS_STORAGE_KEY, JSON.stringify(nextMenus));
  }, []);

  const resetSaveMenuState = useCallback(() => {
    setSaveMenuStatus("idle");
    setSaveMenuMessage("");
    setShareStatus("idle");
    setShareMessage("");
    setShareMessageMenuId(null);
  }, []);

  const deleteMenu = useCallback((id: string) => {
    setSavedMenus((current) => {
      const next = current.filter((menu) => menu.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem(SAVED_MENUS_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
    setSelectedSavedMenu((current) => (current?.id === id ? null : current));
  }, []);

  const updateSharedMenu = useCallback((updatedMenu: SavedMenu) => {
    setSavedMenus((current) => {
      const next = current.map((menu) => (menu.id === updatedMenu.id ? updatedMenu : menu));
      if (typeof window !== "undefined") {
        localStorage.setItem(SAVED_MENUS_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
    setSelectedSavedMenu((current) => (current?.id === updatedMenu.id ? updatedMenu : current));
  }, []);

  const publishMenu = useCallback(async (menu: SavedMenu) => {
    if (isLocalSavedMenu(menu)) {
      setShareStatus("error");
      setShareMessage("Este plan solo está guardado en este dispositivo. Guárdalo en la nube para compartir.");
      setShareMessageMenuId(menu.id);
      return;
    }

    setSharingMenuId(menu.id);
    setShareStatus("publishing");
    setShareMessage("");
    setShareMessageMenuId(menu.id);

    try {
      const result = (await publishGeneratedMenu(menu.id)) as PublishSavedMenuResponse;
      if (!result.ok) {
        setShareStatus("error");
        setShareMessage(result.error || "No se pudo publicar el plan");
        return;
      }

      const published = result.menu;
      const updatedMenu = {
        ...menu,
        is_public: published.is_public,
        share_slug: published.share_slug,
      };
      updateSharedMenu(updatedMenu);
      setShareStatus("idle");
      setShareMessage("Plan publicado. Link listo para compartir.");

      if (published.share_slug && typeof window !== "undefined" && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(`${window.location.origin}/share/${published.share_slug}`);
          setShareStatus("copied");
          setShareMessage("Link copiado");
        } catch {
          setShareStatus("idle");
          setShareMessage("Plan publicado. Link listo para compartir.");
        }
      }
    } catch {
      setShareStatus("error");
      setShareMessage("No se pudo publicar el plan");
    } finally {
      setSharingMenuId(null);
    }
  }, [updateSharedMenu]);

  const unpublishMenu = useCallback(async (menu: SavedMenu) => {
    if (isLocalSavedMenu(menu)) return;

    setSharingMenuId(menu.id);
    setShareStatus("publishing");
    setShareMessage("");
    setShareMessageMenuId(menu.id);

    try {
      const unpublished = await unpublishGeneratedMenu(menu.id);
      const updatedMenu = {
        ...menu,
        is_public: unpublished.is_public,
        share_slug: unpublished.share_slug,
      };
      updateSharedMenu(updatedMenu);
      setShareStatus("idle");
      setShareMessage("Plan privado");
    } catch {
      setShareStatus("error");
      setShareMessage("No se pudo cambiar la privacidad");
    } finally {
      setSharingMenuId(null);
    }
  }, [updateSharedMenu]);

  const copyShareLink = useCallback(async (menu: SavedMenu) => {
    if (typeof window === "undefined" || !navigator.clipboard || !menu.share_slug) return;

    await navigator.clipboard.writeText(`${window.location.origin}/share/${menu.share_slug}`);
    setShareStatus("copied");
    setShareMessage("Link copiado");
    setShareMessageMenuId(menu.id);
  }, []);

  return {
    savedMenus,
    selectedSavedMenu,
    saveMenuStatus,
    saveMenuMessage,
    shareStatus,
    shareMessage,
    shareMessageMenuId,
    sharingMenuId,
    setSelectedSavedMenu,
    setSaveMenuStatus,
    setSaveMenuMessage,
    updateSavedMenus,
    resetSaveMenuState,
    deleteMenu,
    updateSharedMenu,
    publishMenu,
    unpublishMenu,
    copyShareLink,
  };
}
