export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(76,142,92,0.18),_transparent_48%),linear-gradient(180deg,_#fbf9ef_0%,_#f4f0db_100%)] px-6 py-16">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl items-center justify-center">
        <section className="w-full rounded-[2rem] border border-border/80 bg-white/80 p-10 shadow-[0_24px_80px_rgba(38,84,48,0.12)] backdrop-blur sm:p-14">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
              Milestone 1 · Infrastructure Ready
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                AGRIVO
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                AI-powered Climate Adaptive Irrigation Decision Support System
              </p>
            </div>
            <div className="grid gap-4 rounded-2xl border border-border bg-background/80 p-6 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Frontend</p>
                <p className="mt-2 text-base font-semibold text-foreground">Next.js App Router</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Backend</p>
                <p className="mt-2 text-base font-semibold text-foreground">FastAPI + Alembic</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="mt-2 text-base font-semibold text-foreground">Fondasi proyek aktif</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
