"use client";

import { useMemo, useState } from "react";
import {
  generatedCutProfiles,
  type GeneratedAnimalId,
  type GeneratedCookingMethod,
  type GeneratedCookingStyle,
  type GeneratedCutProfile,
} from "@/lib/generated/cutProfiles";

type IntentId = "all" | "quick" | "premium" | "safe" | "vegetables";
type ViewMode = "list" | "map";

const animalLabels: Record<GeneratedAnimalId, string> = {
  beef: "Vacuno",
  pork: "Cerdo",
  chicken: "Pollo",
  fish: "Pescado",
  vegetables: "Verduras",
};

const animalOrder: GeneratedAnimalId[] = ["beef", "pork", "chicken", "fish", "vegetables"];

const methodLabels: Record<GeneratedCookingMethod, string> = {
  grill_direct: "Parrilla directa",
  grill_indirect: "Parrilla indirecta",
  reverse_sear: "Reverse sear",
  oven_pan: "Sarten / horno",
  vegetables_grill: "Verduras a la parrilla",
};

const intentOptions: Array<{ id: IntentId; label: string; helper: string }> = [
  { id: "all", label: "Todos", helper: "Catalogo completo agrupado" },
  { id: "quick", label: "Rapido", helper: "Cortes directos y de poco tiempo" },
  { id: "premium", label: "Premium", helper: "Piezas gruesas o de control fino" },
  { id: "safe", label: "Seguro", helper: "Pollo, cerdo y cocciones completas" },
  { id: "vegetables", label: "Verduras", helper: "Guarniciones y vegetales" },
];

const quickPickIds = ["ribeye", "picanha", "iberian_secreto", "chicken_thigh", "salmon_fillet", "corn_on_cob"];

function displayName(profile: GeneratedCutProfile) {
  return profile.aliasesEn[0] ?? profile.canonicalNameEn;
}

function difficultyForStyle(style: GeneratedCookingStyle) {
  if (style === "reverse" || style === "lowSlow") return "Avanzado";
  if (style === "fast" || style === "vegetable") return "Facil";
  return "Medio";
}

function estimatedTime(profile: GeneratedCutProfile) {
  if (profile.cookingMinutes) return `${profile.cookingMinutes} min`;

  switch (profile.style) {
    case "fast":
      return "8-12 min";
    case "thick":
      return "18-28 min";
    case "reverse":
      return "45-70 min";
    case "fatcap":
      return "25-35 min";
    case "lowSlow":
      return "2-3 h";
    case "crispy":
      return "35-50 min";
    case "poultry":
      return "25-45 min";
    case "fish":
      return "8-15 min";
    case "vegetable":
      return "10-25 min";
  }
}

function temperatureHint(profile: GeneratedCutProfile) {
  switch (profile.animalId) {
    case "beef":
      return "50-58 C";
    case "pork":
      return "63-70 C";
    case "chicken":
      return "74 C";
    case "fish":
      return "50-54 C";
    case "vegetables":
      return null;
  }
}

function cuttingGuidance(profile: GeneratedCutProfile) {
  if (profile.animalId === "vegetables") return "Corta piezas parejas para que todo llegue al punto a la vez.";
  if (profile.style === "fatcap") return "Corta contra la fibra y conserva una capa fina de grasa renderizada.";
  if (profile.style === "fish") return "Sirve con cortes limpios, sin romper la piel marcada.";
  if (profile.style === "poultry") return "Separa por articulaciones y revisa jugos claros antes de servir.";
  return "Deja reposar y corta contra la fibra para mantener jugosidad.";
}

function safetyGuidance(profile: GeneratedCutProfile) {
  if (profile.animalId === "chicken") return "Prioriza centro seguro antes que color exterior.";
  if (profile.animalId === "pork") return "Evita servir zonas frias o crudas en cortes gruesos.";
  if (profile.errorEn) return `Evita: ${profile.errorEn}`;
  return "Controla calor y reposo antes de cortar.";
}

function matchesIntent(profile: GeneratedCutProfile, intent: IntentId) {
  if (intent === "all") return true;
  if (intent === "quick") return profile.style === "fast" || profile.style === "fish";
  if (intent === "premium") return ["reverse", "thick", "fatcap", "lowSlow"].includes(profile.style);
  if (intent === "safe") return profile.animalId === "chicken" || profile.animalId === "pork";
  return profile.animalId === "vegetables";
}

function groupByAnimal(profiles: GeneratedCutProfile[]) {
  return animalOrder
    .map((animalId) => ({
      animalId,
      label: animalLabels[animalId],
      cuts: profiles.filter((profile) => profile.animalId === animalId),
    }))
    .filter((group) => group.cuts.length > 0);
}

