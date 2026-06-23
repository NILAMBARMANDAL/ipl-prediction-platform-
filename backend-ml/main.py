

import os
import pickle

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from features import (
    FEATURE_ORDER,
    compute_match_state_features,
    overs_to_balls,
)

# --- Load the model once at startup ---
MODEL_PATH = os.getenv("MODEL_PATH", "pipe.pkl")
try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
except FileNotFoundError:
    model = None
    print(f"WARNING: {MODEL_PATH} not found. /predict returns 503 until it exists.")

app = FastAPI(
    title="IPL Win Predictor — ML Service",
    description="Computes 2nd-innings chase win probability from live match state.",
    version="2.0.0",
)

origins = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://localhost:8001"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request/response schemas ---
# The service now takes HUMAN-FRIENDLY match state. Pydantic validates ranges so
# bad input is rejected with a clean 422 before any computation.
class MatchState(BaseModel):
    batting_team: str = Field(..., example="Mumbai Indians")
    bowling_team: str = Field(..., example="Chennai Super Kings")
    city: str = Field(..., example="Mumbai")
    target: int = Field(..., gt=0, example=180)
    current_score: int = Field(..., ge=0, example=132)
    overs: float = Field(..., ge=0, lt=20, example=15.0)  # cricket notation, e.g. 10.3
    wickets: int = Field(..., ge=0, le=10, example=4)


class PredictionOutput(BaseModel):
    batting_team: str
    bowling_team: str
    win_probability: float
    loss_probability: float
    features: dict


@app.get("/")
def root():
    return {"service": "ipl-ml", "status": "ok", "model_loaded": model is not None}


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict", response_model=PredictionOutput)
def predict(state: MatchState):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded on server.")

    if state.batting_team == state.bowling_team:
        raise HTTPException(status_code=400, detail="Teams must be different.")
    if state.current_score >= state.target:
        raise HTTPException(
            status_code=400, detail="Score already at/above target — chase complete."
        )

    # --- Feature engineering via the SHARED module (training-parity guaranteed) ---
    try:
        balls_bowled = overs_to_balls(state.overs)
        derived = compute_match_state_features(
            target=state.target,
            current_score=state.current_score,
            balls_bowled=balls_bowled,
            wickets_fallen=state.wickets,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Assemble the model input row in the exact trained feature order.
    row = {
        "batting_team": state.batting_team,
        "bowling_team": state.bowling_team,
        "city": state.city,
        "target": state.target,
        **derived,  # runs_left, balls_left, wickets_left, crr, rrr
    }
    input_df = pd.DataFrame([row])[FEATURE_ORDER]

    try:
        proba = model.predict_proba(input_df)[0]
        loss_prob, win_prob = float(proba[0]), float(proba[1])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

    return PredictionOutput(
        batting_team=state.batting_team,
        bowling_team=state.bowling_team,
        win_probability=round(win_prob, 4),
        loss_probability=round(loss_prob, 4),
        features=derived,
    )
