export function formatTitle(title: string) {
  const map: Record<string, string> = {
    SETUP: "🔥 Setup",
    TIEMPOS: "⏱️ Tiempos",
    TIMES: "⏱️ Times",
    TEMPERATURA: "🌡️ Temperatura",
    TEMPERATURE: "🌡️ Temperature",
    PASOS: "🧠 Pasos",
    STEPS: "🧠 Steps",
    ERROR: "⚠️ Error clave",
    "KEY ERROR": "⚠️ Key error",
    MENU: "🍽️ Menú",
    CANTIDADES: "📊 Cantidades",
    QUANTITIES: "📊 Quantities",
    TIMELINE: "⏱️ Timeline Parrillada",
    GRILL_MANAGER: "🔥 Grill Manager Pro",
    ORDEN: "🔥 Orden de cocción",
    ORDER: "🔥 Cooking order",
    COMPRA: "🛒 Lista de compra",
    SHOPPING: "🛒 Shopping list",
  };

  return map[title] || title;
}

export function getResultCardIcon(title: string) {
  const normalized = title.toUpperCase();

  if (normalized.includes("SETUP")) return "🔥";
  if (normalized.includes("TIEMPOS") || normalized.includes("TIMES")) return "⏱️";
  if (normalized.includes("TEMPERATURA") || normalized.includes("TEMPERATURE")) return "🌡️";
  if (normalized.includes("PASOS") || normalized.includes("STEPS")) return "🧠";
  if (normalized.includes("COMPRA") || normalized.includes("SHOPPING")) return "🛒";
  if (normalized.includes("TIMELINE")) return "⏳";
  if (normalized.includes("GRILL_MANAGER") || normalized.includes("GRILL MANAGER")) return "🎛️";

  const [first] = title.trim().split(" ");
  return first && first.length <= 3 ? first : "✦";
}

export function getResultCardTitle(title: string) {
  const [first, ...rest] = title.trim().split(" ");
  return first && first.length <= 3 && rest.length > 0 ? rest.join(" ") : title;
}

export function getResultCardAccent(title: string) {
  const normalized = title.toUpperCase();

  if (normalized.includes("COMPRA") || normalized.includes("SHOPPING")) return "bg-emerald-400/70";
  if (normalized.includes("TIEMPOS") || normalized.includes("TIMES")) return "bg-sky-400/70";
  if (normalized.includes("TEMPERATURA") || normalized.includes("TEMPERATURE"))
    return "bg-red-400/70";
  if (normalized.includes("PASOS") || normalized.includes("STEPS")) return "bg-violet-400/70";
  if (normalized.includes("TIMELINE")) return "bg-amber-400/70";
  if (normalized.includes("GRILL_MANAGER") || normalized.includes("GRILL MANAGER"))
    return "bg-orange-400/70";
  return "bg-orange-400/60";
}

export function getShoppingItems(text: string) {
  return text
    .split("\n")
    .map((item) => item.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

export function getGrillManagerLineClass(line: string) {
  const isWarning = line.includes("⚠️");
  const isFire = line.includes("🔥");
  const isPriority = line.includes("⭐");

  if (isWarning) return "rounded-2xl border border-red-500/50 bg-red-500/10 p-4";
  if (isFire) return "rounded-2xl border border-orange-500/50 bg-orange-500/10 p-4";
  if (isPriority) return "rounded-2xl border border-yellow-500/50 bg-yellow-500/10 p-4";
  return "rounded-2xl border border-slate-700 bg-slate-950 p-4";
}

export function getZoneLabel(zone: string) {
  if (zone === "directa") return "🔥 Directo";
  if (zone === "indirecta") return "♨️ Indirecto";
  if (zone === "acompañamiento") return "🥔 Acompañamiento";
  if (zone === "reposo") return "✅ Servir";
  return "🔥 BBQ";
}

export function getZoneClass(zone: string) {
  if (zone === "directa") return "border-orange-500 bg-orange-500/15";
  if (zone === "indirecta") return "border-yellow-500 bg-yellow-500/10";
  if (zone === "acompañamiento") return "border-green-500 bg-green-500/10";
  if (zone === "reposo") return "border-blue-500 bg-blue-500/10";
  return "border-slate-700 bg-slate-900";
}

export function parseTimeline(content: string) {
  return content
    .split("\n")
    .map((row) => {
      const [start, end, name, zone, duration, notes] = row.split("|");
      return { start, end, name, zone, duration, notes };
    })
    .filter((item) => item.start && item.name);
}

export function buildTimelineView(
  content: string,
  now: Date,
  demoMode: boolean,
  demoStart: Date | null,
) {
  const items = parseTimeline(content);
  const realNowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  const firstStartMin = Math.min(
    ...items
      .map((item) => minutesFromTime(item.start))
      .filter((value): value is number => value !== null),
  );

  const demoElapsedSeconds =
    demoMode && demoStart ? Math.floor((now.getTime() - demoStart.getTime()) / 1000) : 0;
  const nowSecondsOfDay =
    demoMode && Number.isFinite(firstStartMin)
      ? firstStartMin * 60 + demoElapsedSeconds
      : realNowSeconds;

  const enriched = items.map((item) => {
    const startMin = minutesFromTime(item.start);
    const endMin = item.end === "--" ? startMin : minutesFromTime(item.end);
    const startSec = startMin === null ? null : startMin * 60;
    const endSec = endMin === null ? startSec : endMin * 60;

    const isActive =
      startSec !== null &&
      endSec !== null &&
      nowSecondsOfDay >= startSec &&
      nowSecondsOfDay <= endSec &&
      item.end !== "--";
    const isNext = startSec !== null && startSec > nowSecondsOfDay;
    const secondsUntil = startSec !== null ? startSec - nowSecondsOfDay : 0;

    return { ...item, isActive, isNext, secondsUntil };
  });

  const activeItem = enriched.find((item) => item.isActive);
  const nextItem = enriched
    .filter((item) => item.isNext)
    .sort((a, b) => a.secondsUntil - b.secondsUntil)[0];

  return { enriched, activeItem, nextItem };
}

export function minutesFromTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

export function secondsToClock(seconds: number) {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;

  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
