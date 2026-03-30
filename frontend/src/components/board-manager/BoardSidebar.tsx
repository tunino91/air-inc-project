"use client";

interface BoardSidebarProps {
  totalBoards: number;
  onCreateRoot: () => void;
  onOpenSeedWizard: () => void;
}

export default function BoardSidebar({
  totalBoards,
  onCreateRoot,
  onOpenSeedWizard,
}: BoardSidebarProps) {
  return (
    <section className="rounded-[32px] border border-white/60 bg-slate-950 px-6 py-7 text-white shadow-2xl shadow-slate-950/20">
      <h1 className="mt-4 text-4xl font-semibold leading-tight">Board hierarchy manager</h1>
      <p className="mt-4 text-sm leading-6 text-slate-300">
        Create, move, seed, and delete nested boards with a hard depth cap of ten
        levels and live sync across browser tabs.
      </p>

      <div className="mt-8 grid gap-3">
        <button
          type="button"
          onClick={onCreateRoot}
          className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
        >
          Create board
        </button>
        <button
          type="button"
          onClick={onOpenSeedWizard}
          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40"
        >
          Generate starter hierarchy
        </button>
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
          <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Total boards</dt>
          <dd className="mt-2 text-3xl font-semibold">{totalBoards}</dd>
        </div>
      </dl>
    </section>
  );
}
