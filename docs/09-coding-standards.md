# 09 — Coding Standards & Folder Structure

## 1. Struktur Folder Backend (`backend/`)

```
backend/
├── alembic/
│   ├── versions/
│   └── env.py
├── app/
│   ├── main.py                      # Entry point FastAPI, wiring middleware & router
│   ├── core/
│   │   ├── config.py                # Environment variables (Pydantic Settings)
│   │   ├── security.py              # JWT, password hashing
│   │   ├── logging.py                # Konfigurasi structured logging
│   │   └── exceptions.py            # Custom exception classes domain
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py               # Router — HANYA validasi request & panggil service
│   │       ├── users.py
│   │       ├── fields.py
│   │       ├── recommendations.py
│   │       ├── weather.py
│   │       ├── education.py
│   │       └── notifications.py
│   ├── schemas/                      # Pydantic request/response models
│   │   ├── auth.py
│   │   ├── field.py
│   │   ├── recommendation.py
│   │   └── ...
│   ├── models/                       # SQLAlchemy ORM models (1:1 dengan tabel di 05-database-design.md)
│   │   ├── user.py
│   │   ├── field.py
│   │   ├── recommendation.py
│   │   └── ...
│   ├── repositories/                 # SATU-SATUNYA layer yang akses DB
│   │   ├── user_repository.py
│   │   ├── field_repository.py
│   │   ├── recommendation_repository.py
│   │   └── ...
│   ├── services/                     # SELURUH business logic
│   │   ├── auth_service.py
│   │   ├── field_service.py
│   │   ├── recommendation_service.py
│   │   ├── weather_service.py
│   │   ├── notification_service.py
│   │   └── scheduler_service.py
│   └── ai_engine/                    # Modul terpisah, interface tegas (lihat 07-ai-engine.md)
│       ├── schemas.py                 # AIEngineInput / AIEngineOutput
│       ├── engine.py                  # Entry point: infer(input) -> output
│       ├── rule_engine.py            # Candidate filter (Layer 1 + Layer 2)
│       ├── ml_model.py               # Load & inference model ML
│       ├── explanation.py            # Explanation generator
│       ├── training/
│       │   ├── generate_synthetic_dataset.py
│       │   └── train.py
│       └── artifacts/                # Model file (.joblib) per versi
├── tests/
│   ├── unit/
│   ├── integration/
│   └── ai_engine/
│       └── test_decision_matrix.py   # Regression test 22 skenario dari 07-ai-engine.md §8
├── requirements.txt
└── .env.example
```

## 2. Struktur Folder Frontend (`frontend/`) — Atomic Design

```
frontend/
├── app/                               # Next.js App Router
│   ├── (auth)/login/page.tsx
│   ├── (auth)/register/page.tsx
│   ├── dashboard/page.tsx
│   ├── fields/page.tsx
│   ├── fields/[id]/page.tsx
│   ├── fields/[id]/recommendation/page.tsx
│   ├── education/page.tsx
│   ├── notifications/page.tsx
│   └── settings/page.tsx
├── components/
│   ├── atoms/                         # Button, Input, Badge, Spinner
│   ├── molecules/                     # FormField, StatCard, MapMarkerPopup
│   ├── organisms/                     # RecommendationCard, FieldForm, WeatherPanel
│   └── templates/                     # Layout per halaman
├── hooks/                             # useFields, useRecommendation, useAuth
├── lib/
│   ├── api-client.ts                  # Wrapper fetch/axios ke backend
│   ├── types.ts                       # Tipe TypeScript sinkron dengan schemas backend
│   └── validators.ts                  # Validasi form (Zod), sinkron dengan 08-security-validation.md
└── styles/
```

## 3. Naming Convention

