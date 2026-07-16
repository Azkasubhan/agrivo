"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="max-w-xl rounded-[2rem] border border-border bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Terjadi gangguan
        </p>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Halaman tidak dapat dimuat</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Coba muat ulang halaman. Jika masalah berlanjut, periksa konfigurasi frontend atau backend.
        </p>
        <button
          className="mt-8 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          onClick={reset}
          type="button"
        >
          Coba Lagi
        </button>
      </div>
    </main>
  );
}
