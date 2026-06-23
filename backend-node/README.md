# IPLLab — Node Backend (API Gateway)

The primary API for IPLLab: serves historical analytics aggregated from MongoDB, handles authentication, and turns live match state into model features before calling the ML service.

## Stack

- **Node** (ES Modules) + **Express 5**
- **MongoDB** via **Mongoose**
- **JWT** access + refresh tokens in **httpOnly cookies**
- **bcryptjs** for password hashing
- **csv-parser** for streaming the dataset into MongoDB

## Architecture

\`\`\`
src/
├── controllers/    # business logic (analytics, predict, user)
├── models/         # Mongoose schemas (match, delivery, user, prediction)
├── routes/         # URL → controller mapping, mounted under /api/v1
├── middlewares/    # JWT auth guard (required + optional)
├── utils/          # asyncHandler, ApiError, ApiResponse
├── db/             # MongoDB connection
├── app.js          # Express config + central error handler
└── index.js        # bootstrap: connect DB, then listen
scripts/
└── seedIplData.js  # streams matches.csv + deliveries.csv into MongoDB
\`\`\`

The same structural conventions as a production Express service: an `asyncHandler` wrapper so controllers need no try/catch, a custom `ApiError` carrying HTTP status codes, and a uniform `ApiResponse` envelope `{ statusCode, data, message, success }`. One central error-handling middleware translates every thrown error into the right response.

## API

Base URL: `/api/v1`

### Analytics (public)
| Route | Returns |
| --- | --- |
| `GET /analytics/overview` | match/delivery/season counts + toss→win % |
| `GET /analytics/team-standings` | wins by team (names normalized) |
| `GET /analytics/head-to-head?team1=&team2=` | record between two teams |
| `GET /analytics/top-batsmen?limit=` | run-scorers with strike rate |
| `GET /analytics/top-bowlers?limit=` | wicket-takers (bowler-credited) |
| `GET /analytics/venue-stats?limit=` | per-venue avg 1st-innings score |
| `GET /analytics/season-trend` | matches per season |

### Prediction
| Route | Body | Returns |
| --- | --- | --- |
| `POST /predict` | `{ battingTeam, bowlingTeam, city, target, currentScore, overs, wickets }` | win/loss probability + engineered features |
| `GET /predict/history` | — | (protected) the logged-in user's saved predictions |

`overs` is decimal cricket notation (e.g. `10.3` = 10 overs, 3 balls). Node acts as a **gateway**: it validates the request and forwards the raw match state to the FastAPI service at `ML_SERVICE_URL`, which computes the model features (with the same code the model was trained on) and predicts. Node maps the response to camelCase for the frontend. The predictor is open to everyone; if the caller is logged in, the prediction is saved to their history.

### Auth
| Route | Notes |
| --- | --- |
| `POST /users/register` | creates user, auto-logs in |
| `POST /users/login` | sets httpOnly cookies |
| `POST /users/logout` | (protected) revokes refresh token |
| `POST /users/refresh-token` | mints a new access token |
| `GET /users/current-user` | (protected) returns the logged-in user |

## Running

\`\`\`bash
cp .env.example .env     # fill in MONGODB_URI + JWT secrets
npm install

# one-time: place matches.csv + deliveries.csv in ./data, then
npm run seed

npm run dev              # http://localhost:8001
\`\`\`

See the [root README](../README.md) for full environment variables and deployment instructions.

## CI/CD

This service is covered by the project's CI pipeline (GitHub Actions). On every push to `main`, CI installs dependencies and syntax-checks the source files; the build must pass before changes are merged. Deployment is continuous — Render is connected to the repository and automatically redeploys this service on every push to `main`.

## Notes

- **Why bcryptjs not bcrypt:** bcryptjs is pure JavaScript — no native compilation, so it installs cleanly everywhere including Render. Same API.
- **Team name normalization:** old franchise names (Delhi Daredevils, Deccan Chargers) are mapped to current ones inside the aggregation pipelines so analytics aren't split across renames.