"use client";

import { deleteGeneratedMenu } from "@/app/actions/savedMenus";
import type { Json, SavedMenu } from "@/lib/db/savedMenus";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type Lang = "es" | "en" | "fi";
type Blocks = Record<string, string>;

const texts = {
  es: {
    eyebrow: "Mis menús",
    title: "Tus parrilladas guardadas",
    subtitle:
      "Recupera cualquier menú, revisa la compra y vuelve al plan de cocción cuando quieras.",
    back: "Volver al generador",
    language: "Idioma",
    menus: "menús",
    people: "personas",
    noPeople: "Sin personas",
    savedOn: "Guardado",
    details: "Ver detalles",
    hideDetails: "Ocultar detalles",
    delete: "Eliminar",
    deleting: "Eliminando...",
    emptyTitle: "Todavía no tienes menús guardados",
    emptyText:
      "Crea un menú BBQ desde el generador y guárdalo para tenerlo aquí listo para repetir.",
    createFirst: "Crear primer menú",
    deleteError: "No se pudo eliminar el menú. Inténtalo otra vez.",
    summary: "Resumen",
    untitled: "Menú sin nombre",
    unknown: "Sin fecha",
  },
  en: {
    eyebrow: "My menus",
    title: "Your saved grill plans",
    subtitle:
      "Open any menu, review the shopping list, and get back to the cooking plan whenever you need it.",
    back: "Back to generator",
    language: "Language",
    menus: "menus",
    people: "people",
    noPeople: "No people set",
    savedOn: "Saved",
    details: "View details",
    hideDetails: "Hide details",
    delete: "Delete",
    deleting: "Deleting...",
    emptyTitle: "You do not have saved menus yet",
    emptyText:
      "Create a BBQ menu from the generator and save it so it is ready here for next time.",
    createFirst: "Create first menu",
    deleteError: "Could not delete the menu. Try again.",
    summary: "Summary",
    untitled: "Untitled menu",
    unknown: "No date",
  },
  fi: {
    eyebrow: "Omat menut",
    title: "Tallennetut grillisuunnitelmat",
    subtitle:
      "Avaa menu, tarkista ostoslista ja palaa kypsennyssuunnitelmaan milloin tahansa.",
    back: "Takaisin generaattoriin",
    language: "Kieli",
    menus: "menua",
    people: "henkilöä",
    noPeople: "Ei henkilömäärää",
    savedOn: "Tallennettu",
    details: "Näytä tiedot",
    hideDetails: "Piilota tiedot",
    delete: "Poista",
    deleting: "Poistetaan...",
    emptyTitle: "Sinulla ei ole vielä tallennettuja menuja",
    emptyText:
      "Luo BBQ-menu generaattorissa ja tallenna se, jotta se löytyy täältä seuraavaa kertaa varten.",
    createFirst: "Luo ensimmäinen menu",
    deleteError: "Menun poistaminen epäonnistui. Yritä uudelleen.",
    summary: "Yhteenveto",
    untitled: "Nimetön menu",
    unknown: "Ei päivämäärää",
  },
} satisfies Record<Lang, Record<string, string>>;

const localeByLang: Record<Lang, string> = {
  es: "es-ES",
  en: "en-US",
  fi: "fi-FI",
};

const langOptions: Array<{ value: Lang; label: string }> = [
  { value: "es", label: "ES" },
  { value: "en", label: "EN" },
  { value: "fi", label: "FI" },
];