export function CutSelectionScreen() {
  const [intent, setIntent] = useState<IntentId>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedProfile, setSelectedProfile] = useState<GeneratedCutProfile | null>(generatedCutProfiles[0] ?? null);

  const profiles = useMemo(
    () => generatedCutProfiles.filter((profile) => matchesIntent(profile, intent)),
    [intent],
  );
  const groupedProfiles = useMemo(() => groupByAnimal(profiles), [profiles]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#030201] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 -top-36 h-[420px] w-[420px] rounded-full bg-orange-500/20 blur-[110px]" />
        <div className="absolute right-[-180px] top-32 h-[380px] w-[380px] rounded-full bg-red-600/15 blur-[120px]" />
        <div className="absolute bottom-[-220px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[150px]" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-36 pt-5 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-orange-300/15 bg-white/[0.045] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="inline-flex rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-orange-200">
            Dev demo · Cut selection
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_300px] lg:items-end">
            <div>
              <h1 className="text-[clamp(2.25rem,12vw,5.5rem)] font-black leading-[0.9] tracking-[-0.06em]">
                Elige corte primero.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
                Prototipo list-first alimentado por perfiles generados. Agrupa por categoria para elegir rapido sin una lista plana interminable.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Fuente</p>
              <p className="mt-2 text-sm font-bold text-zinc-200">lib/generated/cutProfiles.ts</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">Solo UI. Sin engine, sin data layer, sin flujo principal.</p>
            </div>
          </div>
        </header>

        <div className="mt-5 grid gap-4 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
            <IntentSelector intent={intent} onChange={setIntent} />
            <QuickPicks selectedId={selectedProfile?.id} onPick={setSelectedProfile} />
            <CutViewToggle value={viewMode} onChange={setViewMode} />
          </aside>

          <div className="min-w-0">
            {viewMode === "list" ? (
              <CutList groups={groupedProfiles} selectedId={selectedProfile?.id} onSelect={setSelectedProfile} />
            ) : (
              <CutMap count={profiles.length} onBackToList={() => setViewMode("list")} />
            )}
          </div>
        </div>
      </section>

      <CutBottomSheet profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
    </main>
  );
}

export function IntentSelector({
  intent,
  onChange,
}: {
  intent: IntentId;
  onChange: (intent: IntentId) => void;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-black text-white">Intencion</h2>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">Paso 1</span>
      </div>
      <div className="grid gap-2">
        {intentOptions.map((option) => {
          const active = option.id === intent;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] ${
                active
                  ? "border-orange-400/60 bg-orange-500 text-black shadow-[0_16px_45px_rgba(249,115,22,0.22)]"
                  : "border-white/10 bg-black/25 hover:border-orange-400/40 hover:bg-white/[0.075]"
              }`}
            >
              <span className="block text-sm font-black">{option.label}</span>
              <span className={`mt-1 block text-xs ${active ? "text-black/65" : "text-zinc-500"}`}>
                {option.helper}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function QuickPicks({
  selectedId,
  onPick,
}: {
  selectedId?: string;
  onPick: (profile: GeneratedCutProfile) => void;
}) {
  const quickPicks = generatedCutProfiles.filter((profile) => quickPickIds.includes(profile.id));

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-black">Quick picks</h2>
        <span className="text-xs font-bold text-zinc-500">{quickPicks.length}</span>
      </div>
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 lg:grid lg:grid-cols-2 lg:overflow-visible lg:pb-0">
        {quickPicks.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => onPick(profile)}
            className={`min-w-[132px] snap-start rounded-2xl border p-3 text-left transition active:scale-[0.97] lg:min-w-0 ${
              selectedId === profile.id
                ? "border-orange-400 bg-orange-500/20"
                : "border-white/10 bg-black/25 hover:border-orange-400/40"
            }`}
          >
            <span className="block text-xs font-black text-white">{displayName(profile)}</span>
            <span className="mt-1 block text-[11px] font-semibold text-orange-300">
              {estimatedTime(profile)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function CutViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/30 p-2 backdrop-blur-xl">
      <div className="grid grid-cols-2 gap-2">
        {(["list", "map"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.16em] transition ${
              value === mode ? "bg-white text-black" : "text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
            }`}
          >
            {mode === "list" ? "Lista" : "Mapa"}
          </button>
        ))}
      </div>
    </section>
  );
}

