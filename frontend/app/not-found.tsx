import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="max-w-xl rounded-[2rem] border border-border bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">404</p>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Halaman tidak ditemukan</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Halaman yang Anda cari belum tersedia pada milestone infrastruktur ini.
        </p>
        <Link
          className="mt-8 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          href="/"
        >
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
