<br>
<div align="left">
  <img
    src="frontend/public/046ccf6a342df17f2bcdd8a02c36989cf737a1a19edebe284822f11be77df764.png"
    alt="AGRIVO"
    style="width:100%; max-width:1400px;"
  />
</div>
<br>

> **🌾 Disclaimer**: AGRIVO is a Decision Support System, not an automation system. It does not control any irrigation hardware. All recommendations are informational — the final decision always remains with the farmer.

---

## What is AGRIVO?

AGRIVO (Agriculture + Vitality + Optimization) is an AI-powered Climate-Adaptive Irrigation Decision Support System for rice paddy farmers. It recommends the most suitable irrigation strategy based on specific field conditions — soil type, weather, crop growth stage, and irrigation system context.

AGRIVO uses a Hybrid AI Engine (Rule Engine + XGBoost ML) combined with real-time weather data to generate transparent, science-backed recommendations with honest environmental impact predictions.

### Core User Flows

```
Farmer:
  Login → Dashboard → Select Field → Run AI Engine → Preview Recommendation → Save / Discard

Field Management:
  Field Analysis → Add Field (soil, crop, location) → View Metrics → Monitor Weather

AI Engine:
  Fetch Weather → Rule Engine (Constraint Filter) → XGBoost ML (Final Decision) → Prediction + Explanation
```

---

## Features

- **Hybrid AI Engine** — Rule Engine (IRRI research-based constraint filter) + XGBoost ML (final strategy decision)
- **Real-Time Weather Integration** — 14-day forecast & 30-day historical data from Open-Meteo
- **Multi-Strategy Recommendations** — AWD (Mild/Strict), Continuous Flooding, Delayed Irrigation, Partial Irrigation
- **Transparent Explanations** — Why a strategy was chosen and why others were rejected
- **Environmental Impact** — Honest net GWP (CH₄ + N₂O), not just methane reduction claims
- **Field Management Dashboard** — Monitor soil, crop stage, weather, and recommendation history per field
- **Preview & Save** — Review AI recommendations before committing to history
- **WhatsApp Notifications** — Daily recommendations via Fonnte API (no app installation needed)
- **Automated Daily Cron** — Recommendations generated at 06:00 AM every day

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + TypeScript + Vanilla CSS |
| Backend | FastAPI + Python + SQLAlchemy + PostgreSQL |
| Auth | JWT + Passlib (bcrypt) |
| AI/ML | XGBoost + Rule Engine (IRRI research-based) |
| Weather | Open-Meteo API (forecast + historical) |
| Notifications | Fonnte WhatsApp API |
| Migrations | Alembic |
| Scheduler | APScheduler (daily cron) |

---

## Architecture Overview

```
Frontend (Next.js)
    │
    │ REST API + JWT
    ▼
Backend (FastAPI)
  ├── Auth Routes
  ├── Field Routes
  ├── Weather Routes
  ├── Recommendation Routes
  ├── Notification Routes
  └── AI Engine
        ├── RuleEngine (IRRI constraint filter)
        ├── MLModel (XGBoost inference)
        ├── ExplanationGenerator (transparent reasoning)
        └── WeatherService (Open-Meteo integration)
    │
    ▼
PostgreSQL Database
```

---

## Folder Structure

```
agrivo/
├── frontend/              # Next.js App Router
│   ├── app/               # Pages (dashboard, recommendations, field-analysis, weather, profile)
│   ├── components/        # UI components (layout, dashboard, field-analysis, ui)
│   ├── lib/               # API client, auth helpers
│   └── public/            # Static assets (images)
├── backend/               # FastAPI
│   ├── app/
│   │   ├── ai_engine/     # Hybrid AI Engine (rule_engine, ml_model, explanation, schemas)
│   │   ├── api/           # HTTP route handlers (v1/)
│   │   ├── core/          # Config, security, constants
│   │   ├── models/        # SQLAlchemy models (user, field, recommendation, weather, notification)
│   │   ├── repositories/  # Database access layer
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   └── services/      # Business logic (auth, field, weather, recommendation, notification, scheduler)
│   ├── alembic/           # Database migrations
│   ├── scripts/           # Seed data helpers
│   └── tests/             # Test suite
├── docs/                  # Documentation (10 docs)
└── README.md
```

---

## How to Run

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+

---

### Backend

```bash
cd backend

# Create virtual environment
python3.11 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL connection string and JWT secret

# Run database migrations
alembic upgrade head

# Seed demo data
python -m app.seed_data

# Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

# Start frontend
npm run dev
```

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs (Swagger UI)

---

## Database Setup

```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE agrivo_db;"

# Update DATABASE_URL in backend/.env
# DATABASE_URL=postgresql://postgres:password@localhost:5432/agrivo_db

# Run Alembic migrations
cd backend
alembic upgrade head
```

---

## How the AI Engine Works

When a recommendation is triggered (manually or daily cron at 06:00 AM):

