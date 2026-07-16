# 04 — Input Specification

> Ini adalah **jantung sistem AGRIVO**. Semua kualitas rekomendasi bergantung pada seberapa benar bagian ini diimplementasikan. Baca bersama [07-ai-engine.md](./07-ai-engine.md) karena fitur-fitur di sini langsung dipakai sebagai input pipeline AI.

Input sistem dibagi tiga kategori: **manual** (diisi user), **auto-fetch** (dari Open-Meteo), dan **derived** (dihitung sistem dari kombinasi keduanya).

---

## 1. Input Manual (Diisi User)

### 1.1 Lokasi Lahan (`location`)

| Field       | Tipe           | Wajib | Validasi                       | Alasan Bisnis                                                                                                                                                                                                                  |
| ----------- | -------------- | ----- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `latitude`  | `NUMERIC(9,6)` | Ya    | `-11.00 <= latitude <= 6.10`   | Rentang lintang wilayah Indonesia (dari Rote di selatan hingga Sabang/Miangas di utara). Menolak koordinat di luar Indonesia karena data cuaca regional fallback dan asumsi iklim tropis lembab hanya valid untuk wilayah ini. |
| `longitude` | `NUMERIC(9,6)` | Ya    | `94.70 <= longitude <= 141.10` | Rentang bujur wilayah Indonesia.                                                                                                                                                                                               |

**Kesalahan umum:** jangan hanya validasi "any float" — koordinat di luar Indonesia yang lolos akan membuat Open-Meteo mengembalikan data cuaca valid secara teknis tapi tidak relevan secara agronomis (asumsi varietas & fase tanam di dokumen ini berbasis kalender tanam Indonesia).

### 1.2 Jenis Tanah (`soil_type`) — Enum, Fitur Berbobot Tinggi

| Nilai enum | Deskripsi                     | Karakteristik hidrologi                                                                        |
| ---------- | ----------------------------- | ---------------------------------------------------------------------------------------------- |
| `SANDY`    | Tanah berpasir                | Perkolasi/infiltrasi cepat, retensi air rendah, muka air turun cepat                           |
| `LOAM`     | Tanah lempung berpasir (loam) | Retensi air sedang, drainase seimbang                                                          |
| `CLAY`     | Tanah liat                    | Perkolasi sangat lambat, retensi air tinggi, muka air dangkal bertahan lama                    |
| `SILTY`    | Tanah lanau (silty)           | Retensi air tinggi, drainase lambat, mirip clay tapi struktur lebih halus dan rentan pemadatan |

**Validasi:** wajib salah satu dari 4 nilai di atas (tidak boleh kosong/null). **Alasan bisnis:** jenis tanah adalah fitur paling menentukan validitas AWD (lihat [07-ai-engine.md](./07-ai-engine.md)) — tanpa nilai ini, rule engine tidak bisa memfilter kandidat strategi secara ilmiah sama sekali, sehingga field ini **tidak boleh opsional**.

### 1.3 Varietas Padi (`rice_variety`) — Enum, Dapat Diperluas

| Nilai enum              | Total durasi (hari) | Kategori           |
| ----------------------- | ------------------- | ------------------ |
| `CIHERANG`              | 116                 | Umur sedang        |
| `IR64`                  | 115                 | Umur sedang        |
| `INPARI_32`             | 112                 | Umur genjah-sedang |
| `INPARI_42_AGRITAN_GSR` | 103                 | Umur genjah        |
| `MEKONGGA`              | 120                 | Umur sedang-dalam  |

Tabel durasi fase per varietas (persentase dari total durasi, dipakai untuk menghitung `growth_stage`, lihat §3.1):

| Fase                                       | % durasi total | Sensitivitas air                                                                            |
| ------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------- |
| Land Preparation & Nursery                 | 0–9%           | Butuh genangan awal untuk olah tanah/pelumpuran                                             |
| Vegetative (tanam – akhir anakan aktif)    | 9–45%          | Toleran kekeringan sedang, fase paling ideal untuk AWD                                      |
| Reproductive (inisiasi malai – pembungaan) | 45–65%         | **Sangat sensitif air** — defisit air pada fase ini menurunkan hasil signifikan             |
| Ripening/Maturation (pembungaan – panen)   | 65–100%        | Toleran kekeringan, pengeringan lahan dianjurkan menjelang panen (10–14 hari sebelum panen) |

