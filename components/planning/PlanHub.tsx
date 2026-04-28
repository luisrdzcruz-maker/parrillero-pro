"use client";

import { Button } from "@/components/ui";
import { Select, type Blocks, type SaveMenuStatus } from "@/components/cooking/CookingWizard";
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

const planModes: Array<{ id: PlanMode; label: string }> = [
  { id: "rapido", label: "Rápido" },
  { id: "completo", label: "Completo" },
  { id: "evento", label: "Evento" },
];

const equipmentOptions = [
  "parrilla gas",
  "parrilla carbón",
  "kamado",
  "cocina interior",
  "Napoleon Rogue 525-2",
];

const difficultyOptions = ["fácil", "medio", "avanzado"];

const modeCopy: Record<
  PlanMode,
  {
    badge: string;
    cta: string;
    description: string;
  }
> = {
  rapido: {
    badge: "Datos básicos",
    cta: "Crear plan",
    description: "Lo esencial para cocinar sin perder tiempo.",
  },
  completo: {
    badge: "Parrillada completa",
    cta: "Crear plan",
    description: "Cantidades, acompañamientos, equipo y dificultad.",
  },
  evento: {
    badge: "Evento",
    cta: "Crear plan",
    description: "Para grupos: hora objetivo, zonas de fuego y orden de cocción.",
  },
};

const resultCards = [
  {
    icon: "🔥",
    keys: ["SETUP", "MENU", "GRILL_MANAGER"],
    title: "Setup",
  },
  {
    icon: "⏱️",
    keys: ["TIEMPOS", "TEMPERATURA", "TIMING", "TIMELINE", "CANTIDADES"],
    title: "Tiempos + Temperatura",
  },
  {
    icon: "🧠",
    keys: ["PASOS", "ORDEN", "COMPRA"],
    title: "Pasos",
  },
  {
    icon: "⚠️",
    keys: ["ERROR"],
    title: "Error clave",
  },
];

export function PlanHub({
  blocks,
  difficulty,
  equipment,
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
  const copy = modeCopy[planMode];
  const subtitle = useMemo(() => {
    if (planMode === "evento") return `${parrilladaPeople} personas · ${equipment}`;
    if (planMode === "rapido") return `${people} personas · ${planProduct || "Producto"} · ${equipment}`;
    return `${people} personas · ${menuMeats || "Productos"} · ${equipment}`;
  }, [equipment, menuMeats, parrilladaPeople, people, planMode, planProduct]);

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
              Organiza tu parrillada
            </h1>
            <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-300 sm:text-base">
              Calcula cantidades, tiempos y orden de cocción.
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
                label="Carnes / productos"
                placeholder="Ej: chuletón, verduras, costillas"
                value={planProduct}
                onChange={setPlanProduct}
              />
              <PlanInput
                inputMode="numeric"
                label="Número de personas"
                placeholder="Ej. 6"
                type="number"
                value={people}
                onChange={setPeople}
              />
              <Select label="Equipo" value={equipment} onChange={setEquipment} options={equipmentOptions} />
            </>
          )}

          {planMode === "completo" && (
            <>
              <PlanInput
                inputMode="numeric"
                label="Número de personas"
                placeholder="Ej. 6"
                type="number"
                value={people}
                onChange={setPeople}
              />
              <PlanInput
                label="Carnes / productos"
                placeholder="Ej: chuletón, secreto, maíz"
                value={menuMeats}
                onChange={setMenuMeats}
              />
              <PlanInput
                label="Acompañamientos"
                placeholder="Ej: patatas, ensalada, chimichurri"
                value={sides}
                onChange={setSides}
              />
              <Select label="Equipo" value={equipment} onChange={setEquipment} options={equipmentOptions} />
              <Select label="Dificultad" value={difficulty} onChange={setDifficulty} options={difficultyOptions} />
            </>
          )}

          {planMode === "evento" && (
            <>
              <PlanInput
                label="Número de personas"
                placeholder="Ej: 8"
                value={parrilladaPeople}
                onChange={setParrilladaPeople}
              />
              <PlanInput
                label="Hora objetivo"
                placeholder="Ej: 18:00"
                value={serveTime}
                onChange={setServeTime}
              />
              <PlanInput
                label="Productos"
                placeholder="Ej: costillas, chuletón, secreto"
                value={parrilladaProducts}
                onChange={setParrilladaProducts}
              />
              <PlanInput
                label="Acompañamientos"
                placeholder="Ej: patatas, ensalada, chimichurri"
                value={parrilladaSides}
                onChange={setParrilladaSides}
              />
              <Select label="Equipo" value={equipment} onChange={setEquipment} options={equipmentOptions} />
            </>
          )}

          <Button
            className="mt-1 min-h-[50px] rounded-2xl text-base font-black shadow-xl shadow-orange-500/20 active:scale-[0.98]"
            disabled={loading}
            fullWidth
            onClick={onGenerate}
          >
            {loading ? "Generando..." : copy.cta}
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
  visualOpen: boolean;
}) {
  return (
    <section className="w-full max-w-full overflow-x-hidden">
      <div className="animate-[fadeIn_260ms_ease-out] rounded-[2rem] border border-orange-400/20 bg-[radial-gradient(circle_at_85%_0%,rgba(249,115,22,0.22),transparent_30%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-5 shadow-2xl shadow-orange-950/20 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
              Resultado
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Resultado listo 🔥
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-300">{subtitle}</p>
          </div>
          <Button className="min-h-[48px] px-5 font-black" onClick={onEdit} variant="secondary">
            Editar
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
              ? "Guardado ✓"
              : saveMenuStatus === "saving"
                ? "Guardando..."
                : "Guardar"}
          </Button>
          <Button
            className="min-h-[54px] rounded-2xl font-black active:scale-[0.98]"
            fullWidth
            onClick={onShare}
            variant="outlineAccent"
          >
            Compartir
          </Button>
          <Button
            className="min-h-[54px] rounded-2xl font-black active:scale-[0.98]"
            fullWidth
            onClick={onCopy}
            variant="secondary"
          >
            Copiar
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
            onShowVisual={card.title === "Setup" ? onShowVisual : undefined}
            title={card.title}
          />
        ))}
      </div>

      {visualOpen && <VisualSetupModal onClose={onCloseVisual} />}
    </section>
  );
}

