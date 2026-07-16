# 06 — API Specification

## 1. Konvensi Umum

- **Base URL:** `/api/v1`
- **Format:** JSON, `Content-Type: application/json`
- **Auth:** `Authorization: Bearer <access_token>` (JWT), kecuali endpoint yang eksplisit ditandai publik.
- **Format error konsisten** (lihat detail penuh di [09-coding-standards.md § 4](./09-coding-standards.md#4-format-error-response-standar)):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Pesan singkat yang bisa ditampilkan ke user",
    "details": [
      {
        "field": "planting_date",
        "issue": "Tanggal tanam tidak boleh di masa depan"
      }
    ]
  }
}
```

- **Paginasi** untuk endpoint list: query param `page` (default 1), `page_size` (default 20, max 100). Response membungkus dengan `{ "items": [...], "total": N, "page": N, "page_size": N }`.

## 2. Auth

### 2.1 `POST /api/v1/auth/register` (publik)

**Request:**

```json
{
  "full_name": "Budi Santoso",
  "phone_number": "+6281234567890",
  "password": "MinimalDelapanKarakter1",
  "email": "budi@example.com"
}
```

**Validasi:** `phone_number` format E.164 & unik; `password` min 8 karakter, mengandung huruf & angka; `email` opsional tapi harus format valid & unik jika diisi.

**Response `201 Created`:**

```json
{ "id": "uuid", "full_name": "Budi Santoso", "phone_number": "+6281234567890" }
```

**Error:** `409 Conflict` (`PHONE_ALREADY_REGISTERED`), `422` (validasi).

### 2.2 `POST /api/v1/auth/login` (publik)

**Request:** `{ "phone_number": "+6281234567890", "password": "..." }`

**Response `200 OK`:**

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 900
}
```

**Error:** `401 Unauthorized` (`INVALID_CREDENTIALS`) — pesan generik, tidak membocorkan apakah nomor terdaftar atau password salah (lihat [08-security-validation.md](./08-security-validation.md)).

### 2.3 `POST /api/v1/auth/refresh` (publik, butuh refresh token valid)

**Request:** `{ "refresh_token": "eyJ..." }`
**Response `200 OK`:** access token baru (+ refresh token baru, rotasi token).
**Error:** `401` (`INVALID_REFRESH_TOKEN`) bila expired/revoked.

### 2.4 `POST /api/v1/auth/forgot-password` (publik)

**Request:** `{ "phone_number": "+6281234567890" }`
**Perilaku:** Mengirim OTP 6 digit via WhatsApp (Fonnte), berlaku 5 menit, rate limit 1 request/60 detik per nomor.
**Response `200 OK`:** `{ "message": "Jika nomor terdaftar, kode OTP telah dikirim." }` — pesan sama baik nomor terdaftar atau tidak (mencegah enumerasi akun).

### 2.5 `POST /api/v1/auth/reset-password` (publik)

**Request:** `{ "phone_number": "...", "otp": "123456", "new_password": "..." }`
**Response `200 OK`:** `{ "message": "Password berhasil diperbarui." }`
**Error:** `400` (`INVALID_OR_EXPIRED_OTP`).

## 3. Users / Profile

### 3.1 `GET /api/v1/users/me` (auth)

Response `200`: profil user + `notification_preferences` ter-nest.

### 3.2 `PATCH /api/v1/users/me` (auth)

**Request (partial):** `{ "full_name": "...", "email": "..." }`
**Response `200`:** profil terbaru.

### 3.3 `PATCH /api/v1/users/me/notification-preferences` (auth)

**Request:** `{ "whatsapp_enabled": true, "recommendation_change_alert": true, "weather_risk_alert": false }`
**Response `200`:** preferensi terbaru.

## 4. Fields (CRUD Lahan)

Semua endpoint di bawah **wajib auth** dan **hanya beroperasi pada field milik user yang login** (otorisasi row-level di service layer — bandingkan `field.user_id == current_user.id`, kembalikan `404 Not Found` bukan `403` untuk field milik user lain, guna menghindari kebocoran informasi keberadaan resource).

