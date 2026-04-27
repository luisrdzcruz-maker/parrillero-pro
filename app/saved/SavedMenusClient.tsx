"use client";

import {
  deleteGeneratedMenu,
  publishGeneratedMenu,
  unpublishGeneratedMenu,
} from "@/app/actions/savedMenus";
import type { Json, SavedMenu } from "@/lib/db/savedMenus";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type Lang = "es" | "en" | "fi";
type Blocks = Record<string, string>;
type SavedMenuType = "cooking_plan" | "generated_menu" | "parrillada_plan";

const texts = {
  es: {
    eyebrow: "Biblioteca",
    title: "Tus planes guardados",
    subtitle:
      "Recupera menús, listas de compra y planes de cocción como si fueran recetas premium.",
    back: "Crear plan",
    language: "Idioma",
    menus: "planes",
    people: "personas",
    noPeople: "Sin personas",
    savedOn: "Guardado",
    details: "Ver plan",
    hideDetails: "Ocultar",
    delete: "Eliminar",
    deleting: "Eliminando...",
    publish: "Publicar",
    unpublish: "Despublicar",
    copyLink: "Copiar link",
    private: "Privado",
    public: "Público",
    publishing: "Actualizando...",
    copiedShare: "Link copiado",
    shareError: "No se pudo actualizar el enlace público. Inténtalo otra vez.",
    localOnly: "Guarda en la nube para compartir",
    emptyTitle: "Todavía no tienes planes guardados",
    emptyText: "Crea un plan desde el generador y guárdalo para repetir tus mejores parrilladas.",
    createFirst: "Crear primer plan",
    deleteError: "No se pudo eliminar el menú. Inténtalo otra vez.",
    summary: "Resumen",
    untitled: "Plan sin nombre",
    unknown: "Sin fecha",
    search: "Buscar por nombre, corte o contenido...",
    noMatchesTitle: "No hay planes con ese filtro",
    noMatchesText: "Prueba con otro corte, producto o nombre guardado.",
    clearSearch: "Limpiar búsqueda",
    cut: "Corte",
    products: "Productos",
    typeCooking: "Cocción",
    typeMenu: "Menú",
    typeParrillada: "Parrillada",
  },
  en: {
    eyebrow: "Library",
    title: "Your saved cooking plans",
    subtitle: "Open menus, shopping lists and cooking plans like a premium recipe library.",
    back: "Create plan",
    language: "Language",
    menus: "plans",
    people: "people",
    noPeople: "No people set",
    savedOn: "Saved",
    details: "View plan",
    hideDetails: "Hide",
    delete: "Delete",
    deleting: "Deleting...",
    publish: "Publish",
    unpublish: "Unpublish",
    copyLink: "Copy link",
    private: "Private",
    public: "Public",
    publishing: "Updating...",
    copiedShare: "Link copied",
    shareError: "Could not update the public link. Try again.",
    localOnly: "Save to cloud to share",
    emptyTitle: "You do not have saved plans yet",
    emptyText:
      "Create a plan from the generator and save it so your best BBQs are ready to repeat.",
    createFirst: "Create first plan",
    deleteError: "Could not delete the menu. Try again.",
    summary: "Summary",
    untitled: "Untitled plan",
    unknown: "No date",
    search: "Search by name, cut or content...",
    noMatchesTitle: "No plans match that filter",
    noMatchesText: "Try another cut, product or saved name.",
    clearSearch: "Clear search",
    cut: "Cut",
    products: "Products",
    typeCooking: "Cooking",
    typeMenu: "Menu",
    typeParrillada: "Parrillada",
  },
  fi: {
    eyebrow: "Kirjasto",
    title: "Tallennetut grillisuunnitelmat",
    subtitle: "Avaa menut, ostoslistat ja kypsennyssuunnitelmat premium-reseptikirjastona.",
    back: "Luo suunnitelma",
    language: "Kieli",
    menus: "suunnitelmaa",
    people: "henkilöä",
    noPeople: "Ei henkilömäärää",
    savedOn: "Tallennettu",
    details: "Näytä suunnitelma",
    hideDetails: "Piilota",
    delete: "Poista",
    deleting: "Poistetaan...",
    publish: "Julkaise",
    unpublish: "Poista julkaisu",
    copyLink: "Kopioi linkki",
    private: "Yksityinen",
    public: "Julkinen",
    publishing: "Päivitetään...",
    copiedShare: "Linkki kopioitu",
    shareError: "Julkisen linkin päivitys epäonnistui. Yritä uudelleen.",
    localOnly: "Tallenna pilveen jakaaksesi",
    emptyTitle: "Sinulla ei ole vielä tallennettuja suunnitelmia",
    emptyText:
      "Luo suunnitelma generaattorissa ja tallenna parhaat grillaukset toistamista varten.",
    createFirst: "Luo ensimmäinen",
    deleteError: "Menun poistaminen epäonnistui. Yritä uudelleen.",
    summary: "Yhteenveto",
    untitled: "Nimetön suunnitelma",
    unknown: "Ei päivämäärää",
    search: "Hae nimellä, leikkauksella tai sisällöllä...",
    noMatchesTitle: "Ei hakua vastaavia suunnitelmia",
    noMatchesText: "Kokeile toista leikkausta, tuotetta tai tallennettua nimeä.",
    clearSearch: "Tyhjennä haku",
    cut: "Leikkaus",
    products: "Tuotteet",
    typeCooking: "Kypsennys",
    typeMenu: "Menu",
    typeParrillada: "Parrillada",
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

export default function SavedMenusClient({ initialMenus }: { initialMenus: SavedMenu[] }) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("es");
  const [menus, setMenus] = useState(initialMenus);
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(initialMenus[0]?.id ?? null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingShareId, setPendingShareId] = useState<string | null>(null);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const t = texts[lang];

  const menuModels = useMemo(
    () => menus.map((menu) => ({ menu, meta: getMenuMeta(menu, t) })),
    [menus, t],
  );

  const filteredMenus = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    if (!normalizedQuery) return menuModels;

    return menuModels.filter(({ menu, meta }) =>
      normalizeSearch(
        [
          menu.name,
          meta.summary,
          meta.cut,
          meta.products,
          Object.values(meta.blocks).join(" "),
        ].join(" "),
      ).includes(normalizedQuery),
    );
  }, [menuModels, query]);

  const totalPeople = useMemo(
    () => menus.reduce((sum, menu) => sum + (menu.people ?? 0), 0),
    [menus],
  );

  function handleDelete(menuId: string) {
    const previousMenus = menus;
    setError("");
    setPendingDeleteId(menuId);
    setMenus((currentMenus) => currentMenus.filter((menu) => menu.id !== menuId));

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

  function handleShareToggle(menu: SavedMenu) {
    if (menu.id.startsWith("local_") || menu.id.startsWith("local-")) {
      setError(t.localOnly);
      return;
    }

    setError("");
    setPendingShareId(menu.id);

    startTransition(async () => {
      try {
        const updatedMenu = menu.is_public
          ? await unpublishGeneratedMenu(menu.id)
          : await publishGeneratedMenu(menu.id);

        setMenus((currentMenus) =>
          currentMenus.map((currentMenu) =>
            currentMenu.id === updatedMenu.id ? updatedMenu : currentMenu,
          ),
        );

        if (!menu.is_public && updatedMenu.share_slug) {
          await copyShareLink(updatedMenu);
        }

        router.refresh();
      } catch {
        setError(t.shareError);
      } finally {
        setPendingShareId(null);
      }
    });
  }

  async function copyShareLink(menu: SavedMenu) {
    if (!menu.share_slug || typeof window === "undefined" || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(`${window.location.origin}/share/${menu.share_slug}`);
      setCopiedShareId(menu.id);
      window.setTimeout(() => setCopiedShareId(null), 2200);
    } catch {
      setError(t.shareError);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-slate-100 sm:px-8 sm:py-8">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.22),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(234,179,8,0.12),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_58%,#020617_100%)]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="mb-5 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 backdrop-blur sm:mb-8 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-300 sm:text-sm">
                {t.eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:mt-4 sm:text-6xl">
                {t.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:mt-4 sm:text-lg sm:leading-7">
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

          <div className="mt-5 grid gap-3 sm:mt-8 sm:grid-cols-3">
            <Metric value={menus.length.toString()} label={t.menus} />
            <Metric value={totalPeople.toString()} label={t.people} />
            <Metric
              value={menus[0] ? formatDate(menus[0].created_at, lang) : "—"}
              label={t.savedOn}
            />
          </div>
        </header>

        <section className="mb-5 rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-3 shadow-xl shadow-black/20 sm:mb-6 sm:p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400/60"
          />
        </section>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-200">
            {error}
          </div>
        )}

        {menus.length === 0 ? (
          <EmptyState t={t} />
        ) : filteredMenus.length === 0 ? (
          <NoMatchesState onClear={() => setQuery("")} t={t} />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMenus.map(({ menu, meta }) => {
              const isOpen = openMenuId === menu.id;
              const isDeleting = isPending && pendingDeleteId === menu.id;

              return (
                <SavedMenuCard
                  key={menu.id}
                  isDeleting={isDeleting}
                  isOpen={isOpen}
                  isSharing={isPending && pendingShareId === menu.id}
                  lang={lang}
                  menu={menu}
                  meta={meta}
                  onDelete={() => handleDelete(menu.id)}
                  onCopyLink={() => copyShareLink(menu)}
                  onShareToggle={() => handleShareToggle(menu)}
                  onToggle={() => setOpenMenuId(isOpen ? null : menu.id)}
                  shareCopied={copiedShareId === menu.id}
                  t={t}
                />
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

type SavedMenuMeta = {
  blocks: Blocks;
  cut: string;
  products: string;
  summary: string;
  type: SavedMenuType;
};

function SavedMenuCard({
  isDeleting,
  isOpen,
  isSharing,
  lang,
  menu,
  meta,
  onDelete,
  onCopyLink,
  onShareToggle,
  onToggle,
  shareCopied,
  t,
}: {
  isDeleting: boolean;
  isOpen: boolean;
  isSharing: boolean;
  lang: Lang;
  menu: SavedMenu;
  meta: SavedMenuMeta;
  onDelete: () => void;
  onCopyLink: () => void;
  onShareToggle: () => void;
  onToggle: () => void;
  shareCopied: boolean;
  t: (typeof texts)[Lang];
}) {
  const isLocal = menu.id.startsWith("local_") || menu.id.startsWith("local-");

  return (
    <article
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onToggle();
        }
      }}
      className="group cursor-pointer overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] shadow-xl shadow-black/20 outline-none backdrop-blur transition hover:-translate-y-1 hover:border-orange-400/60 hover:bg-white/[0.07] focus:border-orange-400"
    >
      <div className="relative min-h-40 p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(249,115,22,0.24),transparent_36%),linear-gradient(to_top,rgba(2,6,23,0.95),rgba(15,23,42,0.35))]" />
        <div className="relative">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="rounded-full border border-orange-400/25 bg-orange-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
              {getTypeLabel(meta.type, t)}
            </div>
            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-slate-300">
              {formatDate(menu.created_at, lang)}
            </span>
          </div>

          <h2 className="line-clamp-2 text-2xl font-black tracking-tight text-white">
            {menu.name || t.untitled}
          </h2>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{meta.summary}</p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <InfoPill
            label={t.people}
            value={menu.people ? `${menu.people} ${t.people}` : t.noPeople}
          />
          <InfoPill label={t.cut} value={meta.cut || "—"} />
          <InfoPill label={t.products} value={meta.products || "—"} />
          <InfoPill label={t.language} value={menu.lang.toUpperCase()} />
          <InfoPill label="Tipo" value={getTypeLabel(meta.type, t)} />
          <InfoPill label="Share" value={menu.is_public ? t.public : t.private} />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
            className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-orange-100"
          >
            {isOpen ? t.hideDetails : t.details}
          </button>
          <button
            type="button"
            disabled={isSharing || isLocal}
            onClick={(event) => {
              event.stopPropagation();
              onShareToggle();
            }}
            className="rounded-2xl border border-orange-400/40 px-4 py-3 text-sm font-black text-orange-200 transition hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSharing ? t.publishing : menu.is_public ? t.unpublish : t.publish}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="rounded-2xl border border-red-400/40 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? t.deleting : t.delete}
          </button>
        </div>

        {isLocal && (
          <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold text-slate-300">
            {t.localOnly}
          </p>
        )}

        {menu.is_public && menu.share_slug && (
          <div className="space-y-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
            <Link
              href={`/share/${menu.share_slug}`}
              onClick={(event) => event.stopPropagation()}
              className="block text-center text-xs font-black text-emerald-200 transition hover:text-emerald-100"
            >
              /share/{menu.share_slug}
            </Link>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCopyLink();
              }}
              className="w-full rounded-xl bg-emerald-400/15 px-3 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-400/25"
            >
              {shareCopied ? t.copiedShare : t.copyLink}
            </button>
          </div>
        )}

        {isOpen && (
          <div className="space-y-3 border-t border-white/10 pt-5">
            {Object.entries(meta.blocks).map(([title, content]) => (
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
      </div>
    </article>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-4 sm:p-5">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-400">{label}</p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/25 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-100">{value}</p>
    </div>
  );
}

function EmptyState({ t }: { t: (typeof texts)[Lang] }) {
  return (
    <section className="rounded-[2rem] border border-dashed border-orange-400/40 bg-orange-500/[0.06] p-8 text-center shadow-2xl shadow-black/20 sm:p-10">
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

function NoMatchesState({ onClear, t }: { onClear: () => void; t: (typeof texts)[Lang] }) {
  return (
    <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center shadow-2xl shadow-black/20">
      <h2 className="text-2xl font-black text-white">{t.noMatchesTitle}</h2>
      <p className="mx-auto mt-3 max-w-xl text-slate-300">{t.noMatchesText}</p>
      <button
        className="mt-6 rounded-2xl border border-orange-400/30 bg-orange-500/10 px-5 py-3 text-sm font-black text-orange-200"
        onClick={onClear}
      >
        {t.clearSearch}
      </button>
    </section>
  );
}

function getMenuMeta(menu: SavedMenu, t: (typeof texts)[Lang]): SavedMenuMeta {
  const blocks = getBlocks(menu.data);
  const cut = getInputValue(menu.data, ["cut", "cutId", "selectedCut"]);
  const products = getInputValue(menu.data, [
    "products",
    "meats",
    "menuMeats",
    "parrilladaProducts",
  ]);

  return {
    blocks,
    cut,
    products,
    summary: getSummary(blocks, t),
    type: getMenuType(menu.data),
  };
}

function getMenuType(data: Json): SavedMenuType {
  if (!isRecord(data)) return "generated_menu";

  const value = data.type;
  if (value === "cooking_plan" || value === "parrillada_plan" || value === "generated_menu") {
    return value;
  }

  return "generated_menu";
}

function getTypeLabel(type: SavedMenuType, t: (typeof texts)[Lang]) {
  if (type === "cooking_plan") return t.typeCooking;
  if (type === "parrillada_plan") return t.typeParrillada;
  return t.typeMenu;
}

function getBlocks(data: Json): Blocks {
  if (!isRecord(data)) return {};

  const blocks = data.blocks;
  if (isRecord(blocks)) {
    return toStringRecord(blocks);
  }

  return toStringRecord(data);
}

function getInputValue(data: Json, keys: string[]) {
  if (!isRecord(data)) return "";

  const inputs = isRecord(data.inputs) ? data.inputs : data;

  for (const key of keys) {
    const value = inputs[key] ?? data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return value.toString();
  }

  return "";
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

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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