**Validasi:** enum tertutup untuk MVP, tapi skema database (§05) didesain agar varietas baru bisa ditambah lewat migrasi tanpa mengubah struktur tabel (lihat `rice_varieties` sebagai tabel referensi, bukan hardcoded enum DB — lihat [05-database-design.md](./05-database-design.md)). **Alasan bisnis:** durasi fase menentukan `growth_stage` yang dipakai rule engine untuk melarang AWD saat reproductive — kesalahan di sini berisiko merekomendasikan pengeringan pada fase paling rentan.

### 1.4 Tanggal Tanam (`planting_date`)

| Validasi                                  | Nilai                                                                                                           | Alasan Bisnis                                                                                                                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tidak boleh di masa depan                 | `planting_date <= today`                                                                                        | Fase pertumbuhan dihitung dari selisih hari ini dengan tanggal tanam — tanggal masa depan membuat `growth_stage` tidak terdefinisi                                           |
| Tidak boleh lebih tua dari batas maksimum | `today - planting_date <= MAX_PLANTING_AGE_DAYS` (default **150 hari**, dikonfigurasi via environment variable) | Melewati total durasi varietas terpanjang (Mekongga, 120 hari) + buffer 30 hari mencegah input data lahan yang sudah pasti dipanen/tidak relevan lagi direkomendasikan ulang |

### 1.5 Luas Lahan (`field_area_ha`)

| Validasi             | Nilai                                                                                     | Alasan Bisnis                                                                                                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Harus angka positif  | `field_area_ha > 0`                                                                       | Luas nol/negatif tidak bermakna fisik                                                                                                                                                                                                           |
| Batas maksimum wajar | `field_area_ha <= 25` hektar (dikonfigurasi via environment variable `MAX_FIELD_AREA_HA`) | Rata-rata kepemilikan lahan petani padi Indonesia jauh di bawah ini (~0.3–1 ha per rumah tangga tani); batas 25 ha mencegah input keliru (misal salah ketik satuan m² sebagai ha) tanpa membatasi kasus kelompok tani/lahan gabungan yang wajar |

### 1.6 Riwayat Metode Irigasi Sebelumnya (`previous_irrigation_method`) — Opsional

