# Setup & Deployment Guide

This walks you through everything from a fresh clone to a live deployment. Follow it top to bottom the first time.

---

## Part 1 — MongoDB Atlas (free tier)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. **Create a cluster** → choose the free **M0** tier, pick a region near you, create.
3. **Database Access** (left sidebar) → *Add New Database User*:
   - Username + password (use a strong password, no special URL characters like `@ : /` to keep the connection string simple, or URL-encode them later).
   - Built-in role: *Read and write to any database*.
4. **Network Access** → *Add IP Address*:
   - For development, *Allow Access from Anywhere* (`0.0.0.0/0`). For production you'd restrict this.
5. **Connect** → *Drivers* → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your real values. **Do not** add a database name after `.net/` — the app appends `/ipl_analytics` itself.

You'll paste this into `MONGODB_URI` below.

---

## Part 2 — Environment variables

### `backend-node/.env`

Copy the example and fill it in:

```bash
cd backend-node
cp .env.example .env
```

```ini
PORT=8001

# From Atlas (Part 1), WITHOUT a trailing db name:
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net

# Your frontend's origin (exact match required because we send cookies)
CORS_ORIGIN=http://localhost:5173

# Generate two long random strings (see command below)
ACCESS_TOKEN_SECRET=paste_a_long_random_string_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=paste_a_different_long_random_string_here
REFRESH_TOKEN_EXPIRY=10d

# Where the FastAPI service lives
ML_SERVICE_URL=http://localhost:8002
```

Generate strong secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Run it twice, once for each token secret.

### `backend-ml/.env` (optional locally)

```bash
cd backend-ml
cp .env.example .env
```

```ini
MODEL_PATH=pipe.pkl
CORS_ORIGINS=http://localhost:5173,http://localhost:8001
```

### `frontend-react/.env`

```bash
cd frontend-react
cp .env.example .env
```

```ini
VITE_API_URL=http://localhost:8001/api/v1
```

---

## Part 3 — Get the data & seed MongoDB

1. Download the dataset (two CSVs: `matches.csv`, `deliveries.csv`). A common source is the [IPL Complete Dataset on Kaggle](https://www.kaggle.com/datasets/patrickb1912/ipl-complete-dataset-20082020).
2. Place both files in `backend-node/data/`.
3. Seed:
   ```bash
   cd backend-node
   npm install
   npm run seed
   ```
   You'll see progress like `deliveries: inserted 260000 rows...`. The script streams the CSV in batches, so memory stays flat even though `deliveries.csv` is ~261k rows. Re-running is safe — it clears and reloads.

---

## Part 4 — Run locally

Three terminals:

```bash
# Terminal 1 — ML service
cd backend-ml
pip install -r requirements.txt
uvicorn main:app --reload --port 8002
# check: http://localhost:8002/health  ->  {"status":"ok","model_loaded":true}

# Terminal 2 — Node backend
cd backend-node
npm run dev
# check: http://localhost:8001/api/v1/health

# Terminal 3 — Frontend
cd frontend-react
npm install
npm run dev
# open: http://localhost:5173
```

Test the full chain: open the Predictor page, enter a chase (e.g. target 180, score 132, overs 15, wickets 4), hit **Predict win %**. The request goes React → Node (computes features) → FastAPI (model) → back.

---

## Part 5 — Deployment

The three services deploy to two platforms: **both backends on Render**, the **frontend on Vercel**.

### 5a. Deploy the ML service (Render)

1. Push your repo to GitHub.
2. On [render.com](https://render.com) → *New* → *Web Service* → connect your repo.
3. Settings:
   - **Root Directory:** `backend-ml`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment variable:** `CORS_ORIGINS` = your future frontend URL + Node URL (you can update this after the other deploys). For now: `*` is acceptable to get started, then tighten.
4. Deploy. Note the URL, e.g. `https://ipl-ml.onrender.com`.

> Note: Render free instances sleep after inactivity; the first request after idle takes ~30–50s to wake. Fine for a portfolio demo.

### 5b. Deploy the Node backend (Render)

1. *New* → *Web Service* → same repo.
2. Settings:
   - **Root Directory:** `backend-node`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`
   - **Environment variables** (from your `.env`, plus the deployed ML URL):
     ```
     MONGODB_URI       = your Atlas string
     ACCESS_TOKEN_SECRET  = ...
     REFRESH_TOKEN_SECRET = ...
     ACCESS_TOKEN_EXPIRY  = 1d
     REFRESH_TOKEN_EXPIRY = 10d
     ML_SERVICE_URL    = https://ipl-ml.onrender.com   (from 5a)
     CORS_ORIGIN       = https://your-frontend.vercel.app  (from 5c — add after)
     NODE_ENV          = production
     ```
3. Deploy. Note the URL, e.g. `https://ipl-backend.onrender.com`.
4. **Seeding in production:** the easiest path is to run `npm run seed` once locally pointed at the *same* Atlas cluster (your local `.env` already uses it), so production reads the same data. You don't need to seed from Render.

### 5c. Deploy the frontend (Vercel)

1. On [vercel.com](https://vercel.com) → *Add New Project* → import the repo.
2. Settings:
   - **Root Directory:** `frontend-react`
   - **Framework Preset:** Vite (auto-detected)
   - **Environment variable:**
     ```
     VITE_API_URL = https://ipl-backend.onrender.com/api/v1
     ```
3. Deploy. Note the URL, e.g. `https://ipllab.vercel.app`.
4. **Go back to Render** (5b) and set `CORS_ORIGIN` to this exact Vercel URL, then redeploy the Node service. Also update `CORS_ORIGINS` on the ML service (5a) if you locked it down.

### 5d. The cookie cross-site note (important)

Because auth uses an httpOnly cookie and your frontend (Vercel) and backend (Render) are on different domains, the cookie must be sent cross-site. The code already handles this: in production it sets `secure: true` and `sameSite: "none"` (see `user.controller.js`). Both conditions require **HTTPS**, which Vercel and Render both provide automatically. If login seems to "not persist," confirm:
- `NODE_ENV=production` is set on the Node service
- `CORS_ORIGIN` exactly matches your Vercel URL (no trailing slash)
- You're visiting the `https://` frontend, not a preview/HTTP variant

---

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| `MongoServerError: bad auth` | Wrong username/password in `MONGODB_URI`, or special chars not URL-encoded |
| Seed hangs at 0 rows | CSVs not in `backend-node/data/`, or wrong filenames |
| Predict returns 502 | ML service not running / `ML_SERVICE_URL` wrong |
| CORS error in browser console | `CORS_ORIGIN` doesn't exactly match the frontend origin |
| Login doesn't persist in prod | See 5d — `NODE_ENV`, HTTPS, exact CORS origin |
| First prod request very slow | Render free tier waking from sleep (~30–50s); normal |
