export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-4xl animate-pulse rounded-[2rem] border border-border bg-white/80 p-10">
        <div className="h-6 w-40 rounded-full bg-secondary" />
        <div className="mt-8 h-16 w-64 rounded-xl bg-muted" />
        <div className="mt-4 h-6 w-full max-w-2xl rounded-xl bg-muted" />
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="h-28 rounded-2xl bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
        </div>
      </div>
    </main>
  );
}
