"use client";

import type { ReactNode, TouchEvent } from "react";

import { AppBottomNav } from "@/components/navigation/AppBottomNav";
import { DesktopModeTabs, type Mode } from "@/components/navigation/AppHeader";
import { ProModal } from "@/components/pro/ProModal";
import { ds } from "@/lib/design-system";
import type { Lang, texts } from "@/lib/i18n/texts";

type Texts = (typeof texts)[Lang];

type AppShellChromeProps = {
  lang: Lang;
  mode: Mode;
  t: Texts;
  showProModal: false | "planning";
  onCloseProModal: () => void;
  isCutSelectionShell: boolean;
  isCutSelectionSheetOpen: boolean;
  onTouchStart: (event: TouchEvent<HTMLElement>) => void;
  onTouchEnd: (event: TouchEvent<HTMLElement>) => void;
  onModeChange: (mode: Mode) => void;
  children: ReactNode;
};

export function AppShellChrome({
  lang,
  mode,
  t,
  showProModal,
  onCloseProModal,
  isCutSelectionShell,
  isCutSelectionSheetOpen,
  onTouchStart,
  onTouchEnd,
  onModeChange,
  children,
}: AppShellChromeProps) {
  return (
    <>
    {showProModal && (
      <ProModal
        lang={lang}
        trigger={showProModal}
        onUpgrade={onCloseProModal}
        onDismiss={onCloseProModal}
      />
    )}
    <main
      className={`${ds.shell.page} relative isolate mx-auto flex min-w-0 w-full max-w-none flex-col px-3 pt-2 before:pointer-events-none before:fixed before:inset-x-0 before:top-0 before:z-0 before:h-[28rem] before:bg-[radial-gradient(ellipse_at_50%_-10%,rgba(249,115,22,0.16),transparent_55%)] after:pointer-events-none after:fixed after:inset-x-0 after:bottom-0 after:z-0 after:h-40 after:bg-gradient-to-t after:from-[#030201] after:via-[#030201]/82 after:to-transparent sm:px-4 sm:pt-5 lg:px-8 lg:pb-10 lg:pt-6 ${
        isCutSelectionShell
          ? "box-border h-[100dvh] min-h-0 overflow-y-hidden pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:h-auto lg:min-h-screen lg:overflow-y-visible"
          : "pb-[calc(7.5rem+env(safe-area-inset-bottom))]"
      }`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className={`${ds.shell.container} mx-auto min-w-0 w-full max-w-[1180px] flex-1 ${isCutSelectionShell ? "min-h-0" : ""}`}>
        <DesktopModeTabs lang={lang} mode={mode} onModeChange={onModeChange} t={t} />

        {children}
      </div>

      <AppBottomNav
        lang={lang}
        mode={mode}
        onModeChange={onModeChange}
        disabled={isCutSelectionSheetOpen}
        t={t}
      />
    </main>
    </>
  );
}
