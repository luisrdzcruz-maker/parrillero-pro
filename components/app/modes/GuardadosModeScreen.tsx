"use client";

import { SavedCooksScreen } from "@/components/cooks/SavedCooksScreen";
import {
  CookingResultScreen,
  type SavedMenu,
  type ShareStatus,
} from "@/components/results/CookingResultScreen";
import { ds } from "@/lib/design-system";
import type { AppText, Lang } from "@/lib/i18n/texts";

type GuardadosTab = "plans" | "cooks";

export type SavedPlansPanelProps = {
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
};

export type SavedCooksPanelProps = {
  onStartCooking: () => void;
};

export type GuardadosModeScreenProps = {
  lang: Lang;
  t: AppText;
  guardadosTab: GuardadosTab;
  onGuardadosTabChange: (tab: GuardadosTab) => void;
  plans: SavedPlansPanelProps;
  cooks: SavedCooksPanelProps;
};

export function GuardadosModeScreen({
  lang,
  t,
  guardadosTab,
  onGuardadosTabChange,
  plans,
  cooks,
}: GuardadosModeScreenProps) {
  return (
    <div>
      {/* ── Tab toggle: Planes | Cocciones ─────────────────────────── */}
      {/* allow-arbitrary: bg-white/[0.02] — non-subpanel tab strip surface, no canonical token */}
      <div className="mb-5 flex gap-1.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-1.5">
        <button
          type="button"
          onClick={() => onGuardadosTabChange("plans")}
          className={`flex-1 rounded-xl py-2 ${ds.text.body12} font-black transition-all duration-200 ${
            guardadosTab === "plans"
              /* allow-arbitrary: shadow-[0_2px_12px_...] selected-tab ember glow — no canonical ds.shadow.* tier */
              ? "bg-orange-500 text-black shadow-[0_2px_12px_rgba(249,115,22,0.35)]"
              /* allow-arbitrary: hover:text-white/65 — mutedClass hover variant deferred to PR D-primitives/B */
              : `${ds.color.mutedClass.faint} hover:text-white/65`
          }`}
        >
          📋 Planes
        </button>
        <button
          type="button"
          onClick={() => onGuardadosTabChange("cooks")}
          className={`flex-1 rounded-xl py-2 ${ds.text.body12} font-black transition-all duration-200 ${
            guardadosTab === "cooks"
              /* allow-arbitrary: shadow-[0_2px_12px_...] selected-tab ember glow — no canonical ds.shadow.* tier */
              ? "bg-orange-500 text-black shadow-[0_2px_12px_rgba(249,115,22,0.35)]"
              /* allow-arbitrary: hover:text-white/65 — mutedClass hover variant deferred to PR D-primitives/B */
              : `${ds.color.mutedClass.faint} hover:text-white/65`
          }`}
        >
          🔥 Cocciones
        </button>
      </div>

      {guardadosTab === "plans" && (
        <CookingResultScreen
          checkedItems={plans.checkedItems}
          lang={lang}
          menus={plans.savedMenus}
          selectedMenu={plans.selectedSavedMenu}
          shareMessage={plans.shareMessage}
          shareMessageMenuId={plans.shareMessageMenuId}
          shareStatus={plans.shareStatus}
          sharingMenuId={plans.sharingMenuId}
          onBack={plans.onClearSelectedSavedMenu}
          onCopyLink={plans.onCopyShareLink}
          onCopy={plans.onCopySavedMenu}
          onDelete={plans.onDeleteMenu}
          onOpen={plans.onLoadMenu}
          onCookAgainLive={plans.onCookAgainLive}
          onCookAgainReview={plans.onCookAgainReview}
          onPublish={plans.onPublishMenu}
          onUnpublish={plans.onUnpublishMenu}
          setCheckedItems={plans.setCheckedItems}
          t={t}
        />
      )}

      {guardadosTab === "cooks" && <SavedCooksScreen onStartCooking={cooks.onStartCooking} />}
    </div>
  );
}

export type { GuardadosTab };
