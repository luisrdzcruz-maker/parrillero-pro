"use client";

import Image from "next/image";
import { useState } from "react";
import { AppIcon } from "@/components/ui";
import { resolveMethodIconKey } from "@/lib/assets/equipmentMethodIconResolver";
import type { GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import type { Lang } from "@/lib/i18n/texts";
import {
  getCategoryLabel,
  getCutDescriptor,
  getDisplayName,
  getDifficultyLabel,
  getEstimatedTimeLabel,
  getHelpfulAlias,
  getSafetyNote,
  getStyleLabel,
  getTemperatureLabel,
  getWhyChooseLabel,
} from "./cutProfileSelectors";
import { CutIdentityHeader, CutInfoModule, CutMetaChip } from "./CutFlowPrimitives";
import { getCutSelectionIconPath } from "./cutSelectionIconResolver";
import { getAnimalLabel, getMethodLabel } from "./cutSelectionTypes";

type CutBottomSheetProps = {
  profile: GeneratedCutProfile | null;
  lang?: Lang;
  onClose: () => void;
  onStartCooking?: (profile: GeneratedCutProfile) => void;
};

function getPrimaryCtaLabel(lang: Lang | undefined, cutName: string) {
  switch (lang) {
    case "es":
      return `Cocinar ${cutName}`;
    case "fi":
      return `Kokkaa ${cutName}`;
    case "en":
    default:
      return `Cook ${cutName}`;
  }
}

export function CutBottomSheet({ profile, lang, onClose, onStartCooking }: CutBottomSheetProps) {
  const [failedVisualSrc, setFailedVisualSrc] = useState<string | null>(null);
  const effectiveLang = lang ?? "en";
  if (!profile) return null;

  const displayName = getDisplayName(profile, effectiveLang);
  const temperature = getTemperatureLabel(profile);
  const helpfulAlias = getHelpfulAlias(profile, effectiveLang);
  const bestMethod = getMethodLabel(profile.defaultMethod, effectiveLang) ?? getStyleLabel(profile, effectiveLang);
  const methodValue = temperature ? `${bestMethod} · ${temperature}` : bestMethod;
  const methodIcon = resolveMethodIconKey(bestMethod);
  const primaryCtaLabel = getPrimaryCtaLabel(effectiveLang, displayName);
  const cutIconSrc = getCutSelectionIconPath(profile);
  const visualSrc = cutIconSrc && failedVisualSrc !== cutIconSrc ? cutIconSrc : null;

  return (
    <>
      <aside className="fixed inset-x-0 bottom-0 z-[80] mx-auto flex w-full max-w-3xl items-end px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-4 md:hidden">
        <CutDetailContent
          profile={profile}
          lang={effectiveLang}
          displayName={displayName}
          helpfulAlias={helpfulAlias}
          methodIcon={methodIcon}
          methodValue={methodValue}
          primaryCtaLabel={primaryCtaLabel}
          cutIconSrc={cutIconSrc}
          visualSrc={visualSrc}
          onClose={onClose}
          onStartCooking={onStartCooking}
          onVisualError={setFailedVisualSrc}
          inline={false}
        />
      </aside>
      <div className="hidden md:mt-4 md:block md:w-full md:max-w-[760px]">
        <CutDetailContent
          profile={profile}
          lang={effectiveLang}
          displayName={displayName}
          helpfulAlias={helpfulAlias}
          methodIcon={methodIcon}
          methodValue={methodValue}
          primaryCtaLabel={primaryCtaLabel}
          cutIconSrc={cutIconSrc}
          visualSrc={visualSrc}
          onClose={onClose}
          onStartCooking={onStartCooking}
          onVisualError={setFailedVisualSrc}
          inline
        />
      </div>
    </>
  );
}

type CutDetailContentProps = {
  profile: GeneratedCutProfile;
  lang: Lang;
  displayName: string;
  helpfulAlias: string | null;
  methodIcon: ReturnType<typeof resolveMethodIconKey>;
  methodValue: string;
  primaryCtaLabel: string;
  cutIconSrc?: string;
  visualSrc: string | null | undefined;
  onClose: () => void;
  onStartCooking?: (profile: GeneratedCutProfile) => void;
  onVisualError: (src: string) => void;
  inline: boolean;
};

function CutDetailContent({
  profile,
  lang,
  displayName,
  helpfulAlias,
  methodIcon,
  methodValue,
  primaryCtaLabel,
  cutIconSrc,
  visualSrc,
  onClose,
  onStartCooking,
  onVisualError,
  inline,
}: CutDetailContentProps) {
  return (
    <div
      className={
        inline
          /* allow-arbitrary: pre-slice-a */
          ? "pointer-events-auto w-full rounded-[2rem] border border-white/10 bg-[#070503]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          /* allow-arbitrary: pre-slice-a */
          : "pointer-events-auto max-h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem)] max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem)] w-full overflow-y-auto scroll-pb-[calc(1rem+env(safe-area-inset-bottom))] rounded-t-[2rem] border border-white/10 bg-[#070503]/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-28px_110px_rgba(0,0,0,0.72)] backdrop-blur-2xl sm:max-h-[calc(100vh-env(safe-area-inset-top)-1.75rem)] sm:max-h-[calc(100dvh-env(safe-area-inset-top)-1.75rem)] sm:scroll-pb-8 sm:rounded-[2rem] sm:p-5 sm:pb-5"
      }
    >
      {!inline && <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/20" />}
      <CutIdentityHeader
        title={displayName}
        eyebrow={getAnimalLabel(profile.animalId, lang)}
        description={
          helpfulAlias
            ? lang === "es"
              ? `También conocido como ${helpfulAlias}.`
              : lang === "fi"
                ? `Tunnetaan myös nimellä ${helpfulAlias}.`
                : `Also known as ${helpfulAlias}.`
            : getCutDescriptor(profile, lang)
        }
        iconSrc={cutIconSrc}
        chips={
          <>
            <CutMetaChip tone="accent">{getCategoryLabel(profile.category || "other", lang)}</CutMetaChip>
            <CutMetaChip>{getDifficultyLabel(profile, lang)}</CutMetaChip>
            <CutMetaChip>{getEstimatedTimeLabel(profile, lang)}</CutMetaChip>
          </>
        }
        action={
          <button
            type="button"
            onClick={onClose}
            /* allow-arbitrary: pre-slice-a */
            className={`inline-flex h-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-white/10 bg-white/[0.07] px-3 text-xs font-black text-zinc-200 shadow-lg transition hover:bg-white/12 active:scale-[0.97] ${
              inline ? "" : "sticky top-0"
            }`}
          >
            {lang === "es" ? "Cerrar" : lang === "fi" ? "Sulje" : "Close"}
          </button>
        }
      />

      <button
        type="button"
        onClick={() => onStartCooking?.(profile)}
        /* allow-arbitrary: pre-slice-a */
        className="mt-4 w-full rounded-[1.35rem] bg-gradient-to-r from-orange-400 to-red-500 px-5 py-4 text-sm font-black text-black shadow-[0_20px_70px_rgba(249,115,22,0.25)] transition active:scale-[0.98]"
      >
        {primaryCtaLabel}
      </button>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        <CutInfoModule
          title={lang === "es" ? "Por qué elegirlo" : lang === "fi" ? "Miksi valita tämä" : "Why choose it"}
          value={getWhyChooseLabel(profile, lang)}
        />
        <CutInfoModule
          title={lang === "es" ? "Mejor método" : lang === "fi" ? "Paras menetelmä" : "Best method"}
          value={methodValue}
          icon={
            methodIcon ? (
              <AppIcon
                category={methodIcon.category}
                iconKey={methodIcon.key}
                alt=""
                size="sm"
                aria-hidden="true"
                className="h-5 w-5 opacity-90"
              />
            ) : undefined
          }
        />
        <CutInfoModule
          title={lang === "es" ? "Tiempo y dificultad" : lang === "fi" ? "Aika ja vaikeus" : "Time and difficulty"}
          value={`${getEstimatedTimeLabel(profile, lang)} · ${getDifficultyLabel(profile, lang)} · ${
            lang === "es" ? "reposo" : lang === "fi" ? "lepo" : "rest"
          } ${profile.restingMinutes} min`}
        />
      </div>

      {visualSrc ? (
        /* allow-arbitrary: pre-slice-a */
        <div className="mt-2.5 overflow-hidden rounded-[1.2rem] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(251,146,60,0.16),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))] shadow-lg shadow-black/20 ring-1 ring-inset ring-white/[0.04]">
          <div className="relative aspect-[16/7] w-full sm:aspect-[16/6]">
            <Image
              src={visualSrc}
              alt={
                lang === "es"
                  ? `Visual de ${displayName}`
                  : lang === "fi"
                    ? `${displayName} - kuva`
                    : `Visual for ${displayName}`
              }
              fill
              loading="lazy"
              sizes="(min-width: 640px) 560px, 100vw"
              className="object-contain p-5 sm:p-6"
              onError={() => onVisualError(visualSrc)}
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_62%,rgba(2,6,23,0.56)_100%)]" />
          </div>
        </div>
      ) : null}

      <div className="mt-2.5">
        <CutInfoModule
          title={lang === "es" ? "Nota de seguridad" : lang === "fi" ? "Turvallisuushuomio" : "Safety note"}
          value={getSafetyNote(profile, lang)}
          tone="warning"
        />
      </div>
    </div>
  );
}

