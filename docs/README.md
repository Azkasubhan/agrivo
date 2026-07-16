# AGRIVO — Dokumentasi Sistem

> **Status:** Source of truth aktif — mengikat untuk Fase 2 (implementasi).
> **Versi dokumen:** 1.0.0
> **Terakhir diperbarui:** 16 Juli 2026

Dokumentasi ini adalah **satu-satunya sumber kebenaran (single source of truth)** untuk sistem AGRIVO. Setiap keputusan desain — arsitektur, skema database, kontrak API, logika AI, aturan keamanan — harus tercermin di sini. Jika selama implementasi (Fase 2) ditemukan kebutuhan yang tidak eksplisit tercakup di dokumen ini, **update dokumen terkait terlebih dahulu** sebelum menulis kode. Jangan menyimpang diam-diam dari dokumentasi.

## Cara Membaca Dokumentasi Ini

Dokumen disusun dari yang paling konseptual ke yang paling teknis/operasional. Disarankan membaca berurutan jika Anda baru pertama kali bergabung ke proyek ini:

| #   | Dokumen                                                          | Untuk siapa                            | Ringkasan isi                                                                 |
| --- | ---------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| 01  | [Project Overview & Problem Statement](./01-project-overview.md) | Semua anggota tim, terutama non-teknis | Masalah, target user, value proposition, batasan produk, posisi vs tools lain |
| 02  | [System Architecture](./02-system-architecture.md)               | Semua engineer                         | Diagram arsitektur, alur data end-to-end, keputusan & tradeoff                |
| 03  | [Tech Stack](./03-tech-stack.md)                                 | Semua engineer                         | Teknologi yang dipakai dan alasan pemilihannya                                |
| 04  | [Input Specification](./04-input-specification.md)               | Backend & AI engineer                  | Jantung sistem — semua input manual/auto-fetch/derived, formula, validasi     |
| 05  | [Database Design](./05-database-design.md)                       | Backend engineer                       | ERD, skema tabel, index, constraint, strategi migrasi                         |
| 06  | [API Specification](./06-api-specification.md)                   | Backend & frontend engineer            | Kontrak REST API lengkap per endpoint                                         |
| 07  | [AI Engine](./07-ai-engine.md)                                   | AI/backend engineer                    | Pipeline rule-engine + ML, decision matrix 20+ skenario, explainability       |
| 08  | [Security & Validation](./08-security-validation.md)             | Semua engineer                         | OWASP mapping, auth, rate limiting, tabel validasi lengkap                    |
| 09  | [Coding Standards & Folder Structure](./09-coding-standards.md)  | Semua engineer                         | Struktur folder, naming, commit convention, error handling, logging           |
| 10  | [UI/UX Guidelines](./10-ui-ux-guidelines.md)                     | Frontend & designer                    | Halaman inti, state wajib, aksesibilitas                                      |

## Prinsip Produk yang Mengikat (Non-Negotiable)

Prinsip berikut berlaku lintas dokumen dan **tidak boleh dilanggar** oleh implementasi apa pun:

1. **Decision Support System, bukan sistem otomasi.** Tidak ada kontrol hardware/aktuator. Rekomendasi, bukan eksekusi otomatis.
2. **Method-agnostic.** Sistem tidak boleh hardcode bias ke satu strategi (misal selalu AWD). Lihat [07-ai-engine.md § Decision Matrix](./07-ai-engine.md#8-decision-matrix-20-skenario-representatif) untuk bukti variasi output.
3. **AI harus benar-benar berpengaruh terhadap output**, bukan dropdown kosmetik. Lihat [07-ai-engine.md § Pipeline](./07-ai-engine.md#3-pipeline-ai-engine).
4. **Output lingkungan jujur** — selalu net GWP (CH4 + N2O), bukan hanya penurunan metana.
5. **Mengakui konteks irigasi komunal** — governance note wajib ada di explanation bila relevan.
6. **Clean Architecture ketat** — router hanya memanggil service, business logic hanya di service, akses DB hanya lewat repository, AI Engine adalah modul terpisah dengan interface input/output terstruktur.

## Riwayat Perubahan Dokumen

| Tanggal    | Perubahan                                       |
| ---------- | ----------------------------------------------- |
| 2026-07-16 | Draft awal seluruh dokumentasi Fase 1 (v1.0.0). |

## Status Implementasi (diperbarui di Fase 2)

Bagian ini akan diperbarui saat Fase 2 berjalan untuk melacak divergensi/keputusan implementasi yang memaksa update dokumentasi.

- [ ] Backend skeleton
- [ ] Database migration awal
- [ ] AI Engine (rule + ML)
- [ ] Frontend skeleton
- [ ] Integrasi Open-Meteo
- [ ] Integrasi Fonnte
