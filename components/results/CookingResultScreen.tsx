"use client";

import { Button, Card, Grid, Section } from "@/components/ui";
import { ResultCards, type Blocks } from "@/components/cooking/CookingWizard";
import type { AppText, Lang } from "@/lib/i18n/texts";

// ─── Exported types (consumed by app/page.tsx) ────────────────────────────────

export type SavedMenuType = "cooking_plan" | "generated_menu" | "parrillada_plan";
export type ShareStatus = "idle" | "publishing" | "copied" | "error";

export type SavedMenu = {
  id: string;
  title: string;
  date: string;
  blocks: Blocks;
  type?: SavedMenuType;
  is_public?: boolean;
  share_slug?: string | null;
};

// ─── Exported utilities ───────────────────────────────────────────────────────

export function buildText(blocks: Blocks): string {
  return Object.keys(blocks)
    .map((key) => `${key}\n${blocks[key]}`)
    .join("\n\n");
}

export function copySavedMenu(menu: SavedMenu) {
  if (typeof window === "undefined" || !navigator.clipboard) return;
  void navigator.clipboard.writeText(buildText(menu.blocks));
}

export function getSavedMenuType(menu: SavedMenu): SavedMenuType {
  return menu.type ?? "generated_menu";
}

export function isLocalSavedMenu(menu: Pick<SavedMenu, "id">) {
  return !menu.id || menu.id.startsWith("local_");
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getSavedMenuTypeLabel(type: SavedMenuType, lang: Lang): string {
  if (type === "cooking_plan") return lang === "es" ? "Cocción" : "Cooking";
  if (type === "parrillada_plan") return "Parrillada";
  return lang === "es" ? "Menú" : "Menu";
}

function getShareButtonLabel({
  isPublic,
  isSharing,
  shareStatus,
}: {
  isPublic: boolean;
  isSharing: boolean;
  shareStatus: ShareStatus;
}): string {
  if (isSharing || shareStatus === "publishing") return "Publicando...";
  if (isPublic || shareStatus === "copied") return "Copiar link";
  return "Publicar";
}

// ─── Shared prop shape ────────────────────────────────────────────────────────

type SharedMenuProps = {
  lang: Lang;
  onCopyLink: (menu: SavedMenu) => void;
  onCopy: (menu: SavedMenu) => void;
  onPublish: (menu: SavedMenu) => void;
  onUnpublish: (menu: SavedMenu) => void;
  shareMessage: string;
  shareMessageMenuId: string | null;
  shareStatus: ShareStatus;
  sharingMenuId: string | null;
  t: AppText;
};

// ─── SavedMenusSection ────────────────────────────────────────────────────────

function SavedMenusSection({
  lang,
  menus,
  onCopyLink,
  onCopy,
  onDelete,
  onOpen,
  onPublish,
  onUnpublish,
  shareMessage,
  shareMessageMenuId,
  shareStatus,
  sharingMenuId,
  t,
}: SharedMenuProps & {
  menus: SavedMenu[];
  onDelete: (id: string) => void;
  onOpen: (menu: SavedMenu) => void;
}) {
  return (
    <Section eyebrow={`${menus.length} ${t.saved}`} title={t.savedMenus}>
      {menus.length === 0 && <Card tone="empty">{t.noSaved}</Card>}

      <Grid>
        {menus.map((menu) => (
          <Card key={menu.id}>
            <p className="text-sm font-medium text-orange-300">
              {getSavedMenuTypeLabel(getSavedMenuType(menu), lang)}
            </p>
            <h3 className="mt-1 text-xl font-bold text-white">{menu.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{menu.date}</p>

            {menu.is_public && menu.share_slug ? (
              <p className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200">
                /share/{menu.share_slug}
              </p>
            ) : isLocalSavedMenu(menu) ? (
              <p className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300">
                Este plan solo está guardado en este dispositivo. Guárdalo en la nube para compartir.
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => onOpen(menu)}>{lang === "es" ? "Abrir" : "Open"}</Button>
              <Button onClick={() => onCopy(menu)} variant="secondary">
                {t.copy}
              </Button>
              {menu.is_public && menu.share_slug ? (
                <>
                  <Button onClick={() => onCopyLink(menu)} variant="outlineAccent">
                    Copiar link
                  </Button>
                  <Button
                    onClick={() => onUnpublish(menu)}
                    variant="secondary"
                    disabled={sharingMenuId === menu.id}
                  >
                    {sharingMenuId === menu.id ? "Actualizando..." : "Despublicar"}
                  </Button>
                </>
              ) : isLocalSavedMenu(menu) ? null : (
                <Button
                  onClick={() => onPublish(menu)}
                  variant="outlineAccent"
                  disabled={sharingMenuId === menu.id}
                >
                  {getShareButtonLabel({
                    isPublic: false,
                    isSharing: sharingMenuId === menu.id,
                    shareStatus: shareMessageMenuId === menu.id ? shareStatus : "idle",
                  })}
                </Button>
              )}
              <Button onClick={() => onDelete(menu.id)} variant="danger">
                {lang === "es" ? "Borrar" : "Delete"}
              </Button>
            </div>

            {shareMessage && shareMessageMenuId === menu.id && (
              <p className="mt-3 text-xs font-bold text-emerald-300">{shareMessage}</p>
            )}
          </Card>
        ))}
      </Grid>
    </Section>
  );
}

// ─── SavedMenuDetail ──────────────────────────────────────────────────────────

function SavedMenuDetail({
  checkedItems,
  lang,
  menu,
  onBack,
  onCopyLink,
  onCopy,
  onPublish,
  onUnpublish,
  shareMessage,
  shareMessageMenuId,
  shareStatus,
  sharingMenuId,
  setCheckedItems,
  t,
}: SharedMenuProps & {
  checkedItems: Record<string, boolean>;
  menu: SavedMenu;
  onBack: () => void;
  setCheckedItems: (value: Record<string, boolean>) => void;
}) {
  const type = getSavedMenuType(menu);
  const isLocal = isLocalSavedMenu(menu);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-orange-300">{getSavedMenuTypeLabel(type, lang)}</p>
            <h2 className="mt-1 text-2xl font-black text-white">{menu.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{menu.date}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onBack} variant="secondary">
              {lang === "es" ? "Volver" : "Back"}
            </Button>
            <Button onClick={() => onCopy(menu)} variant="outlineAccent">
              {t.copy}
            </Button>
            {menu.is_public && menu.share_slug ? (
              <>
                <Button onClick={() => onCopyLink(menu)} variant="outlineAccent">
                  Copiar link
                </Button>
                <Button
                  onClick={() => onUnpublish(menu)}
                  variant="secondary"
                  disabled={sharingMenuId === menu.id}
                >
                  {sharingMenuId === menu.id ? "Actualizando..." : "Despublicar"}
                </Button>
              </>
            ) : isLocal ? null : (
              <Button
                onClick={() => onPublish(menu)}
                variant="outlineAccent"
                disabled={sharingMenuId === menu.id}
              >
                {getShareButtonLabel({
                  isPublic: false,
                  isSharing: sharingMenuId === menu.id,
                  shareStatus: shareMessageMenuId === menu.id ? shareStatus : "idle",
                })}
              </Button>
            )}
          </div>
        </div>

        {menu.is_public && menu.share_slug ? (
          <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-200">
            /share/{menu.share_slug}
          </div>
        ) : isLocal ? (
          <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300">
            Este plan solo está guardado en este dispositivo. Guárdalo en la nube para compartir.
          </p>
        ) : null}

        {shareMessage && shareMessageMenuId === menu.id && (
          <p className="mt-3 text-sm font-bold text-emerald-300">{shareMessage}</p>
        )}
      </Card>

      <ResultCards
        blocks={menu.blocks}
        checkedItems={checkedItems}
        loading={false}
        saveMenuMessage=""
        saveMenuStatus="idle"
        setCheckedItems={setCheckedItems}
        t={t}
      />
    </div>
  );
}

// ─── CookingResultScreen ──────────────────────────────────────────────────────
// Orchestrates the saved-menu list ↔ detail toggle.

export function CookingResultScreen({
  checkedItems,
  lang,
  menus,
  selectedMenu,
  shareMessage,
  shareMessageMenuId,
  shareStatus,
  sharingMenuId,
  onBack,
  onCopyLink,
  onCopy,
  onDelete,
  onOpen,
  onPublish,
  onUnpublish,
  setCheckedItems,
  t,
}: {
  checkedItems: Record<string, boolean>;
  lang: Lang;
  menus: SavedMenu[];
  selectedMenu: SavedMenu | null;
  shareMessage: string;
  shareMessageMenuId: string | null;
  shareStatus: ShareStatus;
  sharingMenuId: string | null;
  onBack: () => void;
  onCopyLink: (menu: SavedMenu) => void;
  onCopy: (menu: SavedMenu) => void;
  onDelete: (id: string) => void;
  onOpen: (menu: SavedMenu) => void;
  onPublish: (menu: SavedMenu) => void;
  onUnpublish: (menu: SavedMenu) => void;
  setCheckedItems: (value: Record<string, boolean>) => void;
  t: AppText;
}) {
  if (selectedMenu) {
    return (
      <SavedMenuDetail
        checkedItems={checkedItems}
        lang={lang}
        menu={selectedMenu}
        onBack={onBack}
        onCopyLink={onCopyLink}
        onCopy={onCopy}
        onPublish={onPublish}
        onUnpublish={onUnpublish}
        shareMessage={shareMessage}
        shareMessageMenuId={shareMessageMenuId}
        shareStatus={shareStatus}
        sharingMenuId={sharingMenuId}
        setCheckedItems={setCheckedItems}
        t={t}
      />
    );
  }

  return (
    <SavedMenusSection
      lang={lang}
      menus={menus}
      onCopyLink={onCopyLink}
      onCopy={onCopy}
      onDelete={onDelete}
      onOpen={onOpen}
      onPublish={onPublish}
      onUnpublish={onUnpublish}
      shareMessage={shareMessage}
      shareMessageMenuId={shareMessageMenuId}
      shareStatus={shareStatus}
      sharingMenuId={sharingMenuId}
      t={t}
    />
  );
}
