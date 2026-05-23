export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-zinc-950 text-zinc-50">
      <div className="max-w-2xl w-full space-y-8">
        <header className="space-y-2">
          <h1 className="text-5xl font-semibold tracking-tight">GhostWriter</h1>
          <p className="text-zinc-400 text-lg">
            Autonomous GEO agent — monitor, publish, measure, transact.
          </p>
        </header>

        <div className="rounded-lg border border-zinc-800 p-6 bg-zinc-900/50">
          <p className="text-sm text-zinc-500 mb-4">
            Phase 1 scaffold deployed. UI lands in Phase 3.
          </p>
          <button
            disabled
            className="px-4 py-2 rounded bg-zinc-50 text-zinc-950 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Deploy Agent
          </button>
        </div>

        <footer className="text-xs text-zinc-600 font-mono">
          <a href="/api/health" className="hover:text-zinc-400">/api/health</a>
        </footer>
      </div>
    </main>
  );
}