Enum sama dengan `recommended_strategy` (lihat [07-ai-engine.md § 1](./07-ai-engine.md#1-enumerasi-strategi-irigasi)). **Alasan opsional:** banyak petani tidak mencatat metode secara formal — mewajibkan field ini akan menaikkan friksi onboarding. **Kegunaan:** jika diisi, dipakai sebagai baseline pembanding "water saving %" yang lebih personal (bukan hanya dibanding Continuous Flooding default) — lihat [07-ai-engine.md § 6](./07-ai-engine.md#6-baseline-pembanding-water-saving).

### 1.7 Jenis Sumber Air / Sistem Irigasi (`irrigation_system_type`) — Opsional tapi Sangat Disarankan

| Nilai enum         | Deskripsi                                                                               |
| ------------------ | --------------------------------------------------------------------------------------- |
| `TECHNICAL`        | Irigasi teknis — saluran permanen, kontrol individual per petak dimungkinkan            |
| `SEMI_TECHNICAL`   | Irigasi semi-teknis — sebagian saluran permanen, kontrol individual terbatas            |
| `RAINFED`          | Tadah hujan — bergantung sepenuhnya pada curah hujan, tidak ada sumber irigasi buatan   |
| `COMMUNAL_GRAVITY` | Irigasi gravitasi bersama — air dibagi terjadwal antar petani dalam satu blok/komunitas |

**Alasan opsional tapi sangat disarankan:** field ini tidak bisa divalidasi kebenarannya oleh sistem (bergantung pengetahuan user), sehingga tidak boleh wajib mem-block submission. Namun, tanpa field ini, sistem tidak bisa menyusun _governance disclaimer_ (§ Prinsip Produk #5) — UI wajib mendorong pengisian field ini lewat _helper text_, bukan validasi keras.

---

## 2. Input Auto-Fetch (dari Open-Meteo)

### 2.1 Variabel yang Diambil

| Variabel                                | Endpoint Open-Meteo                                                              | Digunakan untuk                      |
| --------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| Curah hujan historis (30 hari terakhir) | `archive-api.open-meteo.com/v1/archive` → `daily.precipitation_sum`              | Water balance                        |
| Curah hujan forecast (14 hari ke depan) | `api.open-meteo.com/v1/forecast` → `daily.precipitation_sum`                     | Risk index cuaca                     |
| Temperatur (min/max/rata-rata)          | `daily.temperature_2m_max/min/mean`                                              | ETc, risk index                      |
| Kelembapan relatif                      | `hourly.relative_humidity_2m` (diagregasi harian)                                | ETc (formula Hargreaves fallback)    |
| Kecepatan angin                         | `daily.wind_speed_10m_max`                                                       | ETc                                  |
| Radiasi matahari                        | `daily.shortwave_radiation_sum`                                                  | ETc                                  |
| Evapotranspirasi referensi (ET0)        | `daily.et0_fao_evapotranspiration` (jika tersedia untuk endpoint yang dipanggil) | Water balance langsung jika tersedia |

### 2.2 Formula Evapotranspirasi (Fallback)

Open-Meteo menyediakan `et0_fao_evapotranspiration` langsung pada endpoint forecast standar. **Jika variabel ini tidak tersedia** (misal endpoint archive tertentu tidak mengembalikannya, atau field kosong pada respons), sistem **wajib menghitung manual** menggunakan **formula Hargreaves** (dipilih karena hanya butuh temperatur + radiasi, cocok sebagai fallback minimal-dependency):

$$ET_0 = 0.0023 \times R_a \times (T_{mean} + 17.8) \times \sqrt{T_{max} - T_{min}}$$

Dengan:

- $ET_0$ = evapotranspirasi referensi (mm/hari)
- $R_a$ = radiasi ekstraterestrial (mm/hari ekuivalen; didekati dari `shortwave_radiation_sum` Open-Meteo dikonversi dari MJ/m²/hari ke mm/hari dengan faktor `0.408`, sesuai FAO-56)
- $T_{mean}, T_{max}, T_{min}$ = temperatur rata-rata/maksimum/minimum harian (°C)

Kemudian **evapotranspirasi tanaman aktual (ETc)** dihitung dengan koefisien tanaman padi per fase pertumbuhan (Kc, dari FAO-56 untuk padi sawah):

| Fase                       | Kc   |
| -------------------------- | ---- |
| Land Preparation & Nursery | 1.10 |
| Vegetative                 | 1.05 |
| Reproductive               | 1.20 |
| Ripening/Maturation        | 0.90 |

$$ETc = ET_0 \times K_c(\text{growth\_stage})$$

### 2.3 Fallback Jika Open-Meteo Gagal/Timeout

**Wajib:** jika request ke Open-Meteo gagal (timeout, HTTP 5xx, response malformed) setelah retry sekali dengan backoff singkat (total budget waktu **8 detik**), service **wajib** menggunakan **data rata-rata historis regional** yang disimpan sebagai seed data statis di database (tabel referensi `regional_climate_baseline`, per provinsi, diisi dari rata-rata jangka panjang BMKG/literatur agroklimat).

Response yang menggunakan fallback ini **wajib** menyertakan flag eksplisit:

```json
{
  "is_estimated": true,
  "estimation_reason": "open_meteo_unavailable",
  "source": "regional_climate_baseline"
}
```

Flag ini **wajib ditampilkan ke user di UI** (lihat [10-ui-ux-guidelines.md](./10-ui-ux-guidelines.md)) — sistem tidak boleh diam-diam menyajikan data estimasi seolah-olah data real-time, karena ini melanggar prinsip transparansi produk.

---

## 3. Input Derived (Dihitung Sistem)

### 3.1 Fase Pertumbuhan Saat Ini (`growth_stage`)

$$\text{days\_after\_planting (DAP)} = \text{today} - \text{planting\_date}$$

$$\text{growth\_stage} = f(\text{DAP} / \text{total\_duration}(\text{rice\_variety}))$$

Menggunakan tabel persentase fase di §1.3. Contoh: Ciherang (116 hari) pada DAP=60 → 60/116 = 51.7% → jatuh di rentang 45–65% → `REPRODUCTIVE`.

### 3.2 Water Balance / Indeks Kekeringan Tanah (`water_balance_index`)

Model _water balance_ sederhana berbasis selisih kumulatif 10 hari terakhir:

$$WB = \sum_{i=1}^{10} \left( P_i \times R_{soil} - ETc_i \right)$$

Dengan:

- $P_i$ = curah hujan hari ke-$i$ (mm)
- $ETc_i$ = evapotranspirasi tanaman hari ke-$i$ (mm), dari §2.2
- $R_{soil}$ = koefisien retensi air tanah (proxy sederhana untuk infiltrasi/perkolasi):

| `soil_type` | $R_{soil}$ | Alasan                                                          |
| ----------- | ---------- | --------------------------------------------------------------- |
| `SANDY`     | 0.60       | Perkolasi cepat, sebagian besar air hujan hilang dari zona akar |
| `LOAM`      | 0.80       | Retensi sedang                                                  |
| `CLAY`      | 0.95       | Retensi tinggi, air hujan hampir seluruhnya tertahan            |
| `SILTY`     | 0.90       | Retensi tinggi, mendekati clay                                  |

$WB > 0$ mengindikasikan surplus air (tanah cenderung basah/tergenang alami); $WB < 0$ mengindikasikan defisit (tanah cenderung kering). Nilai ini dikategorikan menjadi `water_balance_index` ordinal (`SURPLUS`, `NORMAL`, `DEFICIT`) dengan ambang $\pm 15$ mm dari nol, dipakai langsung oleh rule engine (lihat [07-ai-engine.md](./07-ai-engine.md)).

### 3.3 Risk Index Cuaca 7–14 Hari ke Depan (`weather_risk_index`)

Dihitung dari forecast Open-Meteo:

- **Drought risk:** total curah hujan forecast 14 hari < 30% dari rata-rata historis regional periode yang sama → `DROUGHT_HIGH`; 30–70% → `DROUGHT_MODERATE`; > 70% → `NORMAL`.
- **Excess water risk:** total curah hujan forecast 7 hari > 150% dari rata-rata historis regional → `EXCESS_HIGH`.

`weather_risk_index` bersifat kategorikal gabungan (`DROUGHT_HIGH`, `DROUGHT_MODERATE`, `NORMAL`, `EXCESS_HIGH`) dan menjadi salah satu fitur utama rule engine & ML model.

---

## 4. Ringkasan Tabel Validasi (Rujukan Cepat)

Tabel validasi lengkap lintas semua input (termasuk pesan error standar) didokumentasikan di [08-security-validation.md § 3](./08-security-validation.md#3-tabel-validasi-input-lengkap) untuk menghindari duplikasi aturan yang bisa saling tidak sinkron antar dokumen.

## 5. Kesalahan Umum yang Harus Dihindari

- Jangan menghitung `growth_stage` hanya dari tanggal tanam tanpa varietas — total durasi berbeda signifikan antar varietas (103–120 hari), kesalahan ini bisa menggeser fase reproductive secara keliru.
- Jangan mengabaikan flag `is_estimated` saat fallback cuaca aktif — AI Engine tetap harus jalan, tapi confidence score prediksinya harus diturunkan (lihat [07-ai-engine.md § 5](./07-ai-engine.md#5-confidence-scoring)).
- Jangan menyimpan `input_snapshot` rekomendasi sebagai referensi ke row `fields`/`weather_snapshots` yang bisa berubah — snapshot wajib disalin sebagai nilai statis (JSONB) pada saat rekomendasi dibuat, agar histori rekomendasi tetap akurat meski data lahan berubah di kemudian hari.