export function CutList({
  groups,
  selectedId,
  onSelect,
}: {
  groups: Array<{ animalId: GeneratedAnimalId; label: string; cuts: GeneratedCutProfile[] }>;
  selectedId?: string;
  onSelect: (profile: GeneratedCutProfile) => void;
}) {
  if (groups.length === 0) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-8 text-center text-zinc-400">
        No hay cortes para este filtro.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.animalId} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">Categoria</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">{group.label}</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold text-zinc-400">
              {group.cuts.length} cortes
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.cuts.map((profile) => (
              <CutCard
                key={profile.id}
                profile={profile}
                selected={selectedId === profile.id}
                onSelect={() => onSelect(profile)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function CutCard({
  profile,
  selected,
  onSelect,
}: {
  profile: GeneratedCutProfile;
  selected: boolean;
  onSelect: () => void;
}) {
  const temperature = temperatureHint(profile);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative min-h-[170px] rounded-[1.6rem] border p-4 text-left transition hover:-translate-y-0.5 active:scale-[0.98] ${
        selected
          ? "border-orange-400/70 bg-orange-500/20 shadow-[0_20px_70px_rgba(249,115,22,0.18)]"
          : "border-white/10 bg-[#080604]/80 hover:border-orange-400/45 hover:bg-white/[0.07]"
      }`}
    >
      <div className="flex h-full flex-col justify-between gap-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-black leading-tight tracking-tight text-white">{displayName(profile)}</h3>
            <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
              {profile.style}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">
            {profile.notesEn ?? profile.errorEn}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <CardMetric label="Nivel" value={difficultyForStyle(profile.style)} />
          <CardMetric label="Tiempo" value={estimatedTime(profile)} />
          <CardMetric label="Temp" value={temperature ?? "Visual"} muted={!temperature} />
        </div>
      </div>
    </button>
  );
}

function CardMetric({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <span className="rounded-2xl border border-white/10 bg-black/30 p-2">
      <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600">{label}</span>
      <span className={`mt-1 block text-[11px] font-black ${muted ? "text-zinc-400" : "text-orange-300"}`}>
        {value}
      </span>
    </span>
  );
}

export function CutBottomSheet({
  profile,
  onClose,
}: {
  profile: GeneratedCutProfile | null;
  onClose: () => void;
}) {
  if (!profile) return null;

  const temperature = temperatureHint(profile);

  return (
    <aside className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-3xl px-3 pb-3">
      <div className="rounded-t-[2rem] border border-white/10 bg-[#070503]/95 p-4 shadow-[0_-28px_110px_rgba(0,0,0,0.72)] backdrop-blur-2xl sm:rounded-[2rem] sm:p-5">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/20" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
              {animalLabels[profile.animalId]}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">{displayName(profile)}</h2>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{profile.canonicalNameEn}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-zinc-300 transition hover:bg-white/10"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SheetPanel title="Metodos" value={profile.allowedMethods.map((method) => methodLabels[method]).join(", ")} />
          <SheetPanel title="Temp" value={temperature ?? "Visual / textura"} />
          <SheetPanel title="Reposo" value={`${profile.restingMinutes} min`} />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <SheetPanel title="Corte" value={cuttingGuidance(profile)} />
          <SheetPanel title="Seguridad" value={safetyGuidance(profile)} tone="danger" />
        </div>

        <button
          type="button"
          className="mt-4 w-full rounded-[1.35rem] bg-gradient-to-r from-orange-400 to-red-500 px-5 py-4 text-sm font-black text-black shadow-[0_20px_70px_rgba(249,115,22,0.25)] transition active:scale-[0.98]"
        >
          Continuar con este corte
        </button>
        <p className="mt-2 text-center text-[11px] font-semibold text-zinc-600">
          CTA visual para demo. Todavia no conecta con el flujo principal.
        </p>
      </div>
    </aside>
  );
}

function SheetPanel({
  title,
  value,
  tone = "default",
}: {
  title: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={`rounded-[1.35rem] border p-4 ${
        tone === "danger" ? "border-red-400/20 bg-red-500/10" : "border-white/10 bg-white/[0.045]"
      }`}
    >
      <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${tone === "danger" ? "text-red-200" : "text-zinc-500"}`}>
        {title}
      </p>
      <p className="mt-2 text-sm font-semibold leading-5 text-zinc-100">{value}</p>
    </div>
  );
}

export function CutMap({ count, onBackToList }: { count: number; onBackToList: () => void }) {
  return (
    <section className="min-h-[520px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">Placeholder</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Cut map</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Espacio reservado para un mapa anatomico visual. La seleccion real sigue siendo list-first en esta demo.
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToList}
          className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black text-zinc-200"
        >
          Ver lista
        </button>
      </div>

      <div className="relative mt-8 h-[360px] rounded-[2rem] border border-dashed border-orange-300/25 bg-black/25">
        <div className="absolute left-[12%] top-[22%] h-28 w-44 rounded-[50%] border border-orange-400/25 bg-orange-500/10 blur-[0.2px]" />
        <div className="absolute left-[34%] top-[18%] h-36 w-56 rounded-[50%] border border-red-400/20 bg-red-500/10" />
        <div className="absolute bottom-[20%] right-[18%] h-24 w-40 rounded-[50%] border border-amber-300/20 bg-amber-500/10" />
        <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/10 bg-[#050302]/80 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Datos disponibles</p>
          <p className="mt-2 text-3xl font-black text-orange-300">{count} cortes filtrados</p>
        </div>
      </div>
    </section>
  );
}
