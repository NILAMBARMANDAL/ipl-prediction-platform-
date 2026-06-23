import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { TEAMS, CITIES } from "../constants.js";
import WinBar from "../components/WinBar.jsx";
export default function Predictor() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    battingTeam: "Mumbai Indians",
    bowlingTeam: "Chennai Super Kings",
    city: "Mumbai",
    target: "",
    currentScore: "",
    overs: "",
    wickets: "",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    
    if (form.battingTeam === form.bowlingTeam) {
      setError("Batting and bowling teams must be different.");
      return;
    }
    if (Number(form.currentScore) >= Number(form.target)) {
      setError("Current score is already at/above target — chase is complete.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/predict", {
        battingTeam: form.battingTeam,
        bowlingTeam: form.bowlingTeam,
        city: form.city,
        target: Number(form.target),
        currentScore: Number(form.currentScore),
        overs: Number(form.overs),
        wickets: Number(form.wickets),
      });
      setResult(data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not reach the prediction service. Is the ML backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm({
      battingTeam: "Mumbai Indians",
      bowlingTeam: "Chennai Super Kings",
      city: "Mumbai",
      target: "",
      currentScore: "",
      overs: "",
      wickets: "",
    });
    setResult(null);
    setError("");
  };

  return (
    <div className="max-w-5xl mx-auto px-5 py-12">
      <div className="mb-8">
        <p className="eyebrow mb-2">2nd innings · chase calculator</p>
        <h1 className="font-display font-bold text-4xl sm:text-5xl tracking-tight">
          Win Probability Predictor
        </h1>
        <p className="text-muted mt-2 max-w-2xl">
          Enter the live match situation during a run chase. The model estimates
          the batting team's chance of getting over the line, trained on 17
          seasons of ball-by-ball data.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <form onSubmit={submit} className="panel p-6 lg:col-span-3 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Batting team</label>
              <select
                className="field"
                value={form.battingTeam}
                onChange={set("battingTeam")}
              >
                {TEAMS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Bowling team</label>
              <select
                className="field"
                value={form.bowlingTeam}
                onChange={set("bowlingTeam")}
              >
                {TEAMS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">Host city</label>
            <select className="field" value={form.city} onChange={set("city")}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Target</label>
              <input
                className="field font-mono"
                type="number"
                placeholder="e.g. 180"
                value={form.target}
                onChange={set("target")}
                min="1"
              />
            </div>
            <div>
              <label className="field-label">Current score</label>
              <input
                className="field font-mono"
                type="number"
                placeholder="e.g. 95"
                value={form.currentScore}
                onChange={set("currentScore")}
                min="0"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Overs done (e.g. 10.3)</label>
              <input
                className="field font-mono"
                type="number"
                step="0.1"
                placeholder="e.g. 10.3"
                value={form.overs}
                onChange={set("overs")}
                min="0.1"
                max="19.5"
              />
            </div>
            <div>
              <label className="field-label">Wickets fallen</label>
              <input
                className="field font-mono"
                type="number"
                placeholder="0 - 10"
                value={form.wickets}
                onChange={set("wickets")}
                min="0"
                max="10"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-loss/40 bg-loss/10 px-4 py-3 text-loss text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="btn-ball px-6 py-3 flex-1"
            >
              {loading ? "Analyzing…" : "Predict win %"}
            </button>
            <button type="button" onClick={reset} className="btn-ghost px-5 py-3">
              Reset
            </button>
          </div>
        </form>

        {/* Result */}
        <div className="panel p-6 lg:col-span-2 flex flex-col">
          <p className="eyebrow mb-4">Diagnostic</p>
          {result ? (
            <div className="flex-1 flex flex-col gap-6">
              <WinBar
                battingTeam={result.battingTeam}
                bowlingTeam={result.bowlingTeam}
                winPct={result.winProbability}
              />
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <Metric label="Runs left" value={result.features.runsLeft} />
                <Metric label="Balls left" value={result.features.ballsLeft} />
                <Metric label="Wkts left" value={result.features.wicketsLeft} />
                <Metric
                  label="Req. RR"
                  value={result.features.rrr.toFixed(2)}
                />
         <Metric
                  label="Curr. RR"
                  value={result.features.crr.toFixed(2)}
                  span
                />
              </div>

              {/* Auth payoff: tell logged-in users it was saved, and nudge
                  anonymous users that signing in would save their history. */}
              {result.saved ? (
                <div className="rounded-xl border border-win/30 bg-win/10 px-4 py-2.5 text-win text-sm flex items-center gap-2">
                  <span>✓</span> Saved to your history — view it on the dashboard.
                </div>
              ) : (
                <div className="rounded-xl border border-line bg-night px-4 py-2.5 text-muted text-sm">
                  <Link to="/login" className="text-ball hover:text-ballHi">
                    Sign in
                  </Link>{" "}
                  to save your predictions and review them later.
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 grid place-items-center text-center">
              <div>
                <div className="w-14 h-14 mx-auto rounded-full border-2 border-line border-t-ball animate-spin-slow mb-4" />
                <p className="font-display uppercase tracking-wide text-muted">
                  Awaiting match state
                </p>
                <p className="text-sm text-muted/70 mt-1">
                  Fill the form and hit predict
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, span }) {
  return (
    <div className={`bg-night rounded-xl border border-line p-3 ${span ? "col-span-2" : ""}`}>
      <div className="eyebrow mb-1">{label}</div>
      <div className="stat text-2xl text-flood">{value}</div>
    </div>
  );
}
