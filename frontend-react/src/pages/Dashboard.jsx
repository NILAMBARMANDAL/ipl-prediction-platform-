import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import api from "../services/api.js";
import useAnalytics from "../hooks/useAnalytics.js";
import { TEAMS, TEAM_SHORT } from "../constants.js";

// Shared tooltip styling for the dark theme.
const tooltipStyle = {
  contentStyle: {
    background: "#131C2E",
    border: "1px solid #243049",
    borderRadius: "12px",
    color: "#EAF2FF",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: "12px",
  },
  cursor: { fill: "rgba(244,163,34,0.08)" },
};

export default function Dashboard() {
  const overview = useAnalytics("/overview");
  const standings = useAnalytics("/team-standings");
  const batsmen = useAnalytics("/top-batsmen?limit=10");
  const bowlers = useAnalytics("/top-bowlers?limit=10");
  const seasons = useAnalytics("/season-trend");

  return (
    <div className="max-w-6xl mx-auto px-5 py-12 space-y-10">
      <header>
        <p className="eyebrow mb-2">Historical intelligence</p>
        <h1 className="font-display font-bold text-4xl sm:text-5xl tracking-tight">
          IPL Analytics Dashboard
        </h1>
        
      </header>

      {/* Overview stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Matches"
          value={overview.data?.totalMatches}
          loading={overview.loading}
        />
        <StatCard
          label="Deliveries"
          value={overview.data?.totalDeliveries?.toLocaleString()}
          loading={overview.loading}
        />
        <StatCard
          label="Seasons"
          value={overview.data?.totalSeasons}
          loading={overview.loading}
        />
        <StatCard
          label="Toss → Win"
          value={overview.data ? `${overview.data.tossWinPct}%` : null}
          loading={overview.loading}
          hint="how often the toss-winner won"
        />
      </section>

      {/* Head to head */}
      <HeadToHead />

      {/* Standings + season trend */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartPanel title="Titles race · wins by team" state={standings}>
          {standings.data && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={standings.data.map((d) => ({
                  team: TEAM_SHORT[d.team] || d.team.split(" ")[0],
                  wins: d.wins,
                }))}
                margin={{ top: 8, right: 8, bottom: 8, left: -16 }}
              >
                <XAxis
                  dataKey="team"
                  tick={{ fill: "#8595B0", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  axisLine={{ stroke: "#243049" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8595B0", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="wins" fill="#F4A322" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="Matches per season" state={seasons}>
          {seasons.data && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={seasons.data}
                margin={{ top: 8, right: 8, bottom: 8, left: -16 }}
              >
                <CartesianGrid stroke="#243049" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="season"
                  tick={{ fill: "#8595B0", fontSize: 10, fontFamily: "JetBrains Mono" }}
                  axisLine={{ stroke: "#243049" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "#8595B0", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="matches"
                  stroke="#3DDC97"
                  strokeWidth={2.5}
                  dot={{ fill: "#3DDC97", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
      </div>

      {/* Top players */}
      <div className="grid lg:grid-cols-2 gap-6">
        <LeaderTable
          title="Most runs · all-time"
          state={batsmen}
          rows={batsmen.data}
          cols={[
            { key: "batter", label: "Batsman" },
            { key: "runs", label: "Runs", mono: true },
            { key: "strikeRate", label: "SR", mono: true },
          ]}
        />
        <LeaderTable
          title="Most wickets · all-time"
          state={bowlers}
          rows={bowlers.data}
          cols={[
            { key: "bowler", label: "Bowler" },
            { key: "wickets", label: "Wkts", mono: true },
          ]}
        />
      </div>

      {/* The logged-in user's saved predictions — the payoff for signing in. */}
      <MyPredictions />
    </div>
  );
}

// MyPredictions: fetches and shows the current user's saved prediction history.
// This section only appears on the dashboard (which is already login-gated), so
// by the time it renders we know there's a logged-in user.
function MyPredictions() {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api
      .get("/predict/history")
      .then((res) => {
        if (alive) setRows(res.data.data);
      })
      .catch((err) => {
        if (alive) setError(err.response?.data?.message || "Could not load history");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="panel p-6">
      <p className="eyebrow mb-5">Your recent predictions</p>
      {loading ? (
        <div className="h-24 grid place-items-center font-mono text-muted/50 text-sm animate-pulse">
          Loading…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-loss/40 bg-loss/10 px-4 py-3 text-loss text-sm">
          {error}
        </div>
      ) : rows && rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left eyebrow pb-2">Matchup</th>
                <th className="text-left eyebrow pb-2">Situation</th>
                <th className="text-right eyebrow pb-2">Batting win %</th>
                <th className="text-right eyebrow pb-2">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p._id}
                  className="border-b border-line/40 last:border-0 hover:bg-panelHi/40 transition"
                >
                  <td className="py-2.5 text-flood">
                    {TEAM_SHORT[p.battingTeam] || p.battingTeam}
                    <span className="text-muted"> v </span>
                    {TEAM_SHORT[p.bowlingTeam] || p.bowlingTeam}
                  </td>
                  <td className="py-2.5 font-mono text-muted text-sm">
                    {p.currentScore}/{p.wickets} · {p.overs} ov · chasing {p.target}
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-win">
                    {p.winProbability}%
                  </td>
                  <td className="py-2.5 text-right font-mono text-muted text-xs">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-muted text-sm py-4">
          No predictions yet. Head to the{" "}
          <a href="/predictor" className="text-ball hover:text-ballHi">
            predictor
          </a>{" "}
          and make one — it'll show up here.
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value, loading, hint }) {
  return (
    <div className="panel p-5">
      <div className="eyebrow mb-2">{label}</div>
      <div className="stat text-3xl sm:text-4xl text-flood">
        {loading ? <span className="text-muted/40">—</span> : value ?? "—"}
      </div>
      {hint && <div className="text-xs text-muted/70 mt-1">{hint}</div>}
    </div>
  );
}

function ChartPanel({ title, state, children }) {
  return (
    <div className="panel p-6">
      <p className="eyebrow mb-5">{title}</p>
      {state.loading ? (
        <Skeleton />
      ) : state.error ? (
        <ErrorBox msg={state.error} />
      ) : (
        children
      )}
    </div>
  );
}

function LeaderTable({ title, state, rows, cols }) {
  return (
    <div className="panel p-6">
      <p className="eyebrow mb-5">{title}</p>
      {state.loading ? (
        <Skeleton />
      ) : state.error ? (
        <ErrorBox msg={state.error} />
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left eyebrow pb-2 w-8">#</th>
              {cols.map((c) => (
                <th
                  key={c.key}
                  className={`eyebrow pb-2 ${c.mono ? "text-right" : "text-left"}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.map((r, i) => (
              <tr
                key={i}
                className="border-b border-line/40 last:border-0 hover:bg-panelHi/40 transition"
              >
                <td className="py-2.5 font-mono text-muted text-sm">{i + 1}</td>
                {cols.map((c) => (
                  <td
                    key={c.key}
                    className={`py-2.5 ${
                      c.mono
                        ? "text-right font-mono text-flood"
                        : "text-left text-flood"
                    }`}
                  >
                    {r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Head-to-head interactive tool: pick two teams, fetch their record.
function HeadToHead() {
  const [t1, setT1] = useState("Mumbai Indians");
  const [t2, setT2] = useState("Chennai Super Kings");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetch = async () => {
    if (t1 === t2) {
      setError("Pick two different teams.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/analytics/head-to-head", {
        params: { team1: t1, team2: t2 },
      });
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load head-to-head");
    } finally {
      setLoading(false);
    }
  };

  const total = data?.totalMatches || 0;
  const p1 = total ? (data.team1Wins / total) * 100 : 50;

  return (
    <section className="panel p-6">
      <p className="eyebrow mb-5">Head to head</p>
      <div className="grid sm:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end">
        <div>
          <label className="field-label">Team A</label>
          <select className="field" value={t1} onChange={(e) => setT1(e.target.value)}>
            {TEAMS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="hidden sm:grid place-items-center pb-3 font-display text-muted">
          vs
        </div>
        <div>
          <label className="field-label">Team B</label>
          <select className="field" value={t2} onChange={(e) => setT2(e.target.value)}>
            {TEAMS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <button onClick={fetch} disabled={loading} className="btn-ball px-5 py-3">
          {loading ? "…" : "Compare"}
        </button>
      </div>

      {error && <p className="text-loss text-sm mt-4">{error}</p>}

      {data && !error && (
        <div className="mt-6 animate-fade-up">
          <div className="flex items-center justify-between mb-2 font-mono text-sm">
            <span className="text-ball">
              {TEAM_SHORT[data.team1]} · {data.team1Wins}
            </span>
            <span className="text-muted">{total} matches</span>
            <span className="text-flood">
              {data.team2Wins} · {TEAM_SHORT[data.team2]}
            </span>
          </div>
          <div className="h-8 rounded-lg overflow-hidden border border-line flex">
            <div
              className="h-full bg-ball/70 transition-all duration-700"
              style={{ width: `${p1}%` }}
            />
            <div className="h-full bg-panelHi flex-1" />
          </div>
        </div>
      )}
    </section>
  );
}

function Skeleton() {
  return (
    <div className="h-[260px] grid place-items-center">
      <div className="font-mono text-muted/50 text-sm animate-pulse">
        Loading…
      </div>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div className="rounded-xl border border-loss/40 bg-loss/10 px-4 py-3 text-loss text-sm">
      {msg}
    </div>
  );
}