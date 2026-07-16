# 01 — Project Overview & Problem Statement

## 1. Ringkasan Satu Paragraf

AGRIVO adalah **Decision Support System (DSS)** berbasis AI yang merekomendasikan strategi irigasi padi paling sesuai untuk kondisi spesifik suatu lahan (jenis tanah, cuaca, fase tanam, konteks sistem irigasi), lengkap dengan penjelasan yang transparan dan dapat dipercaya, serta notifikasi WhatsApp — untuk membantu petani mengurangi pemborosan air dan emisi metana tanpa mengorbankan hasil panen, tanpa mengasumsikan satu metode "ajaib" cocok untuk semua kondisi.

## 2. Masalah

### 2.1 Continuous Flooding sebagai Default yang Bermasalah

Petani padi Indonesia secara turun-temurun menggunakan **continuous flooding** (penggenangan terus-menerus) karena dianggap paling aman dan paling mudah dipahami. Masalahnya:

- **Boros air** — di tengah tekanan ketersediaan air yang makin tidak menentu akibat perubahan iklim.
- **Sumber emisi metana terbesar dari sektor pertanian** — sawah tergenang di Asia menyumbang mayoritas emisi metana global dari lahan padi, karena kondisi anaerobik terus-menerus memicu aktivitas bakteri metanogen.

### 2.2 Tidak Ada Satu Metode yang Cocok untuk Semua Kondisi

Ada beberapa strategi irigasi berbasis riset yang lebih efisien — **Alternate Wetting & Drying (AWD)**, **Delayed Irrigation**, **Partial Irrigation**, dan **Continuous Flooding termodifikasi** — namun efektivitasnya **sangat kondisional**:

- Di **tanah berpasir**, air cepat meresap sehingga AWD memberi penghematan minim dan berisiko membuat tanaman kekurangan air lebih cepat dari yang diperkirakan.
- Di **tanah liat dengan muka air dangkal**, tanah secara alami sudah menahan air lebih lama, sehingga AWD ketat sering kali **tidak diperlukan sama sekali** — retensi alami tanah sudah memberi efek serupa.
- Rekomendasi yang benar bergantung pada kombinasi jenis tanah, cuaca, fase tanam, dan ketersediaan air — **bukan template tunggal nasional**.

### 2.3 Hambatan Adopsi Bukan Cuma Teknis

- Petani yang mencoba metode _water-saving_ sering berhenti karena dianggap "terlalu sulit diterapkan" di tengah keterbatasan waktu dan tenaga kerja.
- Tata kelola irigasi di Indonesia kerap bersifat **komunal/gravitasi bersama** — petani individu sering **tidak punya kontrol penuh** atas kapan air masuk/keluar dari petakannya. Rekomendasi yang mengasumsikan kontrol penuh individual akan gagal diterapkan di lapangan.

### 2.4 Trade-off Lingkungan yang Sering Disembunyikan

Metode _water-saving_ umumnya menurunkan emisi metana (CH4) secara signifikan, **namun sering diikuti kenaikan emisi N2O (nitrous oxide)** akibat kondisi tanah yang berselang aerobik-anaerobik. Klaim dampak lingkungan yang jujur harus melihat **net Global Warming Potential (GWP)**, bukan hanya angka penurunan metana secara sepihak — klaim sepihak berisiko menyesatkan dan tidak kredibel secara ilmiah.

## 3. Target User

| Peran                            | Kebutuhan utama                                                                                   | Catatan scope                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Petani padi**                  | Rekomendasi irigasi yang mudah dipahami, notifikasi WhatsApp, tidak perlu literasi digital tinggi | Target user utama (primary persona) MVP                                                                                            |
| **Penyuluh pertanian**           | Melihat rekomendasi untuk mendampingi petani binaan, materi edukasi yang bisa dijelaskan ulang    | Akses multi-petani (dashboard penyuluh) **di luar scope MVP** — lihat §5                                                           |
| **Kelompok tani**                | Koordinasi keputusan irigasi bersama karena sistem gravitasi/komunal                              | Direpresentasikan lewat field `irrigation_system_type` dan governance note pada explanation, **bukan** fitur manajemen grup di MVP |
| **Komunitas irigasi (P3A/GP3A)** | Konteks tata kelola bersama yang harus diakui sistem                                              | Tercermin sebagai _disclaimer_ di output rekomendasi, bukan modul manajemen tersendiri                                             |

