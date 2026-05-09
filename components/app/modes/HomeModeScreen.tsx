"use client";

import { HomeScreen } from "@/components/home/HomeScreen";
import type { Mode } from "@/components/navigation/AppHeader";
import type { AppText, Lang } from "@/lib/i18n/texts";

export type HomeModeScreenProps = {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  savedMenusCount: number;
  t: AppText;
  onModeChange: (mode: Mode) => void;
  onPrimaryCtaClick?: () => void;
};

export function HomeModeScreen({
  lang,
  onLangChange,
  savedMenusCount,
  t,
  onModeChange,
  onPrimaryCtaClick,
}: HomeModeScreenProps) {
  return (
    <HomeScreen
      lang={lang}
      onLangChange={onLangChange}
      savedMenusCount={savedMenusCount}
      t={t}
      onModeChange={onModeChange}
      onPrimaryCtaClick={onPrimaryCtaClick}
    />
  );
}
