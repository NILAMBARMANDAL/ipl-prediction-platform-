# IPLLab — IPL Analytics & Win-Predictor Engine

A full-stack platform that predicts the outcome of an IPL run chase in real time and surfaces deep historical analytics from 17 seasons of ball-by-ball data.

This project is intentionally split into **three services**, each doing what it is best at:

| Service | Stack | Responsibility |
| --- | --- | --- |
| `frontend-react` | React 19 · Vite · Tailwind · React Router 7 | Dashboard, live predictor form, auth UI |
| `backend-node` | Node · Express 5 · MongoDB (Mongoose) · JWT | App + data layer: analytics aggregation, auth, cricket feature engineering |
| `backend-ml` | FastAPI · scikit-learn · Pydantic | Pure model inference — loads `pipe.pkl`, returns win probability |

## Why three services instead of one

The trained model is a Python artifact (a scikit-learn pipeline). The natural home for it is a Python process, so it lives in an isolated FastAPI service. Everything else — users, auth, and the historical analytics computed from MongoDB — is JavaScript, so it lives in Node/Express. The React frontend calls Node for data and auth, and prediction requests flow **frontend → Node (gateway) → FastAPI**: Node validates and forwards the raw match state, and FastAPI computes the model's features using the **same feature-engineering code it was trained with**, then predicts. The cricket feature math lives in exactly one place (a shared Python module), so training and serving can never drift apart — see the train/serve skew note below.

```
                      ┌──────────────────────┐
   match state        │   React (Vite)       │
   ┌──────────────────►  dashboard + form    │
   │                  └──────────┬───────────┘
   │                             │ REST (cookie auth)
   │                  ┌──────────▼───────────┐        ┌────────────────┐
   │   analytics ◄────┤  Node / Express 5    │        │   MongoDB Atlas │
   │   + auth         │  aggregation, auth,  ├───────►│  matches +      │
   │                  │  feature engineering │        │  deliveries     │
   │                  └──────────┬───────────┘        └────────────────┘
   │  win % ◄────────────────────┤ HTTP
   │                  ┌──────────▼───────────┐
   └──────────────────┤  FastAPI ML service  │
                      │  pipe.pkl inference  │
                      └──────────────────────┘
```

## The ML model

A logistic-regression pipeline (`OneHotEncoder` on `batting_team`, `bowling_team`, `city` + passthrough numerics) trained on every recorded 2nd-innings chase. It predicts the probability that the **batting team** completes the chase.

- **Accuracy:** ~81.5% on a held-out test split
- **Features (exact order):** `batting_team`, `bowling_team`, `city`, `runs_left`, `balls_left`, `wickets_left`, `target`, `crr`, `rrr`
- The OneHotEncoder lives **inside** the saved pipeline, so the serving code passes raw strings and the same transformer that trained the model also transforms requests — guaranteeing no train/serve skew at the encoding step.

### Train/serve skew guard

The model learns from *engineered* features (`runs_left`, `crr`, `rrr`, …), computed by formulas. Those formulas live in **one** shared Python module (`backend-ml/features.py`), imported by both the training pipeline and the FastAPI service. If training and serving computed features differently, the model would receive inputs that don't match what it learned from — a silent, hard-to-spot bug. One source of truth makes that impossible, and `backend-ml/tests/check_parity.py` asserts the two paths agree.

### Training pipeline

Training is a lightweight, staged pipeline (`ingest → clean → features → train → evaluate`) in plain Python, driven by `config.yaml`. It's deliberately *not* heavyweight MLOps tooling — that weight belongs to a project whose focus is the ML lifecycle, whereas this project's focus is the product. See `backend-ml/README.md`.

## Analytics (the historical layer)

Computed live from MongoDB via aggregation pipelines over ~261k deliveries:

- Team standings (wins by franchise, with old names normalized to current ones)
- Head-to-head record between any two teams
- All-time top run-scorers (with strike rate) and wicket-takers (bowler-credited only)
- Per-venue average first-innings totals
- Matches per season, and the classic toss→win correlation

## Quick start

Each service has its own README with details. The fast path:

```bash
# 1. ML service
cd backend-ml
pip install -r requirements.txt
uvicorn main:app --reload --port 8002

# 2. Node backend (in a new terminal)
cd backend-node
cp .env.example .env          # then fill in MONGODB_URI + JWT secrets
npm install
# place matches.csv + deliveries.csv in ./data, then:
npm run seed                  # one-time: load CSVs into MongoDB
npm run dev

# 3. Frontend (in a new terminal)
cd frontend-react
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

Or run everything with Docker (after filling in `backend-node/.env`):

```bash
docker compose up --build
```

See **[SETUP.md](./SETUP.md)** for the full walkthrough: MongoDB Atlas, environment variables, and deploying to Vercel (frontend) + Render (both backends).

## Ports

| Service | Port |
| --- | --- |
| Frontend (Vite dev) | 5173 |
| Node backend | 8001 |
| FastAPI ML | 8002 |

(Deliberately not 8000, so this runs alongside other local projects.)

---

Built by Nilambar Mandal.
