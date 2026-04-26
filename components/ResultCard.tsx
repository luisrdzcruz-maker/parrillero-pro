"use client";

export default function ResultCard({
  title,
  content,
}: {
  title: string;
  content?: string;
}) {
  if (!content) return null;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <h3 className="mb-3 text-lg font-bold">{title}</h3>
      <p className="whitespace-pre-wrap text-slate-300">{content}</p>
    </div>
  );
}
