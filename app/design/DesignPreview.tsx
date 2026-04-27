import type { CSSProperties } from "react";
import type { DesignVariant } from "./designVariants";

type PreviewStyle = CSSProperties & {
  "--preview-bg": string;
  "--preview-panel": string;
  "--preview-panel-strong": string;
  "--preview-text": string;
  "--preview-muted": string;
  "--preview-accent": string;
  "--preview-accent-soft": string;
  "--preview-border": string;
  "--preview-glow": string;
};

function getPreviewStyle(variant: DesignVariant): PreviewStyle {
  return {
    "--preview-bg": variant.colors.bg,
    "--preview-panel": variant.colors.panel,
    "--preview-panel-strong": variant.colors.panelStrong,
    "--preview-text": variant.colors.text,
    "--preview-muted": variant.colors.muted,
    "--preview-accent": variant.colors.accent,
    "--preview-accent-soft": variant.colors.accentSoft,
    "--preview-border": variant.colors.border,
    "--preview-glow": variant.colors.glow,
  };
}

function InternalLabel() {
  return (
    <div className="inline-flex rounded-full border border-[var(--preview-border)] bg-[var(--preview-accent-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--preview-accent)]">
      Internal Design Preview
    </div>
  );
}

function Hero({ variant }: { variant: DesignVariant }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[var(--preview-border)] bg-[var(--preview-panel)] shadow-[0_24px_80px_var(--preview-glow)]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: `url(${variant.image})` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,var(--preview-glow),transparent_34%),linear-gradient(to_top,var(--preview-bg)_0%,rgba(2,6,23,0.66)_48%,rgba(255,255,255,0.08)_100%)]" />

      <div className="relative p-5 pt-28">
        <InternalLabel />
        <h1 className="mt-5 text-4xl font-black tracking-tight text-[var(--preview-text)]">
          Parrillero Pro
        </h1>
        <p className="mt-2 text-sm font-semibold text-[var(--preview-muted)]">
          Planifica el fuego perfecto para un tomahawk premium.
        </p>
        <div className="mt-5 flex gap-2">
          <span className="rounded-full bg-[var(--preview-accent)] px-4 py-2 text-xs font-black text-[var(--preview-bg)]">
            Crear plan
          </span>
          <span className="rounded-full border border-[var(--preview-border)] bg-black/20 px-4 py-2 text-xs font-bold text-[var(--preview-text)]">
            Ver guardados
          </span>
        </div>
      </div>
    </section>
  );
}

function ModeCards() {
  const cards = [
    ["Cocción", "Corte, punto y tiempo"],
    ["Parrillada", "Timeline para grupos"],
    ["Cocina live", "Pasos y temporizador"],
  ];

  return (
    <section className="grid gap-3">
      {cards.map(([title, description], index) => (
        <div
          key={title}
          className="rounded-[1.5rem] border border-[var(--preview-border)] bg-[var(--preview-panel)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--preview-accent)]">
                Modo {index + 1}
              </p>
              <h2 className="mt-1 text-lg font-black text-[var(--preview-text)]">{title}</h2>
              <p className="mt-1 text-sm text-[var(--preview-muted)]">{description}</p>
            </div>
            <span className="h-10 w-10 rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-accent-soft)]" />
          </div>
        </div>
      ))}
    </section>
  );
}

function CookingWizardPreview() {
  return (
    <section className="rounded-[2rem] border border-[var(--preview-border)] bg-[var(--preview-panel)] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--preview-accent)]">
            Wizard
          </p>
          <h2 className="mt-1 text-xl font-black text-[var(--preview-text)]">Tomahawk al punto</h2>
        </div>
        <span className="rounded-full bg-[var(--preview-accent)] px-3 py-1 text-xs font-black text-[var(--preview-bg)]">
          Paso 3
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {["Animal", "Corte", "Plan"].map((step, index) => (
          <div
            key={step}
            className={
              index === 2
                ? "rounded-2xl bg-[var(--preview-accent)] px-3 py-2 text-center text-xs font-black text-[var(--preview-bg)]"
                : "rounded-2xl border border-[var(--preview-border)] bg-black/20 px-3 py-2 text-center text-xs font-bold text-[var(--preview-muted)]"
            }
          >
            {step}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[1.5rem] border border-[var(--preview-border)] bg-[var(--preview-panel-strong)] p-4">
        <p className="text-sm text-[var(--preview-muted)]">Grosor: 6 cm · Punto: medium rare</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
          <div className="h-full w-2/3 rounded-full bg-[var(--preview-accent)]" />
        </div>
      </div>
    </section>
  );
}

function ResultCardPreview({ variant }: { variant: DesignVariant }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-[var(--preview-border)] bg-[var(--preview-panel)]">
      <div className="relative h-36">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${variant.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--preview-bg)] via-black/35 to-white/10" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--preview-accent)]">
            Resultado
          </p>
          <h2 className="mt-1 text-2xl font-black text-[var(--preview-text)]">
            Sellado + indirecto
          </h2>
        </div>
      </div>

      <div className="grid gap-3 p-4">
        <div className="rounded-2xl bg-[var(--preview-accent-soft)] p-3">
          <p className="text-sm font-bold text-[var(--preview-text)]">
            Salir a 52°C, reposar 10 min.
          </p>
        </div>
        <p className="text-sm leading-6 text-[var(--preview-muted)]">
          Precalienta, sella fuerte por ambos lados y termina en zona indirecta hasta el objetivo.
        </p>
      </div>
    </section>
  );
}

function BottomNavPreview() {
  return (
    <nav className="grid grid-cols-4 gap-2 rounded-[1.75rem] border border-[var(--preview-border)] bg-[var(--preview-panel-strong)] p-2">
      {["Inicio", "Cocción", "Live", "Guardados"].map((item, index) => (
        <div
          key={item}
          className={
            index === 1
              ? "rounded-2xl bg-[var(--preview-accent)] px-2 py-3 text-center text-xs font-black text-[var(--preview-bg)]"
              : "rounded-2xl px-2 py-3 text-center text-xs font-bold text-[var(--preview-muted)]"
          }
        >
          {item}
        </div>
      ))}
    </nav>
  );
}

export default function DesignPreview({ variant }: { variant: DesignVariant }) {
  return (
    <main
      className="min-h-screen bg-[var(--preview-bg)] px-4 py-8 text-[var(--preview-text)]"
      style={getPreviewStyle(variant)}
    >
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[360px_1fr] lg:items-start">
        <aside className="lg:sticky lg:top-8">
          <InternalLabel />
          <h1 className="mt-5 text-4xl font-black tracking-tight">{variant.name}</h1>
          <p className="mt-3 text-lg font-semibold text-[var(--preview-muted)]">
            {variant.tagline}
          </p>
          <p className="mt-6 rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-panel)] p-4 text-sm leading-6 text-[var(--preview-muted)]">
            Internal route only. This preview is for founder/design testing and is not exposed as a
            production theme selector.
          </p>
        </aside>

        <section className="mx-auto w-full max-w-[430px] rounded-[2.5rem] border border-[var(--preview-border)] bg-black/25 p-3 shadow-[0_30px_100px_var(--preview-glow)]">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[var(--preview-bg)]">
            <div className="space-y-4 p-4 pb-5">
              <Hero variant={variant} />
              <ModeCards />
              <CookingWizardPreview />
              <ResultCardPreview variant={variant} />
              <BottomNavPreview />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