function PlanResultCard({
  blocks,
  icon,
  index,
  keys,
  onShowVisual,
  title,
}: {
  blocks: Blocks;
  icon: string;
  index: number;
  keys: string[];
  onShowVisual?: () => void;
  title: string;
}) {
  const content = getCardContent(blocks, keys);
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
            {lines} líneas
          </span>
        </div>
        <p className="mt-4 whitespace-pre-line text-sm font-medium leading-6 text-slate-300">
          {content}
        </p>
        {onShowVisual && (
          <Button className="mt-5 min-h-[46px] font-black" fullWidth onClick={onShowVisual} variant="outlineAccent">
            Ver visual
          </Button>
        )}
      </div>
    </article>
  );
}

function VisualSetupModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
              Setup visual
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">Zonas directa / indirecta</h2>
          </div>
          <Button onClick={onClose} variant="secondary">
            Cerrar
          </Button>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.25),transparent_34%),#020617] p-4">
          <div className="grid min-h-[260px] grid-cols-2 gap-3">
            <div className="flex flex-col justify-end rounded-2xl border border-orange-400/30 bg-orange-500/15 p-4">
              <span className="text-3xl">🔥</span>
              <p className="mt-2 text-lg font-black text-white">Zona directa</p>
              <p className="mt-1 text-sm text-orange-100">Sellar y dorar.</p>
            </div>
            <div className="flex flex-col justify-end rounded-2xl border border-blue-300/20 bg-blue-400/10 p-4">
              <span className="text-3xl">🌡️</span>
              <p className="mt-2 text-lg font-black text-white">Zona indirecta</p>
              <p className="mt-1 text-sm text-blue-100">Cocción suave y control.</p>
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-4 text-center text-sm font-bold text-slate-300">
            Placeholder visual: imagen de parrilla y distribución de zonas.
          </div>
        </div>
      </div>
    </div>
  );
}

function getCardContent(blocks: Blocks, keys: string[]) {
  const parts = keys
    .map((key) => blocks[key])
    .filter((value): value is string => Boolean(value?.trim()));

  return parts.length > 0 ? parts.join("\n\n") : "Información lista para completar según el plan generado.";
}
