# 03 — Tech Stack

## 1. Ringkasan Stack

| Layer      | Teknologi                                                          |
| ---------- | ------------------------------------------------------------------ |
| Frontend   | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Leaflet |
| Backend    | FastAPI, Python 3.11+, PostgreSQL                                  |
| AI         | Scikit-learn / XGBoost, Pandas, NumPy                              |
| Weather    | Open-Meteo API                                                     |
| Notifikasi | Fonnte (WhatsApp API Indonesia)                                    |
| Scheduler  | APScheduler (in-process)                                           |
| Migrasi DB | Alembic                                                            |
| Auth       | JWT (access + refresh token)                                       |

## 2. Frontend

### 2.1 Next.js + TypeScript

**Kenapa:** App Router mendukung server components untuk halaman yang berat data (dashboard, riwayat) sekaligus client components untuk interaktivitas form. TypeScript wajib untuk mengurangi bug integrasi dengan kontrak API yang kompleks (schema rekomendasi bercabang banyak — lihat [06-api-specification.md](./06-api-specification.md)).

### 2.2 Tailwind CSS + shadcn/ui

**Kenapa:** Tim hackathon kecil dan butuh kecepatan membangun UI konsisten. shadcn/ui memberi komponen accessible-by-default (dialog, form, toast) tanpa overhead desain sistem dari nol. Tailwind memudahkan konsistensi spacing/warna lintas halaman tanpa CSS terpisah per komponen.

### 2.3 Leaflet

**Kenapa:** Dibutuhkan untuk memilih/menampilkan koordinat lahan di peta (§ Manajemen Lahan). Leaflet dipilih dibanding Google Maps karena tidak butuh API key berbayar/kuota — konsisten dengan filosofi "cocok untuk hackathon" seperti pemilihan Open-Meteo. Basemap menggunakan tile OpenStreetMap gratis.

## 3. Backend

### 3.1 FastAPI + Python

**Kenapa:**

- Validasi request/response otomatis lewat Pydantic — krusial karena Input Specification (§04) punya banyak aturan validasi bertingkat (enum, rentang numerik, format tanggal).
- Async native — cocok untuk memanggil Open-Meteo dan Fonnte tanpa blocking.
- Ekosistem Python yang sama dipakai AI Engine (Scikit-learn/XGBoost/Pandas) — menghindari serialisasi lintas bahasa antara API dan model AI (lihat alasan arsitektur di [02-system-architecture.md § 2](./02-system-architecture.md#2-kenapa-ai-engine-menjadi-modul-internal-bukan-microservice-terpisah)).

### 3.2 PostgreSQL

**Kenapa:** Data AGRIVO sangat relasional (users → fields → recommendations → predictions, dengan banyak foreign key dan kebutuhan query historis terurut waktu). PostgreSQL mendukung tipe data yang relevan (`NUMERIC` untuk koordinat presisi tinggi, `JSONB` untuk menyimpan `input_snapshot` yang berstruktur fleksibel, `ENUM` native untuk `soil_type`/`strategy`, index parsial dan komposit untuk query history).

## 4. AI Stack

### 4.1 Scikit-learn / XGBoost + Pandas + NumPy

**Kenapa:** Ringan, matang, dan cukup untuk klasifikasi multi-kelas (memilih strategi irigasi di antara kandidat valid) serta regresi sederhana (prediksi water saving %, expected yield, net GWP). Tidak butuh deep learning — dataset sintetis berbasis literatur secara alami terbatas ukurannya, sehingga model kompleks berisiko overfitting tanpa manfaat nyata.

### 4.2 Strategi Data Terbatas: Hybrid Rule-Engine + ML

**Masalah:** Hackathon tidak punya data riil hasil eksperimen AWD/irigasi dari ribuan lahan. Melatih model ML murni dari nol tanpa data riil akan menghasilkan model yang secara efektif menghafal asumsi pembuatnya — berisiko terlihat meyakinkan padahal tidak benar-benar tervalidasi.

**Solusi (lihat detail penuh di [07-ai-engine.md](./07-ai-engine.md)):**

1. **Rule Engine** (Python murni, berbasis ambang ilmiah dari literatur AWD/irigasi yang didokumentasikan sumbernya) bertindak sebagai **scientific constraint & candidate filter** — deterministik, transparan, mudah diaudit developer non-ML.
2. **Model ML** (XGBoost classifier + regressor kecil) dilatih dari **dataset sintetis terstruktur** yang dihasilkan dari kombinasi parameter literatur + variasi acak terkendali (bukan sekadar duplikasi rule), lalu bertugas **memilih keputusan final** di antara kandidat yang sudah lolos filter rule engine, plus memprediksi angka kuantitatif (water saving %, expected yield, net GWP).
3. **Roadmap upgrade pasca-hackathon:** ganti/gabungkan dataset sintetis dengan data riil (hasil pilot lapangan, data dari dinas pertanian/BPS, atau kolaborasi riset IRRI), retrain model dengan pipeline yang sama tanpa mengubah interface AI Engine.

**Kenapa hybrid, bukan salah satu saja:**

- Rule-engine murni tanpa ML akan terlihat seperti "lookup table" kaku dan tidak bisa menangkap interaksi non-linear antar fitur (misal kombinasi water_balance dan risk_index yang saling mempengaruhi secara gradasi, bukan ambang tegas).
- ML murni tanpa rule-engine berisiko merekomendasikan strategi yang secara ilmiah tidak valid untuk suatu kondisi (misal AWD ketat saat fase reproduktif/flowering — yang secara riset terbukti merugikan hasil panen) hanya karena pola statistik data sintetis kebetulan mengarah ke sana.
- Kombinasi keduanya memberi **jaminan keamanan ilmiah (rule)** + **nuansa keputusan berbasis pola (ML)** — sekaligus menjawab kontradiksi brief soal "AI harus terasa dapat dipercaya, bukan lookup table berbungkus ML" (lihat resolusi lengkap di [07-ai-engine.md § 2](./07-ai-engine.md#2-resolusi-desain-rule-engine-vs-ml)).

## 5. Weather: Open-Meteo

**Kenapa:** Gratis, tanpa API key, mendukung data historis + forecast + variabel agrikultur (termasuk `et0_fao_evapotranspiration` di beberapa endpoint) — sangat cocok untuk kecepatan pengembangan hackathon tanpa proses approval API key yang memakan waktu. Detail endpoint dan fallback ada di [04-input-specification.md § 2](./04-input-specification.md#2-input-auto-fetch-dari-open-meteo).

## 6. Notifikasi: Fonnte

**Kenapa:** WhatsApp adalah kanal komunikasi digital paling umum dipakai petani Indonesia (dibanding email atau aplikasi khusus). Fonnte adalah provider WhatsApp API lokal Indonesia dengan proses onboarding cepat (cocok hackathon) dibanding WhatsApp Business API resmi yang butuh verifikasi bisnis panjang.

## 7. Kesalahan Umum yang Harus Dihindari

- Jangan menambahkan dependency deep learning (PyTorch/TensorFlow) — tidak sepadan dengan ukuran dataset sintetis dan menambah kompleksitas deployment tanpa manfaat akurasi yang terbukti.
- Jangan memanggil Open-Meteo tanpa timeout eksplisit — selalu set timeout pendek (misal 5 detik) dan siapkan fallback, karena API eksternal gratis tidak menjamin SLA.
- Jangan hardcode nomor WhatsApp/token Fonnte di kode — selalu lewat environment variable (lihat [08-security-validation.md](./08-security-validation.md)).
