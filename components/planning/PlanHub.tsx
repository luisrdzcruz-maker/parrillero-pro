"use client";

import { AppIcon, Button } from "@/components/ui";
import { Select, type Blocks, type SaveMenuStatus } from "@/components/cooking/CookingWizard";
import { resolveEquipmentIconKey } from "@/lib/assets/equipmentMethodIconResolver";
import { texts, type AppText, type Lang } from "@/lib/i18n/texts";
import { useMemo, useState } from "react";

export type PlanMode = "rapido" | "completo" | "evento";

type SavedResult = {
  id: string;
  isPublic?: boolean;
  shareSlug?: string | null;
};

type PlanHubProps = {
  blocks: Blocks;
  difficulty: string;
  equipment: string;
  lang: Lang;
  loading: boolean;
  menuMeats: string;
  onCopy: () => void;
  onEdit: () => void;
  onGenerate: () => Promise<void> | void;
  onSave: () => Promise<SavedResult | null | void>;
  onShare: () => void;
  people: string;
  parrilladaPeople: string;
  parrilladaProducts: string;
  parrilladaSides: string;
  planGenerated: boolean;
  planMode: PlanMode;
  planProduct: string;
  saveMenuMessage: string;
  saveMenuStatus: SaveMenuStatus;
  serveTime: string;
  setDifficulty: (value: string) => void;
  setEquipment: (value: string) => void;
  setMenuMeats: (value: string) => void;
  setPeople: (value: string) => void;
  setParrilladaPeople: (value: string) => void;
  setParrilladaProducts: (value: string) => void;
  setParrilladaSides: (value: string) => void;
  setPlanMode: (mode: PlanMode) => void;
  setPlanProduct: (value: string) => void;
  setServeTime: (value: string) => void;
  setSides: (value: string) => void;
  sides: string;
};

