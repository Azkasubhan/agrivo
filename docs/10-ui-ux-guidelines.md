# 10 — UI/UX Guidelines

## 1. Prinsip Umum

- Bahasa antarmuka: **Bahasa Indonesia**, sederhana, hindari jargon teknis (gunakan istilah "hemat air", "risiko cuaca", bukan "water balance index" mentah — lihat §5 untuk pemetaan istilah).
- Setiap halaman **wajib** menangani 4 state: **loading/skeleton**, **empty**, **error**, **success** (§4).
- Mobile-first — mayoritas petani mengakses lewat smartphone.

## 2. Halaman Inti

### 2.1 Login / Register

- Login dengan `phone_number` + password (bukan email, konsisten dengan [06-api-specification.md § 2](./06-api-specification.md#2-auth)).
- Link "Lupa password?" memicu alur OTP WhatsApp — jelaskan di UI bahwa kode dikirim ke WhatsApp, bukan SMS/email.

### 2.2 Dashboard

- Ringkasan: jumlah lahan aktif, rekomendasi terbaru per lahan, notifikasi belum dibaca.
- CTA utama: "Tambah Lahan Baru" dan "Minta Rekomendasi".

### 2.3 Manajemen Lahan (List / Create / Detail)

- **List:** kartu per lahan (nama, luas, jenis tanah, status rekomendasi terakhir).
- **Create:** form bertahap — data dasar → pilih lokasi di peta (Leaflet) → jenis tanah & varietas → (opsional) sistem irigasi. Field `irrigation_system_type` diberi _helper text_ yang menjelaskan kenapa penting diisi (lihat [04-input-specification.md § 1.7](./04-input-specification.md#17-jenis-sumber-air--sistem-irigasi-irrigation_system_type--opsional-tapi-sangat-disarankan)), tanpa memaksanya wajib.
- **Detail:** info lahan + tombol "Minta Rekomendasi Baru" + riwayat rekomendasi ringkas.

### 2.4 Form Permintaan Rekomendasi

- Karena sebagian besar input sudah tersimpan di data lahan, halaman ini terutama menampilkan **konfirmasi data** (jenis tanah, fase tanam saat ini, tanggal tanam) sebelum submit — mencegah user bingung data apa yang dipakai.
- Tampilkan indikator "Mengambil data cuaca terkini..." selama fetch Open-Meteo berlangsung.

### 2.5 Halaman Hasil Rekomendasi

Struktur wajib, mengikuti response API (§06-api-specification §5.1):

1. **Strategi terpilih** — nama strategi + badge confidence (misal "Keyakinan: Tinggi/Sedang/Rendah" dari `confidence_score`, bukan angka desimal mentah ke user awam).
2. **Prediksi dampak** — 3 kartu: Hemat Air (%), Estimasi Hasil Panen (ton/ha + baseline pembanding, dengan catatan "estimasi" — lihat [07-ai-engine.md § 7.3](./07-ai-engine.md#73-asumsi--keterbatasan-wajib-ditampilkan-ke-user)), Dampak Lingkungan (net GWP %, **bukan** hanya metana).
3. **Penjelasan** — expandable section: "Kenapa strategi ini?" (`why` + `ml_reasoning` disederhanakan), "Strategi lain yang dipertimbangkan tapi tidak dipilih" (`rule_constraints_applied`, bahasa awam), "Cara menerapkan" (`how_to_implement`).
4. **Catatan koordinasi** — tampil **hanya** jika `governance_note` ada, dengan ikon peringatan berbeda warna (bukan error, tapi info penting).
5. Jika `is_estimated: true` pada data cuaca yang dipakai, tampilkan badge "Data cuaca estimasi" dengan tooltip penjelasan.

### 2.6 Modul Edukasi

- List konten (`GET /education`), filter per strategi. Konten ditulis naratif, menyertakan kapan strategi tsb cocok/tidak cocok (selaras dengan rule engine §07-ai-engine).

### 2.7 Riwayat Rekomendasi

- List per lahan, terurut terbaru, klik untuk detail lengkap (reuse komponen §2.5).

### 2.8 Notifikasi

- List notifikasi WhatsApp yang pernah dikirim (mirror), tombol "tandai dibaca".

### 2.9 Pengaturan

- Profil, preferensi notifikasi (toggle per jenis alert sesuai `notification_preferences`).

## 3. State Wajib per Halaman

| State       | Perilaku                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Loading** | Skeleton yang meniru bentuk konten akhir (bukan spinner generik untuk halaman berisi list/kartu)                          |
| **Empty**   | Ilustrasi/pesan ramah + CTA jelas (misal "Belum ada lahan. Tambah lahan pertama Anda.")                                   |
| **Error**   | Pesan singkat berbahasa Indonesia dari `error.message` response API + tombol "Coba Lagi"; tidak menampilkan detail teknis |
| **Success** | Konten utama halaman, dengan feedback visual (toast) untuk aksi yang berhasil (create/update/delete)                      |

## 4. Aksesibilitas & Responsive

- Kontras warna minimal WCAG AA.
- Semua form field punya `<label>` terasosiasi (bukan hanya placeholder).
- Peta Leaflet punya alternatif input manual koordinat (untuk keyboard-only/screen reader).
- Breakpoint: mobile (`< 640px`) sebagai desain utama, tablet/desktop sebagai progressive enhancement (shadcn/ui + Tailwind default breakpoints).
- Ukuran tap target minimum 44×44px untuk elemen interaktif di mobile.

## 5. Pemetaan Istilah Teknis → Bahasa Awam

| Istilah internal            | Ditampilkan ke user sebagai                                           |
| --------------------------- | --------------------------------------------------------------------- |
| `confidence_score`          | Badge "Keyakinan: Tinggi (>0.75) / Sedang (0.5–0.75) / Rendah (<0.5)" |
| `water_balance_index`       | "Kondisi kelembapan tanah saat ini"                                   |
| `weather_risk_index`        | "Risiko cuaca 14 hari ke depan"                                       |
| `net_gwp_reduction_percent` | "Penurunan dampak pemanasan global (bersih)"                          |
| `rule_constraints_applied`  | "Strategi lain yang tidak cocok untuk kondisi ini"                    |
| `ml_reasoning.top_features` | "Faktor paling berpengaruh dalam rekomendasi ini"                     |

## 6. Kesalahan Umum yang Harus Dihindari

- Jangan menampilkan `confidence_score` sebagai angka desimal mentah (`0.82`) tanpa label kualitatif — membingungkan user non-teknis.
- Jangan menyembunyikan `governance_note` di balik banyak klik — ini informasi keamanan sosial penting, tampilkan cukup menonjol.
- Jangan membuat form lahan dalam satu halaman panjang tanpa pembagian tahap — meningkatkan drop-off pengisian.