### 4.1 `POST /api/v1/fields`

**Request:**

```json
{
  "name": "Sawah Blok A",
  "latitude": -6.914744,
  "longitude": 107.60981,
  "soil_type": "CLAY",
  "rice_variety_code": "CIHERANG",
  "planting_date": "2026-06-01",
  "field_area_ha": 0.8,
  "previous_irrigation_method": null,
  "irrigation_system_type": "COMMUNAL_GRAVITY"
}
```

**Validasi:** seluruh aturan di [04-input-specification.md](./04-input-specification.md) & [08-security-validation.md § 3](./08-security-validation.md#3-tabel-validasi-input-lengkap).
**Response `201`:** objek field lengkap dengan `id`.
**Error:** `422` (validasi), `404` (`rice_variety_code` tidak ditemukan).

### 4.2 `GET /api/v1/fields` — list lahan milik user (paginasi)

**Response `200`:** daftar field (tidak termasuk yang `deleted_at IS NOT NULL`).

### 4.3 `GET /api/v1/fields/{field_id}` — detail

**Response `200`** atau `404` jika bukan milik user/tidak ada.

### 4.4 `PATCH /api/v1/fields/{field_id}` — update sebagian

Field yang bisa diubah: semua kecuali `id`, `user_id`, `created_at`. Perubahan `planting_date`/`soil_type`/`rice_variety_code` akan memengaruhi rekomendasi berikutnya (bukan retroaktif ke rekomendasi lama, karena `input_snapshot` sudah immutable).

### 4.5 `DELETE /api/v1/fields/{field_id}` — soft delete

**Response `204 No Content`.** Set `deleted_at = now()`. Histori rekomendasi field ini tetap bisa diakses lewat `GET /api/v1/fields/{field_id}/recommendations` (read-only), tapi `POST` rekomendasi baru akan `409 Conflict` (`FIELD_DELETED`).

## 5. Recommendations

### 5.1 `POST /api/v1/fields/{field_id}/recommendations` — trigger rekomendasi baru

**Request:** body kosong (semua input diambil dari field + auto-fetch cuaca + derived).
**Alur:** lihat [02-system-architecture.md § 4](./02-system-architecture.md#4-alur-data-end-to-end).
**Response `201 Created`:**

```json
{
  "id": "uuid",
  "field_id": "uuid",
  "created_at": "2026-07-16T08:00:00Z",
  "engine_type": "hybrid",
  "model_version": "xgb-v1.0.0",
  "input_snapshot": {
    "soil_type": "CLAY",
    "growth_stage": "VEGETATIVE",
    "water_balance_index": "SURPLUS",
    "weather_risk_index": "NORMAL",
    "irrigation_system_type": "COMMUNAL_GRAVITY",
    "is_weather_estimated": false
  },
  "recommended_strategy": "AWD_MILD",
  "confidence_score": 0.82,
  "predictions": {
    "water_saving_percent": 22.5,
    "expected_yield_ton_per_ha": 6.1,
    "yield_baseline_ton_per_ha": 6.0,
    "ch4_reduction_percent": 38.0,
    "n2o_change_percent": 6.5,
    "net_gwp_reduction_percent": 27.0
  },
  "explanation": {
    "why": "Tanah liat dengan surplus air alami, fase vegetatif toleran kekeringan sedang.",
    "benefits": ["Menghemat air ~22.5%", "Menurunkan net GWP ~27%"],
    "tradeoffs": ["Emisi N2O meningkat ~6.5%, namun net dampak tetap positif"],
    "how_to_implement": "Biarkan lahan mengering hingga muka air 15cm di bawah permukaan tanah sebelum irigasi ulang.",
    "governance_note": "Lahan menggunakan sistem irigasi gravitasi bersama — koordinasikan jadwal pengeringan dengan kelompok tani agar tidak mengganggu petak tetangga.",
    "rule_constraints_applied": [
      "AWD_STRICT dikecualikan: fase saat ini masih dalam batas aman namun mendekati reproductive, risiko tinggi jika prediksi fase meleset."
    ],
    "ml_reasoning": {
      "chosen_candidate": "AWD_MILD",
      "candidates_considered": ["CONTINUOUS_FLOODING_MODIFIED", "AWD_MILD"],
      "top_features": [
        { "feature": "soil_type", "influence": 0.34 },
        { "feature": "water_balance_index", "influence": 0.29 },
        { "feature": "growth_stage", "influence": 0.21 }
      ]
    }
  }
}
```

**Error:** `404` (field tidak ada/bukan milik user), `409` (`FIELD_DELETED`), `502` (`AI_ENGINE_FAILURE` — lihat fallback di [07-ai-engine.md § 5](./07-ai-engine.md#5-confidence-scoring)).

### 5.2 `GET /api/v1/fields/{field_id}/recommendations` — history (paginasi)

**Response `200`:** daftar ringkas rekomendasi terurut `created_at DESC` (tanpa `explanation` penuh, hanya ringkasan — untuk detail lengkap panggil §5.3).

### 5.3 `GET /api/v1/recommendations/{recommendation_id}` — detail + explanation lengkap

Struktur sama dengan response §5.1. Otorisasi: hanya bisa diakses jika `recommendation.field.user_id == current_user.id`.

## 6. Weather

### 6.1 `GET /api/v1/fields/{field_id}/weather` — kondisi cuaca terkini + forecast

**Response `200`:**

```json
{
  "field_id": "uuid",
  "fetched_at": "2026-07-16T07:55:00Z",
  "is_estimated": false,
  "current": {
    "temperature_c": 29.4,
    "humidity_percent": 78,
    "precipitation_mm_today": 2.1
  },
  "forecast_14d": [
    {
      "date": "2026-07-17",
      "precipitation_mm": 5.0,
      "temperature_max_c": 31.2,
      "temperature_min_c": 23.1
    }
  ],
  "et0_mm": 4.2
}
```

Menggunakan cache `weather_snapshots` bila masih berlaku (lihat [02-system-architecture.md § 5](./02-system-architecture.md#5-caching-cuaca)).

## 7. Education

### 7.1 `GET /api/v1/education` (publik atau auth, bebas) — daftar konten, filter opsional `?strategy=AWD_MILD`

### 7.2 `GET /api/v1/education/{content_id}` — detail konten

## 8. Notifications

### 8.1 `GET /api/v1/notifications` (auth, paginasi) — daftar notifikasi user

### 8.2 `PATCH /api/v1/notifications/{notification_id}/read` (auth) — tandai dibaca

**Response `200`:** `{ "id": "uuid", "is_read": true, "read_at": "..." }`

## 9. Ringkasan Kode Status & Error

| Kode  | Kapan dipakai                                                                    |
| ----- | -------------------------------------------------------------------------------- |
| `200` | Sukses GET/PATCH                                                                 |
| `201` | Sukses create                                                                    |
| `204` | Sukses delete (tanpa body)                                                       |
| `400` | Request malformed / OTP invalid                                                  |
| `401` | Tidak terautentikasi / token invalid                                             |
| `403` | Terautentikasi tapi tidak berhak (jarang dipakai — lihat §4 soal preferensi 404) |
| `404` | Resource tidak ditemukan / bukan milik user                                      |
| `409` | Konflik state (misal field sudah dihapus, nomor sudah terdaftar)                 |
| `422` | Validasi field gagal                                                             |
| `429` | Rate limit terlampaui                                                            |
| `502` | Dependensi eksternal gagal total (AI engine crash, dsb.)                         |

## 10. Kesalahan Umum yang Harus Dihindari

- Jangan mengembalikan `403` untuk resource milik user lain — gunakan `404` agar tidak membocorkan keberadaan data (IDOR mitigation, lihat [08-security-validation.md](./08-security-validation.md)).
- Jangan menyertakan `explanation` penuh di endpoint list history (§5.2) — payload besar tidak perlu diulang di setiap item list, cukup di endpoint detail.
- Jangan membiarkan endpoint `forgot-password` mengembalikan pesan berbeda antara nomor terdaftar dan tidak terdaftar.
