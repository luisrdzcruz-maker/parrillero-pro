"use client";

export default function ResultHeader({ title }: { title: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
        Revisa el plan y empieza a cocinar.
      </p>
    </div>
  );
}
