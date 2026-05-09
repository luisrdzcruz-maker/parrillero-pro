"use client";

import { SavedCooksScreen } from "@/components/cooks/SavedCooksScreen";
import {
  CookingResultScreen,
  type SavedMenu,
  type ShareStatus,
} from "@/components/results/CookingResultScreen";
import type { AppText, Lang } from "@/lib/i18n/texts";

type GuardadosTab = "plans" | "cooks";

export type GuardadosModeScreenProps = {
  lang: Lang;
  t: AppText;
  guardadosTab: GuardadosTab;
  onGuardadosTabChange: (tab: GuardadosTab) => void;
  checkedItems: Record<string, boolean>;
  setCheckedItems: (value: Record<string, boolean>) => void;
  savedMenus: SavedMenu[];
  selectedSavedMenu: SavedMenu | null;
  shareMessage: string;
  shareMessageMenuId: string | null;
  shareStatus: ShareStatus;
  sharingMenuId: string | null;
  onClearSelectedSavedMenu: () => void;
  onCopyShareLink: (menu: SavedMenu) => void;
  onCopySavedMenu: (menu: SavedMenu) => void;
  onDeleteMenu: (id: string) => void;
  onLoadMenu: (menu: SavedMenu) => void;
  onCookAgainLive: (menu: SavedMenu) => void;
  onCookAgainReview: (menu: SavedMenu) => void;
  onPublishMenu: (menu: SavedMenu) => void;
  onUnpublishMenu: (menu: SavedMenu) => void;
  onStartCookingFromSavedCooks: () => void;
};

export function GuardadosModeScreen({
  lang,
  t,
  guardadosTab,
  onGuardadosTabChange,
  checkedItems,
  setCheckedItems,
  savedMenus,
  selectedSavedMenu,
  shareMessage,
  shareMessageMenuId,
  shareStatus,
  sharingMenuId,
  onClearSelectedSavedMenu,
  onCopyShareLink,
  onCopySavedMenu,
  onDeleteMenu,
  onLoadMenu,
  onCookAgainLive,
  onCookAgainReview,
  onPublishMenu,
  onUnpublishMenu,
  onStartCookingFromSavedCooks,
}: GuardadosModeScreenProps) {
  return (
    <div>
      {/* ── Tab toggle: Planes | Cocciones ─────────────────────────── */}
      <div className="mb-5 flex gap-1.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-1.5">
        <button
          type="button"
          onClick={() => onGuardadosTabChange("plans")}
          className={`flex-1 rounded-xl py-2 text-[12px] font-black transition-all duration-200 ${
            guardadosTab === "plans"
              ? "bg-orange-500 text-black shadow-[0_2px_12px_rgba(249,115,22,0.35)]"
              : "text-white/45 hover:text-white/65"
          }`}
        >
          📋 Planes
        </button>
        <button
          type="button"
          onClick={() => onGuardadosTabChange("cooks")}
          className={`flex-1 rounded-xl py-2 text-[12px] font-black transition-all duration-200 ${
            guardadosTab === "cooks"
              ? "bg-orange-500 text-black shadow-[0_2px_12px_rgba(249,115,22,0.35)]"
              : "text-white/45 hover:text-white/65"
          }`}
        >
          🔥 Cocciones
        </button>
      </div>

      {guardadosTab === "plans" && (
        <CookingResultScreen
          checkedItems={checkedItems}
          lang={lang}
          menus={savedMenus}
          selectedMenu={selectedSavedMenu}
          shareMessage={shareMessage}
          shareMessageMenuId={shareMessageMenuId}
          shareStatus={shareStatus}
          sharingMenuId={sharingMenuId}
          onBack={onClearSelectedSavedMenu}
          onCopyLink={onCopyShareLink}
          onCopy={onCopySavedMenu}
          onDelete={onDeleteMenu}
          onOpen={onLoadMenu}
          onCookAgainLive={onCookAgainLive}
          onCookAgainReview={onCookAgainReview}
          onPublish={onPublishMenu}
          onUnpublish={onUnpublishMenu}
          setCheckedItems={setCheckedItems}
          t={t}
        />
      )}

      {guardadosTab === "cooks" && (
        <SavedCooksScreen onStartCooking={onStartCookingFromSavedCooks} />
      )}
    </div>
  );
}

export type { GuardadosTab };
