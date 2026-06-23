/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // "Pitch at dusk" palette
        night: "#0B1220",      // deep night-blue background
        panel: "#131C2E",      // raised panel
        panelHi: "#1B2740",    // hover/elevated
        line: "#243049",       // hairline borders
        flood: "#EAF2FF",      // floodlight white (primary text)
        muted: "#8595B0",      // secondary text
        ball: "#F4A322",       // cricket-ball amber (single accent)
        ballHi: "#FFB838",
        win: "#3DDC97",        // win green
        loss: "#FF6B6B",       // loss red
      },
      fontFamily: {
        display: ['"Barlow Condensed"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      animation: {
        "spin-slow": "spin 2.5s linear infinite",
        "fade-up": "fadeUp 0.5s ease-out both",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
