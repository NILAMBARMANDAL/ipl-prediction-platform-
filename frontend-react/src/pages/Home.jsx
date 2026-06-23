import { Link } from "react-router-dom";

// Home: the hero opens with the most characteristic thing in cricket — a live
// scoreboard moment frozen mid-chase, with the win-probability split as the
// thesis of the whole product.
export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <p className="eyebrow mb-4">17 seasons · 260,920 deliveries</p>
            <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[0.95]">
              Read the game
              <br />
              <span className="text-ball">before it ends.</span>
            </h1>
            <p className="text-muted text-lg mt-5 max-w-md">
              A win-probability engine and analytics platform built on the full
              history of the IPL. Live model inference, ball-by-ball aggregation,
              one clean dashboard.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/predictor" className="btn-ball px-7 py-3.5 text-base">
                Try the predictor
              </Link>
              <Link to="/dashboard" className="btn-ghost px-7 py-3.5 text-base">
                Explore analytics
              </Link>
            </div>
          </div>

          {/* Frozen scoreboard moment */}
          <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="panel p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <span className="eyebrow">Live · 2nd innings</span>
                <span className="font-mono text-xs text-win flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-win animate-pulse" />
                  model online
                </span>
              </div>

              <div className="flex items-end justify-between mb-1">
                <div>
                  <div className="font-display font-bold text-2xl">
                    MI <span className="text-muted text-base">need</span> 48
                  </div>
                  <div className="text-muted text-sm font-mono">
                    off 30 balls · 6 wkts left
                  </div>
                </div>
                <div className="text-right">
                  <div className="stat text-4xl text-flood">132/4</div>
                  <div className="text-muted text-xs font-mono">target 180</div>
                </div>
              </div>

              {/* Win split */}
              <div className="mt-5 h-11 rounded-xl overflow-hidden border border-line flex">
                <div
                  className="h-full flex items-center pl-3 font-mono font-bold text-win"
                  style={{
                    width: "64%",
                    background:
                      "linear-gradient(90deg, rgba(61,220,151,0.35), rgba(61,220,151,0.15))",
                  }}
                >
                  MI 64%
                </div>
                <div
                  className="h-full flex items-center justify-end pr-3 font-mono font-bold text-loss flex-1"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(255,107,107,0.15), rgba(255,107,107,0.35))",
                  }}
                >
                  36% CSK
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <MiniStat label="Req. RR" value="9.60" />
                <MiniStat label="Curr. RR" value="8.80" />
                <MiniStat label="Pressure" value="High" accent />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="max-w-6xl mx-auto px-5 py-12">
        <div className="grid md:grid-cols-3 gap-5">
          <Feature
            title="Live ML inference"
            body="A logistic-regression pipeline trained on every recorded chase, served from an isolated FastAPI microservice and called in real time."
            tag="FastAPI · scikit-learn"
          />
          <Feature
            title="Deep aggregation"
            body="Head-to-head records, venue scoring patterns, and all-time leaderboards computed live from MongoDB over 260k deliveries."
            tag="MongoDB · Express"
          />
          <Feature
            title="Built to scale"
            body="A clean service split: Node owns the app and data layer, Python owns the model. Streaming data ingestion, secure cookie auth."
            tag="React · Node · Docker"
          />
        </div>
      </section>

      {/* Architecture strip */}
      <section className="max-w-6xl mx-auto px-5 py-12">
        <div className="panel p-8">
          <p className="eyebrow mb-6 text-center">How a prediction flows</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-2 font-mono text-sm">
            <Node label="React form" sub="match state" />
            <Arrow />
            <Node label="Node / Express" sub="cricket math → features" accent />
            <Arrow />
            <Node label="FastAPI" sub="model.predict_proba" />
            <Arrow />
            <Node label="Win %" sub="back to the UI" />
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div className="bg-night rounded-lg border border-line p-2.5 text-center">
      <div className="eyebrow text-[10px] mb-0.5">{label}</div>
      <div className={`font-mono font-bold ${accent ? "text-ball" : "text-flood"}`}>
        {value}
      </div>
    </div>
  );
}

function Feature({ title, body, tag }) {
  return (
    <div className="panel p-6 hover:border-line/80 hover:bg-panelHi/30 transition group">
      <h3 className="font-display font-bold text-xl mb-2 group-hover:text-ball transition">
        {title}
      </h3>
      <p className="text-muted text-sm leading-relaxed mb-4">{body}</p>
      <span className="font-mono text-xs text-ball/80 tracking-wide">{tag}</span>
    </div>
  );
}

function Node({ label, sub, accent }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-center min-w-[140px] ${
        accent ? "border-ball/50 bg-ball/5" : "border-line bg-night"
      }`}
    >
      <div className={`font-display font-semibold ${accent ? "text-ball" : "text-flood"}`}>
        {label}
      </div>
      <div className="text-muted text-xs mt-0.5">{sub}</div>
    </div>
  );
}

function Arrow() {
  return <span className="text-line text-xl rotate-90 md:rotate-0">→</span>;
}
