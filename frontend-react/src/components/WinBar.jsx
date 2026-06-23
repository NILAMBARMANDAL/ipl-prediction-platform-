import { TEAM_SHORT } from "../constants.js";

// WinBar: the signature element. A horizontal bar split between the two teams'
// win probabilities, styled like a live TV broadcast graphic. The fill animates
// when the probability changes, which makes "Predict" feel alive.
export default function WinBar({ battingTeam, bowlingTeam, winPct }) {
  const batShort = TEAM_SHORT[battingTeam] || battingTeam;
  const bowlShort = TEAM_SHORT[bowlingTeam] || bowlingTeam;
  const batting = Math.round(winPct);
  const bowling = 100 - batting;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 font-display uppercase tracking-wide">
        <div className="flex items-center gap-2">
          <span className="text-win text-lg font-bold">{batShort}</span>
          <span className="text-muted text-xs">batting</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted text-xs">bowling</span>
          <span className="text-loss text-lg font-bold">{bowlShort}</span>
        </div>
      </div>

      <div className="relative h-12 rounded-xl overflow-hidden border border-line bg-night flex">
        <div
          className="h-full flex items-center justify-start pl-3 transition-[width] duration-700 ease-out"
          style={{
            width: `${batting}%`,
            background:
              "linear-gradient(90deg, rgba(61,220,151,0.35), rgba(61,220,151,0.18))",
          }}
        >
          <span className="font-mono font-bold text-win text-lg drop-shadow">
            {batting}%
          </span>
        </div>
        <div
          className="h-full flex items-center justify-end pr-3 transition-[width] duration-700 ease-out"
          style={{
            width: `${bowling}%`,
            background:
              "linear-gradient(90deg, rgba(255,107,107,0.18), rgba(255,107,107,0.35))",
          }}
        >
          <span className="font-mono font-bold text-loss text-lg drop-shadow">
            {bowling}%
          </span>
        </div>

        {/* Center divider line */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-line/60" />
      </div>
    </div>
  );
}