export function PlanHub({
  blocks,
  difficulty,
  equipment,
  lang,
  loading,
  menuMeats,
  onCopy,
  onEdit,
  onGenerate,
  onSave,
  onShare,
  people,
  parrilladaPeople,
  parrilladaProducts,
  parrilladaSides,
  planGenerated,
  planMode,
  planProduct,
  saveMenuMessage,
  saveMenuStatus,
  serveTime,
  setDifficulty,
  setEquipment,
  setMenuMeats,
  setPeople,
  setParrilladaPeople,
  setParrilladaProducts,
  setParrilladaSides,
  setPlanMode,
  setPlanProduct,
  setServeTime,
  setSides,
  sides,
}: PlanHubProps) {
  const [visualOpen, setVisualOpen] = useState(false);
  const t = texts[lang];
  const planModes: Array<{ id: PlanMode; label: string }> = [
    { id: "rapido", label: t.planHubModeRapido },
    { id: "completo", label: t.planHubModeCompleto },
    { id: "evento", label: t.planHubModeEvento },
  ];
  const equipmentDisplayLabel: Record<string, string> = {
    "parrilla gas": t.equipmentLabelGasGrill,
    "parrilla carbón": t.equipmentLabelCharcoalGrill,
    kamado: t.equipmentLabelKamado,
    "cocina interior": t.equipmentLabelIndoorKitchen,
    "Napoleon Rogue 525-2": t.equipmentLabelNapoleon,
  };
  const equipmentOptions = [
    { value: "parrilla gas", label: t.equipmentLabelGasGrill },
    { value: "parrilla carbón", label: t.equipmentLabelCharcoalGrill },
    { value: "kamado", label: t.equipmentLabelKamado },
    { value: "cocina interior", label: t.equipmentLabelIndoorKitchen },
    { value: "Napoleon Rogue 525-2", label: t.equipmentLabelNapoleon },
  ];
  const difficultyOptions = [
    { value: "fácil", label: t.difficultyEasy },
    { value: "medio", label: t.difficultyMedium },
    { value: "avanzado", label: t.difficultyAdvanced },
  ];
  const modeCopy: Record<
    PlanMode,
    {
      badge: string;
      cta: string;
      description: string;
    }
  > = {
    rapido: {
      badge: t.planHubBadgeRapido,
      cta: t.planHubCreateCta,
      description: t.planHubModeDescriptionRapido,
    },
    completo: {
      badge: t.planHubBadgeCompleto,
      cta: t.planHubCreateCta,
      description: t.planHubModeDescriptionCompleto,
    },
    evento: {
      badge: t.planHubBadgeEvento,
      cta: t.planHubCreateCta,
      description: t.planHubModeDescriptionEvento,
    },
  };
  const resultCards = [
    {
      id: "setup" as const,
      icon: "🔥",
      keys: ["SETUP", "MENU", "GRILL_MANAGER"],
      title: t.planHubResultCardSetup,
    },
    {
      id: "timing" as const,
      icon: "⏱️",
      keys: ["TIEMPOS", "TEMPERATURA", "TIMING", "TIMELINE", "CANTIDADES"],
      title: t.planHubResultCardTiming,
    },
    {
      id: "steps" as const,
      icon: "🧠",
      keys: ["PASOS", "ORDEN", "COMPRA"],
      title: t.planHubResultCardSteps,
    },
    {
      id: "error" as const,
      icon: "⚠️",
      keys: ["ERROR"],
      title: t.planHubResultCardError,
    },
  ];
  const copy = modeCopy[planMode];
  const equipmentLabel = equipmentDisplayLabel[equipment] ?? equipment;
  const subtitle = useMemo(() => {
    if (planMode === "evento") return `${parrilladaPeople} ${t.planHubSubtitlePeopleUnit} · ${equipmentLabel}`;
    if (planMode === "rapido") {
      return `${people} ${t.planHubSubtitlePeopleUnit} · ${planProduct || t.planHubSubtitleDefaultProduct} · ${equipmentLabel}`;
    }
    return `${people} ${t.planHubSubtitlePeopleUnit} · ${menuMeats || t.planHubSubtitleDefaultProducts} · ${equipmentLabel}`;
  }, [
    equipmentLabel,
    menuMeats,
    parrilladaPeople,
    people,
    planMode,
    planProduct,
    t.planHubSubtitleDefaultProduct,
    t.planHubSubtitleDefaultProducts,
    t.planHubSubtitlePeopleUnit,
  ]);

  if (planGenerated) {
    return (
      <PlanResultView
        blocks={blocks}
        onCopy={onCopy}
        onEdit={onEdit}
        onSave={onSave}
        onShare={onShare}
        onShowVisual={() => setVisualOpen(true)}
        saveMenuMessage={saveMenuMessage}
        saveMenuStatus={saveMenuStatus}
        subtitle={subtitle}
        resultCards={resultCards}
        t={t}
        visualOpen={visualOpen}
        onCloseVisual={() => setVisualOpen(false)}
      />
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-[1180px] gap-3 overflow-x-hidden lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-6 xl:max-w-[1360px]">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-orange-400/15 bg-[radial-gradient(circle_at_20%_0%,rgba(249,115,22,0.20),transparent_34%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-4 shadow-2xl shadow-orange-950/20 sm:p-7 lg:sticky lg:top-6 lg:min-h-[420px]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="relative z-10 flex h-full flex-col justify-between gap-8">
          <div>
            <h1 className="max-w-xl text-[clamp(1.8rem,8vw,3.25rem)] font-black leading-[0.98] tracking-[-0.055em] text-white lg:text-5xl">
              {t.planHubTitle}
            </h1>
            <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-300 sm:text-base">
              {t.planHubSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-white/10 bg-black/30 p-1 backdrop-blur">
            {planModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setPlanMode(mode.id)}
                className={
                  planMode === mode.id
                    ? "min-h-[40px] rounded-xl bg-orange-500 text-sm font-black text-black shadow-lg shadow-orange-500/25 transition active:scale-[0.97]"
                    : "min-h-[40px] rounded-xl text-sm font-bold text-slate-400 transition hover:bg-white/5 hover:text-white active:scale-[0.97]"
                }
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/20 backdrop-blur sm:p-6">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
            {copy.badge}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-400">{copy.description}</p>
        </div>

        <div className="grid gap-3.5">
          {planMode === "rapido" && (
            <>
              <PlanInput
                label={t.planHubQuickProductLabel}
                placeholder={t.planHubQuickProductPlaceholder}
                value={planProduct}
                onChange={setPlanProduct}
              />
              <PlanInput
                inputMode="numeric"
                label={t.people}
                placeholder={t.planHubPeoplePlaceholder}
                type="number"
                value={people}
                onChange={setPeople}
              />
              <PlanEquipmentChips
                label={t.equipment}
                value={equipment}
                onChange={setEquipment}
                options={equipmentOptions}
              />
            </>
          )}

          {planMode === "completo" && (
            <>
              <PlanInput
                inputMode="numeric"
                label={t.people}
                placeholder={t.planHubPeoplePlaceholder}
                type="number"
                value={people}
                onChange={setPeople}
              />
              <PlanInput
                label={t.meats}
                placeholder={t.planHubCompleteProductPlaceholder}
                value={menuMeats}
                onChange={setMenuMeats}
              />
              <PlanInput
                label={t.sides}
                placeholder={t.planHubSidesPlaceholder}
                value={sides}
                onChange={setSides}
              />
              <PlanEquipmentChips
                label={t.equipment}
                value={equipment}
                onChange={setEquipment}
                options={equipmentOptions}
              />
              <Select label={t.difficulty} value={difficulty} onChange={setDifficulty} options={difficultyOptions} />
            </>
          )}

          {planMode === "evento" && (
            <>
              <PlanInput
                label={t.people}
                placeholder={t.planHubEventPeoplePlaceholder}
                value={parrilladaPeople}
                onChange={setParrilladaPeople}
              />
              <PlanInput
                label={t.serveTime}
                placeholder={t.planHubEventServeTimePlaceholder}
                value={serveTime}
                onChange={setServeTime}
              />
              <PlanInput
                label={t.products}
                placeholder={t.planHubEventProductsPlaceholder}
                value={parrilladaProducts}
                onChange={setParrilladaProducts}
              />
              <PlanInput
                label={t.sides}
                placeholder={t.planHubSidesPlaceholder}
                value={parrilladaSides}
                onChange={setParrilladaSides}
              />
              <PlanEquipmentChips
                label={t.equipment}
                value={equipment}
                onChange={setEquipment}
                options={equipmentOptions}
              />
            </>
          )}

          <Button
            className="mt-1 min-h-[50px] rounded-2xl text-base font-black shadow-xl shadow-orange-500/20 active:scale-[0.98]"
            disabled={loading}
            fullWidth
            onClick={onGenerate}
          >
            {loading ? t.planHubGenerating : copy.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}

function PlanInput({
  inputMode,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  inputMode?: "decimal" | "email" | "numeric" | "search" | "tel" | "text" | "url";
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.17em] text-slate-400">
        {label}
      </span>
      <input
        className="min-h-[50px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-[15px] font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400/60 focus:bg-black/40"
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function PlanEquipmentChips({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div>
      <p className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.17em] text-slate-400">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-2 min-[520px]:grid-cols-3">
        {options.map((option) => {
          const selected = option.value === value;
          const icon = resolveEquipmentIconKey(option.value) ?? resolveEquipmentIconKey(option.label);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={
                selected
                  ? "inline-flex min-h-[46px] min-w-0 items-center gap-2 rounded-2xl border border-orange-300/70 bg-orange-500/18 px-2.5 py-2 text-left text-[13px] font-black text-orange-50 shadow-[0_10px_28px_rgba(249,115,22,0.14)] ring-1 ring-orange-300/20 transition active:scale-[0.98]"
                  : "inline-flex min-h-[46px] min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-2.5 py-2 text-left text-[13px] font-bold text-slate-200 transition hover:border-orange-300/35 hover:bg-orange-500/8 active:scale-[0.98]"
              }
              aria-pressed={selected}
            >
              {icon ? (
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/28">
                  <AppIcon
                    category={icon.category}
                    iconKey={icon.key}
                    alt=""
                    size="sm"
                    aria-hidden="true"
                    className="h-5 w-5 opacity-90"
                  />
                </span>
              ) : null}
              <span className="min-w-0 truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlanResultView({
  blocks,
  onCloseVisual,
  onCopy,
  onEdit,
  onSave,
  onShare,
  onShowVisual,
  saveMenuMessage,
  saveMenuStatus,
  subtitle,
  resultCards,
  t,
  visualOpen,
}: {
  blocks: Blocks;
  onCloseVisual: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onSave: () => Promise<SavedResult | null | void>;
  onShare: () => void;
  onShowVisual: () => void;
  saveMenuMessage: string;
  saveMenuStatus: SaveMenuStatus;
  subtitle: string;
  resultCards: Array<{ id: "setup" | "timing" | "steps" | "error"; icon: string; keys: string[]; title: string }>;
  t: AppText;
  visualOpen: boolean;
}) {
  return (
    <section className="w-full max-w-full overflow-x-hidden">
      <div className="animate-[fadeIn_260ms_ease-out] rounded-[2rem] border border-orange-400/20 bg-[radial-gradient(circle_at_85%_0%,rgba(249,115,22,0.22),transparent_30%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-5 shadow-2xl shadow-orange-950/20 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
              {t.planHubResultEyebrow}
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
              {t.planHubResultTitle}
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-300">{subtitle}</p>
          </div>
          <Button className="min-h-[48px] px-5 font-black" onClick={onEdit} variant="secondary">
            {t.planHubEdit}
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Button
            className="min-h-[54px] rounded-2xl font-black active:scale-[0.98]"
            disabled={saveMenuStatus === "saving" || saveMenuStatus === "success"}
            fullWidth
            onClick={onSave}
          >
            {saveMenuStatus === "success"
              ? t.planHubSaved
              : saveMenuStatus === "saving"
                ? t.planHubSaving
                : t.planHubSave}
          </Button>
          <Button
            className="min-h-[54px] rounded-2xl font-black active:scale-[0.98]"
            fullWidth
            onClick={onShare}
            variant="outlineAccent"
          >
            {t.planHubShare}
          </Button>
          <Button
            className="min-h-[54px] rounded-2xl font-black active:scale-[0.98]"
            fullWidth
            onClick={onCopy}
            variant="secondary"
          >
            {t.planHubCopy}
          </Button>
        </div>

        {saveMenuMessage && (
          <p
            className={
              saveMenuStatus === "error"
                ? "mt-3 text-sm font-bold text-red-300"
                : "mt-3 text-sm font-bold text-emerald-300"
            }
          >
            {saveMenuMessage}
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {resultCards.map((card, index) => (
          <PlanResultCard
            key={card.title}
            blocks={blocks}
            icon={card.icon}
            index={index}
            keys={card.keys}
            onShowVisual={card.id === "setup" ? onShowVisual : undefined}
            t={t}
            title={card.title}
          />
        ))}
      </div>

      {visualOpen && <VisualSetupModal onClose={onCloseVisual} t={t} />}
    </section>
  );
}

function PlanResultCard({
  blocks,
  icon,
  index,
  keys,
  onShowVisual,
  t,
  title,
}: {
  blocks: Blocks;
  icon: string;
  index: number;
  keys: string[];
  onShowVisual?: () => void;
  t: AppText;
  title: string;
}) {
  const content = getCardContent(blocks, keys, t.planHubFallbackContent);
  const lines = content.split("\n").filter((line) => line.trim()).length || 1;

  return (
    <article
      className="translate-y-0 rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-white/[0.075] to-white/[0.025] p-[1px] opacity-100 shadow-2xl shadow-black/20 animate-[fadeIn_280ms_ease-out]"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="h-full rounded-[1.45rem] bg-slate-950/82 p-5 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-2xl">
              {icon}
            </div>
            <h2 className="text-lg font-black text-white">{title}</h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-300">
            {lines} {t.planHubLines}
          </span>
        </div>
        <p className="mt-4 whitespace-pre-line text-sm font-medium leading-6 text-slate-300">
          {content}
        </p>
        {onShowVisual && (
          <Button className="mt-5 min-h-[46px] font-black" fullWidth onClick={onShowVisual} variant="outlineAccent">
            {t.planHubShowVisual}
          </Button>
        )}
      </div>
    </article>
  );
}

function VisualSetupModal({ onClose, t }: { onClose: () => void; t: AppText }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
              {t.planHubVisualEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">{t.planHubVisualTitle}</h2>
          </div>
          <Button onClick={onClose} variant="secondary">
            {t.planHubVisualClose}
          </Button>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.25),transparent_34%),#020617] p-4">
          <div className="grid min-h-[260px] grid-cols-2 gap-3">
            <div className="flex flex-col justify-end rounded-2xl border border-orange-400/30 bg-orange-500/15 p-4">
              <span className="text-3xl">🔥</span>
              <p className="mt-2 text-lg font-black text-white">{t.planHubVisualDirectZone}</p>
              <p className="mt-1 text-sm text-orange-100">{t.planHubVisualDirectZoneHint}</p>
            </div>
            <div className="flex flex-col justify-end rounded-2xl border border-blue-300/20 bg-blue-400/10 p-4">
              <span className="text-3xl">🌡️</span>
              <p className="mt-2 text-lg font-black text-white">{t.planHubVisualIndirectZone}</p>
              <p className="mt-1 text-sm text-blue-100">{t.planHubVisualIndirectZoneHint}</p>
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-4 text-center text-sm font-bold text-slate-300">
            {t.planHubVisualPlaceholder}
          </div>
        </div>
      </div>
    </div>
  );
}

function getCardContent(blocks: Blocks, keys: string[], fallback: string) {
  const parts = keys
    .map((key) => blocks[key])
    .filter((value): value is string => Boolean(value?.trim()));

  return parts.length > 0 ? parts.join("\n\n") : fallback;
}