1. **WeatherService** — Fetches 14-day forecast + 30-day historical data from Open-Meteo API
2. **RuleEngine** — Filters candidate irrigation strategies using IRRI research-based scientific constraints (soil type, crop stage, water table depth, rainfall patterns)
3. **MLModel (XGBoost)** — Selects the optimal strategy from filtered candidates and predicts yield, water savings, and GWP impact
4. **ExplanationGenerator** — Produces transparent reasoning: why this strategy was chosen, why others were rejected, and governance notes for communal irrigation systems
5. **RecommendationService** — Saves results and optionally sends WhatsApp notification via Fonnte API

### Strategy Options

| Strategy | Water Saving | GWP Reduction | Yield Impact |
|---|---|---|---|
| AWD (Mild) | 15-25% | −20-30% | Stable / +1% |
| AWD (Strict) | 30-40% | −40-50% | −2% |
| Continuous Flooding | Baseline | Baseline | Stable |
| Continuous Flooding (Modified) | 10% | −15% | Stable |
| Delayed Irrigation | 8% | −10% | No loss |
| Partial Irrigation | 18% | −20% | −4% |

### Key Design Decisions

- **Net GWP, not just methane** — CH₄ reduction from water-saving methods is often offset by N₂O increase. AGRIVO reports honest net GWP.
- **Conditional, not template** — The AI considers soil type, weather, and crop stage. AWD is NOT always the best choice (e.g., sandy soil with deep water table).
- **Social context aware** — Communal/gravity irrigation systems limit individual farmer control. AGRIVO acknowledges this in governance notes.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Secret key for JWT token signing |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | JWT refresh token lifetime |
| `OPEN_METEO_BASE_URL` | Open-Meteo forecast API URL |
| `OPEN_METEO_ARCHIVE_URL` | Open-Meteo historical API URL |
| `FONNTE_API_TOKEN` | Fonnte WhatsApp API token |
| `FONNTE_DEVICE_ID` | Fonnte WhatsApp device ID |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL |

---

## Safety & Scope Disclaimer

> AGRIVO is a **Decision Support System**, not an automation system. It does not control any valves, pumps, sensors, or actuators. AGRIVO reads input conditions and provides recommendations — **the final decision always remains with the farmer**. Environmental impact claims use net GWP (CH₄ + N₂O), not misleading single-metric claims.

---

## Known Limitations

- Open-Meteo API calls can take 30-60 seconds (weather data is large)
- XGBoost model uses synthetic training data calibrated against IRRI research
- WhatsApp notifications require active Fonnte subscription
- Single-user scope in MVP (multi-user dashboard for extension workers is post-MVP)
- No IoT sensor integration (manual field data input only)
- Leaflet map plugin requires npm network availability for installation

---

## Future Improvements

- Real IoT sensor integration (soil moisture, water level)
- Multi-user dashboard for agricultural extension workers
- Mobile PWA with offline support
- Real-time push notifications
- Custom ML model training per region
- NDVI satellite imagery integration
- Multi-language support (Bahasa Indonesia, Javanese, Sundanese)
- Community irrigation group management
- Historical yield validation against actual farmer data
- SMS/USSD fallback for low-connectivity areas

---

## Documentation

Full documentation in `/docs`:

| File | Content |
|---|---|
| `01-project-overview.md` | Problem statement, target users, value proposition |
| `02-system-architecture.md` | Tech stack and architecture diagrams |
| `03-tech-stack.md` | Detailed technology choices and rationale |
| `04-input-specification.md` | All input fields, validation rules, and data sources |
| `05-database-design.md` | All tables, columns, and relationships |
| `06-api-specification.md` | All endpoints with request/response examples |
| `07-ai-engine.md` | Full AI pipeline design, rule engine, ML model |
| `08-security-validation.md` | Auth, RBAC, input validation, security measures |
| `09-coding-standards.md` | Code style, naming conventions, patterns |
| `10-ui-ux-guidelines.md` | Design system, components, UX patterns |

---

## API Documentation

When backend is running: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)

---

<br>
<div align="left">
  <h2>Meet the Team</h2>
  <p>The people behind AGRIVO</p>
</div>

<a href="#"><img width="144px" height="180px" src="https://drive.google.com/uc?export=view&id=17JzgCaF45gCTXnlIglXVKpq05sTQq5Vx" alt=""/></a> | <a href="#"><img width="144px" height="180px" src="https://drive.google.com/uc?export=view&id=1eOFVxZgBGwHtyDeV7OwQkiE4X2GUxEJE" alt=""/></a> | <a href="#"><img width="144px" height="180px" src="https://drive.google.com/uc?export=view&id=1kbe9CbYZBaLMgQ-PSwiz179-lZVjKZ9v" alt=""/></a> | <a href="#"><img width="144px" height="180px" src="https://drive.google.com/uc?export=view&id=17fSXYU6hc4AbKMvgcrPub7wiV55OcjNr" alt=""/></a> |
| --- | --- | --- | --- |
| <div align="left"><h3><b>Muhammad Aris Maulana</b></h3></div> | <div align="left"><h3><b>Nazla Azzahra Hermana</b></h3></div> | <div align="left"><h3><b>Ladya Kalascha</b></h3></div> | <div align="left"><h3><b>Muhammad Azka Subhan</b></h3></div> |