export default function SavedMenusClient({
  initialMenus,
}: {
  initialMenus: SavedMenu[];
}) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("es");
  const [menus, setMenus] = useState(initialMenus);
  const [openMenuId, setOpenMenuId] = useState<string | null>(
    initialMenus[0]?.id ?? null,
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const t = texts[lang];

  const totalPeople = useMemo(
    () => menus.reduce((sum, menu) => sum + (menu.people ?? 0), 0),
    [menus],
  );

  function handleDelete(menuId: string) {
    const previousMenus = menus;
    setError("");
    setPendingDeleteId(menuId);
    setMenus((currentMenus) =>
      currentMenus.filter((menu) => menu.id !== menuId),
    );

    if (openMenuId === menuId) {
      setOpenMenuId(null);
    }

    startTransition(async () => {
      try {
        await deleteGeneratedMenu(menuId);
        router.refresh();
      } catch {
        setMenus(previousMenus);
        setError(t.deleteError);
      } finally {
        setPendingDeleteId(null);
      }
    });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-5 py-8 text-slate-100 sm:px-8">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.22),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(234,179,8,0.12),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_58%,#020617_100%)]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.32em] text-orange-300">
                {t.eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">
                {t.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                {t.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-slate-300">
                <span className="mr-3 text-slate-500">{t.language}</span>
                <select
                  value={lang}
                  onChange={(event) => setLang(event.target.value as Lang)}
                  className="bg-transparent font-black text-white outline-none"
                >
                  {langOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <Link
                href="/"
                className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-950/40 transition hover:bg-orange-400"
              >
                {t.back}
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Metric value={menus.length.toString()} label={t.menus} />
            <Metric value={totalPeople.toString()} label={t.people} />
            <Metric
              value={menus[0] ? formatDate(menus[0].created_at, lang) : "—"}
              label={t.savedOn}
            />
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-200">
            {error}
          </div>
        )}

        {menus.length === 0 ? (
          <EmptyState t={t} />
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {menus.map((menu) => {
              const blocks = getBlocks(menu.data);
              const isOpen = openMenuId === menu.id;
              const isDeleting = isPending && pendingDeleteId === menu.id;

              return (
                <article
                  key={menu.id}
                  tabIndex={0}
                  onClick={() => setOpenMenuId(isOpen ? null : menu.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      setOpenMenuId(isOpen ? null : menu.id);
                    }
                  }}
                  className="group cursor-pointer rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/20 outline-none backdrop-blur transition hover:-translate-y-1 hover:border-orange-400/60 hover:bg-white/[0.07] focus:border-orange-400"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-3xl ring-1 ring-orange-400/30">
                      🔥
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-slate-300">
                      {menu.lang.toUpperCase()}
                    </span>
                  </div>

                  <h2 className="line-clamp-2 text-2xl font-black text-white">
                    {menu.name || t.untitled}
                  </h2>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <InfoPill label={t.savedOn} value={formatDate(menu.created_at, lang)} />
                    <InfoPill
                      label={t.people}
                      value={menu.people ? `${menu.people} ${t.people}` : t.noPeople}
                    />
                  </div>

                  <p className="mt-5 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-300">
                    {getSummary(blocks, t)}
                  </p>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId(isOpen ? null : menu.id);
                      }}
                      className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-orange-100"
                    >
                      {isOpen ? t.hideDetails : t.details}
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(menu.id);
                      }}
                      className="rounded-2xl border border-red-400/40 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDeleting ? t.deleting : t.delete}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                      {Object.entries(blocks).map(([title, content]) => (
                        <section key={title} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                          <h3 className="text-sm font-black uppercase tracking-wide text-orange-300">
                            {title}
                          </h3>
                          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-200">
                            {content}
                          </p>
                        </section>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-400">{label}</p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-100">{value}</p>
    </div>
  );
}

function EmptyState({ t }: { t: (typeof texts)[Lang] }) {
  return (
    <section className="rounded-[2rem] border border-dashed border-orange-400/40 bg-orange-500/[0.06] p-10 text-center shadow-2xl shadow-black/20">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500/15 text-4xl ring-1 ring-orange-400/30">
        🍽️
      </div>
      <h2 className="mt-6 text-3xl font-black text-white">{t.emptyTitle}</h2>
      <p className="mx-auto mt-3 max-w-xl text-slate-300">{t.emptyText}</p>
      <Link
        href="/"
        className="mt-7 inline-flex rounded-2xl bg-orange-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-950/40 transition hover:bg-orange-400"
      >
        {t.createFirst}
      </Link>
    </section>
  );
}

function getBlocks(data: Json): Blocks {
  if (!isRecord(data)) return {};

  const blocks = data.blocks;
  if (isRecord(blocks)) {
    return toStringRecord(blocks);
  }

  return toStringRecord(data);
}

function toStringRecord(value: Record<string, Json | undefined>): Blocks {
  return Object.entries(value).reduce<Blocks>((acc, [key, item]) => {
    if (typeof item === "string" && item.trim()) {
      acc[key] = item;
    }
    return acc;
  }, {});
}

function isRecord(value: Json | undefined): value is Record<string, Json | undefined> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getSummary(blocks: Blocks, t: (typeof texts)[Lang]) {
  const content =
    blocks.MENU ??
    blocks.SUMMARY ??
    blocks.RESUMEN ??
    blocks.COMPRA ??
    blocks.SHOPPING ??
    Object.values(blocks)[0];

  if (!content) return t.summary;

  return content.replace(/\s+/g, " ").trim();
}

function formatDate(value: string, lang: Lang) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return texts[lang].unknown;
  }

  return new Intl.DateTimeFormat(localeByLang[lang], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