## 4. Value Proposition

1. **Rekomendasi kondisional, bukan template.** AI benar-benar mempertimbangkan jenis tanah, fase tanam, dan cuaca — termasuk kasus di mana AWD justru bukan pilihan terbaik.
2. **Transparan, bukan black-box.** Setiap rekomendasi disertai penjelasan: kenapa strategi lain ditolak (constraint ilmiah) dan kenapa strategi ini yang terpilih (reasoning model).
3. **Jujur secara lingkungan.** Net GWP (CH4 + N2O), bukan cuma klaim metana turun.
4. **Sadar konteks sosial.** Mengakui keterbatasan kontrol individual di sistem irigasi komunal lewat _governance note_.
5. **Sesuai kebiasaan digital petani Indonesia.** Notifikasi lewat WhatsApp (Fonnte), bukan aplikasi yang butuh instalasi rumit atau email yang jarang dicek.

## 5. Batasan Tegas (Non-Negotiable Scope)

AGRIVO **BUKAN**:

- ❌ Sistem otomasi irigasi. Tidak ada kontrol katup, pompa, sensor aktuator, atau hardware apa pun. AGRIVO hanya membaca input dan memberi rekomendasi — **keputusan akhir selalu di tangan petani**.
- ❌ Aplikasi pencatatan aktivitas tani umum (itu domain RiTx Bertani).
- ❌ Sistem SMS/USSD untuk lahan tadah hujan tanpa data cuaca granular (itu domain WeRise/IRRI).
- ❌ Platform manajemen multi-user/grup tani penuh (role penyuluh melihat banyak petani) pada versi MVP — dicatat sebagai **roadmap pasca-hackathon**, agar tidak ada asumsi implisit yang bocor ke skema database atau API di Fase 2.

AGRIVO **ADALAH**:

- ✅ Decision Support System bertingkat: input kondisi lahan → analisis AI (rule + ML) → rekomendasi strategi irigasi + prediksi dampak (air, hasil panen, lingkungan) → penjelasan yang bisa dipercaya → notifikasi.

## 6. Posisi vs Tools Sejenis

| Tool              | Fokus                                                                      | Yang tidak dipunyai                                                                                                       | Celah yang diisi AGRIVO                                                                                                       |
| ----------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **WeRise (IRRI)** | Rekomendasi untuk lahan tadah hujan (rainfed), berbasis SMS/USSD sederhana | Tidak multi-strategi granular per kombinasi tanah×cuaca×fase; tidak ada explainability detail; tidak ada estimasi net GWP | AGRIVO memberi rekomendasi multi-strategi eksplisit dengan explanation transparan dan channel WhatsApp yang lebih kaya konten |
| **RiTx Bertani**  | Pencatatan aktivitas tani (logbook digital)                                | Bukan sistem rekomendasi/DSS — tidak menganalisis kondisi lahan untuk memutuskan strategi irigasi                         | AGRIVO fokus spesifik di pengambilan keputusan irigasi, bukan pencatatan umum                                                 |

AGRIVO **tidak menggantikan** tools ini — mengisi celah spesifik: **rekomendasi metode irigasi multi-strategi berbasis AI yang climate-adaptive, dengan penjelasan transparan (bukan black-box) dan notifikasi WhatsApp**.

## 7. Kesalahan Umum yang Harus Dihindari Saat Membangun (Berdasarkan §2)

- Jangan membuat AI engine yang secara implisit selalu condong ke AWD karena data sintetis dibuat dengan bias penulis. Lihat validasi wajib di [07-ai-engine.md § Decision Matrix](./07-ai-engine.md#8-decision-matrix-20-skenario-representatif).
- Jangan melaporkan "penurunan emisi metana X%" tanpa disandingkan net GWP.
- Jangan mendesain form input yang mengasumsikan petani bisa mengatur air kapan pun ia mau — selalu sediakan field `irrigation_system_type` dan pastikan digunakan di rule-engine, bukan sekadar disimpan di database.
