# AGRIVO

AGRIVO adalah AI-powered Climate Adaptive Irrigation Decision Support System untuk sawah padi. Repo ini saat ini berada pada **Milestone 1: Infrastructure**, sehingga hanya berisi fondasi backend dan frontend tanpa business logic domain.

Dokumentasi di folder `docs/` adalah source of truth proyek. Implementasi harus selalu mengikuti dokumen tersebut.

## Development

- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL, Pydantic Settings
- Frontend: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui foundation
- Database lokal: PostgreSQL via DBngin, dikelola dengan TablePlus

## Installation

### Backend

Requires Python 3.11+ (check with `python3 --version`; install via `brew install python@3.11` on macOS if needed).

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

## Run Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "message": "Backend is healthy"
}
```

## Run Frontend

```bash
cd frontend
npm run dev
```

Frontend default URL:

```text
http://localhost:3000
```

## Environment Variables

### Backend

Defined in `backend/.env.example`:

- `APP_NAME`
- `APP_ENV`
- `APP_HOST`
- `APP_PORT`
- `API_V1_PREFIX`
- `LOG_LEVEL`
- `ALLOWED_ORIGINS`
- `REQUEST_ID_HEADER_NAME`
- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_DAYS`
- `WEATHER_CACHE_TTL_HOURS`
- `MAX_PLANTING_AGE_DAYS`
- `MAX_FIELD_AREA_HA`
- `OPEN_METEO_BASE_URL`
- `OPEN_METEO_ARCHIVE_URL`
- `FONNTE_BASE_URL`
- `FONNTE_API_TOKEN`
- `FONNTE_DEVICE_ID`

### Frontend

Defined in `frontend/.env.example`:

- `NEXT_PUBLIC_API_BASE_URL`

## Project Structure

```text
agrivo/
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── api/
│   │   ├── ai_engine/
│   │   ├── core/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   └── services/
│   ├── tests/
│   ├── .env.example
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── requirements.txt
├── docs/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── public/
│   ├── styles/
│   ├── .env.example
│   └── package.json
└── README.md
```

## Notes

- Backend infrastructure includes configuration, logging, middleware, centralized exception handling, SQLAlchemy session foundation, Alembic environment, and the `/api/v1/health` endpoint.
- Frontend infrastructure includes Next.js App Router setup, Tailwind CSS, shadcn/ui configuration, absolute imports, API client foundation, and a landing page placeholder at `/`.
- No models, repositories, services, authentication, weather integration, AI logic, or CRUD features are implemented in this milestone.
