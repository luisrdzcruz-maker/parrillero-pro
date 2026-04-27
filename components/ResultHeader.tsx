"use client";

import { Badge } from "@/components/ui";

export default function ResultHeader({ title }: { title: string }) {
  return (
    <div className="max-w-2xl">
      <Badge className="gap-2 text-[11px] uppercase tracking-[0.18em]">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
        BBQ Assistant
      </Badge>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
        Revisa, guarda o continúa el plan de cocina.
      </p>
    </div>
  );
}
