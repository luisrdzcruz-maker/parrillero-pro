export default function LoadingSavedMenus() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-5 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
          <div className="h-4 w-28 animate-pulse rounded-full bg-orange-400/30" />
          <div className="mt-5 h-12 w-full max-w-lg animate-pulse rounded-2xl bg-white/10" />
          <div className="mt-4 h-5 w-full max-w-2xl animate-pulse rounded-full bg-white/10" />
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/[0.04]"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
