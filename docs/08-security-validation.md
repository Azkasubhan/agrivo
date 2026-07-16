# 08 — Security & Validation

## 1. OWASP Top 10 Mapping

| Risiko OWASP                                     | Mitigasi di AGRIVO                                                                                                                                                                                                                        |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A01 Broken Access Control**                    | Otorisasi row-level di service layer (bandingkan `resource.user_id == current_user.id`), kembalikan `404` bukan `403` untuk resource milik user lain (lihat [06-api-specification.md § 4](./06-api-specification.md#4-fields-crud-lahan)) |
| **A02 Cryptographic Failures**                   | Password di-hash dengan **Argon2id** (fallback bcrypt cost 12); JWT ditandatangani `HS256` dengan secret min 32 byte dari environment variable; HTTPS wajib di semua environment non-lokal                                                |
| **A03 Injection**                                | ORM (SQLAlchemy) dengan parameterized query — repository layer **tidak boleh** membangun SQL string manual; Pydantic validasi tipe di boundary API                                                                                        |
| **A04 Insecure Design**                          | Clean Architecture ketat (§02-system-architecture), rule engine sebagai safety layer AI (§07-ai-engine), rate limiting di endpoint sensitif                                                                                               |
| **A05 Security Misconfiguration**                | CORS whitelist origin eksplisit (bukan `*`), security headers wajib (§4), debug mode FastAPI **off** di production                                                                                                                        |
| **A06 Vulnerable Components**                    | Dependency di-pin versi di `requirements.txt`/`package.json`, audit berkala (`pip-audit`, `npm audit`)                                                                                                                                    |
| **A07 Identification & Authentication Failures** | JWT access token TTL pendek (15 menit) + refresh token TTL 7 hari dengan rotasi; rate limit login & OTP; lockout sementara setelah percobaan gagal berulang                                                                               |
| **A08 Software & Data Integrity Failures**       | Migration Alembic direview manual sebelum apply (§05-database-design); CI menjalankan test sebelum deploy                                                                                                                                 |
| **A09 Security Logging & Monitoring Failures**   | Audit log untuk aksi sensitif (§5); structured logging (§09-coding-standards)                                                                                                                                                             |
| **A10 Server-Side Request Forgery (SSRF)**       | Panggilan keluar (Open-Meteo, Fonnte) hanya ke domain whitelist yang di-hardcode di konfigurasi, tidak pernah dibentuk dari input user                                                                                                    |

## 2. Autentikasi & Otorisasi

### 2.1 JWT + Refresh Token

- **Access token:** TTL **15 menit**, payload minimal (`user_id`, `exp`, `iat`), tidak menyimpan data sensitif.
- **Refresh token:** TTL **7 hari**, disimpan hash-nya di database (tabel implisit `refresh_tokens` atau kolom terpisah — ditambahkan di migrasi saat implementasi bila diperlukan), **rotasi setiap kali dipakai** (refresh token lama di-revoke saat dipakai, refresh token baru diterbitkan) untuk mendeteksi pencurian token (reuse detection: jika token lama yang sudah di-revoke dipakai lagi, revoke seluruh sesi user tersebut).
- Password **tidak pernah** dikembalikan di response API mana pun, termasuk endpoint admin/debug.

### 2.2 Rate Limiting

| Endpoint                            | Batas                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| `POST /auth/login`                  | 5 percobaan / 15 menit per kombinasi `phone_number` + IP                     |
| `POST /auth/forgot-password`        | 1 request / 60 detik per `phone_number`                                      |
| `POST /auth/reset-password`         | 5 percobaan / 15 menit per `phone_number`                                    |
| `POST /fields/{id}/recommendations` | 10 request / jam per user (mencegah abuse pemanggilan Open-Meteo berlebihan) |
| Default (semua endpoint auth lain)  | 100 request / menit per user                                                 |

Implementasi: middleware rate limiting berbasis Redis bila tersedia; fallback in-memory (per-instance) untuk hackathon jika Redis tidak sempat disiapkan — didokumentasikan sebagai known limitation (tidak scale multi-instance).

### 2.3 Password Policy

- Minimum 8 karakter, wajib mengandung kombinasi huruf & angka.
- Di-hash dengan Argon2id sebelum disimpan — **tidak pernah** disimpan/di-log dalam bentuk plain text.

## 3. Tabel Validasi Input Lengkap

Tabel ini adalah **rujukan tunggal** untuk seluruh aturan validasi (menghindari duplikasi yang berisiko tidak sinkron dengan [04-input-specification.md](./04-input-specification.md) — jika ada perbedaan, dokumen ini yang menjadi acuan final untuk pesan error).

| Field                        | Aturan                                                                           | Kode Error                                          | Alasan Bisnis                                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `phone_number`               | Format E.164, unik                                                               | `INVALID_PHONE_FORMAT` / `PHONE_ALREADY_REGISTERED` | Nomor WhatsApp adalah identitas login utama & channel OTP                                                                     |
| `password`                   | Min 8 karakter, kombinasi huruf+angka                                            | `WEAK_PASSWORD`                                     | Mencegah brute force sederhana                                                                                                |
| `email`                      | Format email valid (jika diisi), unik                                            | `INVALID_EMAIL_FORMAT` / `EMAIL_ALREADY_REGISTERED` | Opsional, dipakai untuk profil sekunder                                                                                       |
| `latitude`                   | `-11.00` s/d `6.10`                                                              | `LATITUDE_OUT_OF_RANGE`                             | Rentang wilayah Indonesia — di luar ini data cuaca/agronomi tidak relevan                                                     |
| `longitude`                  | `94.70` s/d `141.10`                                                             | `LONGITUDE_OUT_OF_RANGE`                            | Idem                                                                                                                          |
| `soil_type`                  | Salah satu dari `SANDY, LOAM, CLAY, SILTY`, wajib                                | `INVALID_SOIL_TYPE`                                 | Fitur berbobot tinggi di AI — tanpa ini rule engine tidak bisa memfilter kandidat                                             |
| `rice_variety_code`          | Harus ada di tabel `rice_varieties`                                              | `RICE_VARIETY_NOT_FOUND`                            | Dipakai menghitung total durasi fase pertumbuhan                                                                              |
| `planting_date`              | `<= today`, dan `today - planting_date <= MAX_PLANTING_AGE_DAYS (150)`           | `PLANTING_DATE_IN_FUTURE` / `PLANTING_DATE_TOO_OLD` | Tanggal masa depan membuat growth_stage tidak terdefinisi; tanggal terlalu tua kemungkinan besar lahan sudah dipanen          |
| `field_area_ha`              | `> 0` dan `<= 25`                                                                | `FIELD_AREA_INVALID`                                | Mencegah input keliru satuan; 25ha jauh di atas rata-rata kepemilikan petani individual tapi masih wajar untuk kelompok tani  |
| `previous_irrigation_method` | Opsional, salah satu enum strategi jika diisi                                    | `INVALID_IRRIGATION_METHOD`                         | Dipakai sebagai baseline personal water saving                                                                                |
| `irrigation_system_type`     | Opsional, salah satu dari `TECHNICAL, SEMI_TECHNICAL, RAINFED, COMMUNAL_GRAVITY` | `INVALID_IRRIGATION_SYSTEM_TYPE`                    | Dipakai rule engine (R7, R9) & governance note — sangat disarankan diisi via UI helper text, tidak wajib mem-block submission |
| `otp`                        | 6 digit numerik, berlaku 5 menit                                                 | `INVALID_OR_EXPIRED_OTP`                            | Mencegah brute force reset password                                                                                           |

## 4. Header Keamanan & CORS

**Security headers wajib** (middleware FastAPI):

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

**CORS:** whitelist origin eksplisit dari environment variable `ALLOWED_ORIGINS` (comma-separated), tidak pernah `*` di production. Method diizinkan hanya yang dipakai (`GET, POST, PATCH, DELETE, OPTIONS`).

## 5. Audit Log untuk Aksi Sensitif

Aksi berikut **wajib** dicatat ke log terstruktur (lihat format di [09-coding-standards.md](./09-coding-standards.md)) dengan `user_id`, `action`, `resource_id`, `timestamp`, `ip_address`:

- Login berhasil/gagal
- Reset password
- Create/update/delete `fields`
- Trigger rekomendasi baru
- Perubahan `notification_preferences`

Log **tidak boleh** menyertakan password, token, atau OTP dalam bentuk apa pun (termasuk di error trace).

## 6. Manajemen Secrets

Seluruh kredensial (JWT secret, Fonnte API token/device ID, database URL) **wajib** dari environment variable, tidak pernah hardcoded atau di-commit ke repository. File `.env.example` disediakan sebagai template tanpa nilai asli. `.gitignore` memastikan `.env` tidak ter-commit.

## 7. Kesalahan Umum yang Harus Dihindari

- Jangan menampilkan pesan error berbeda antara "nomor tidak terdaftar" dan "password salah" pada login/forgot-password — keduanya harus generik untuk mencegah enumerasi akun.
- Jangan melewatkan validasi `soil_type`/`irrigation_system_type` di level database (`ENUM`) hanya mengandalkan validasi Pydantic — pertahanan berlapis wajib.
- Jangan menyimpan refresh token dalam bentuk plain text di database — simpan hash-nya (mis. SHA-256), bandingkan hash saat validasi.