| Konteks                      | Konvensi                      | Contoh                                               |
| ---------------------------- | ----------------------------- | ---------------------------------------------------- |
| Python file/module           | `snake_case`                  | `recommendation_service.py`                          |
| Python class                 | `PascalCase`                  | `RecommendationService`                              |
| Python function/variable     | `snake_case`                  | `get_active_fields()`                                |
| TypeScript file (komponen)   | `PascalCase.tsx`              | `RecommendationCard.tsx`                             |
| TypeScript file (utilitas)   | `kebab-case.ts`               | `api-client.ts`                                      |
| TypeScript function/variable | `camelCase`                   | `fetchFieldById()`                                   |
| Database table/column        | `snake_case`                  | `recommendation_predictions`                         |
| Enum value (DB & Python)     | `UPPER_SNAKE_CASE`            | `AWD_STRICT`                                         |
| REST endpoint path           | `kebab-case`, plural resource | `/api/v1/fields`, `/api/v1/notification-preferences` |

## 4. Format Error Response Standar

Semua error API mengikuti format berikut (lihat juga [06-api-specification.md § 1](./06-api-specification.md#1-konvensi-umum)):

```json
{
  "error": {
    "code": "SNAKE_CASE_ERROR_CODE",
    "message": "Pesan singkat berbahasa Indonesia, aman ditampilkan ke user",
    "details": [{ "field": "nama_field", "issue": "penjelasan spesifik" }]
  }
}
```

Aturan:

- `code` selalu `UPPER_SNAKE_CASE`, konsisten dengan kode di [08-security-validation.md § 3](./08-security-validation.md#3-tabel-validasi-input-lengkap).
- `message` tidak pernah membocorkan detail teknis internal (stack trace, nama tabel, query SQL).
- `details` opsional, hanya diisi untuk error validasi multi-field.
- Exception domain (`FieldNotFoundError`, `RecommendationEngineError`, dll.) didefinisikan di `app/core/exceptions.py`, ditangkap oleh exception handler global FastAPI yang memetakan ke format di atas dan HTTP status code yang sesuai — **router tidak menangani exception secara manual per endpoint**.

## 5. Logging Standar

- Format **structured JSON** (bukan plain text) agar mudah diparsing: `{"timestamp", "level", "message", "context": {...}}`.
- Level: `DEBUG` (detail development), `INFO` (event bisnis normal — rekomendasi dibuat, notifikasi terkirim), `WARNING` (fallback aktif — cuaca estimasi, ML gagal jatuh ke rule-only), `ERROR` (exception tak tertangani).
- **Tidak pernah** log password, token, OTP, atau `password_hash`.
- Setiap log request HTTP menyertakan `request_id` (UUID per request, di-generate middleware) untuk korelasi lintas log dalam satu request yang sama.

## 6. Commit Convention

Mengikuti [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <deskripsi singkat>

Contoh:
feat(ai-engine): tambah rule constraint R6 untuk clay+surplus
fix(fields): perbaiki validasi rentang longitude
docs(07-ai-engine): tambah decision matrix 22 skenario
test(ai-engine): regression test decision matrix
chore(deps): update fastapi ke 0.115
```

Tipe yang diizinkan: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `style`, `perf`.

## 7. Error Handling Standar (Detail Layer)

| Layer      | Cara handle error                                                                                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository | Biarkan exception database (`IntegrityError`, dll.) naik apa adanya, jangan ditangkap di sini                                                                                                                                                                       |
| Service    | Tangkap exception teknis dari repository, lempar ulang sebagai domain exception yang jelas (`FieldNotFoundError`, `DuplicatePhoneNumberError`)                                                                                                                      |
| Router     | Tidak menangkap exception secara manual — didelegasikan ke global exception handler                                                                                                                                                                                 |
| AI Engine  | Jika ML model gagal load/infer, tangkap secara internal, fallback ke `engine_type="rule_only"` (lihat [07-ai-engine.md § 5](./07-ai-engine.md#5-confidence-scoring)) — **tidak** melempar exception ke service layer untuk kasus ini karena ada fallback yang valid |

## 8. Kesalahan Umum yang Harus Dihindari

- Jangan menaruh query SQLAlchemy di dalam file `services/` — jika ditemukan, pindahkan ke `repositories/`.
- Jangan membuat endpoint baru tanpa schema Pydantic request/response eksplisit di `schemas/`.
- Jangan menambah dependency baru ke `requirements.txt`/`package.json` tanpa mendokumentasikan alasannya bila menyimpang dari [03-tech-stack.md](./03-tech-stack.md).
