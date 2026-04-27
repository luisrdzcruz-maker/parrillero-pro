"use client";

export default function ResultHeader({ title }: { title: string }) {
  return (
    <div className="max-w-2xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
        BBQ Assistant
      </div>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
        Revisa, guarda o continúa el plan de cocina.
      </p>
    </div>
  );
}
