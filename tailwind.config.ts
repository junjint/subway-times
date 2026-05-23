import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        pixel: ["var(--font-silkscreen)", "'Silkscreen'", "monospace"],
        chunky: ["var(--font-press-start)", "'Press Start 2P'", "monospace"],
      },
      colors: {
        // Official MTA subway route colors
        mta: {
          black: "#0a0a0a",
          screen: "#0b0b0b",
          panel: "#111111",
          amber: "#ffb000",
          green: "#00b85c",
          red: "#ee352e",
          blue: "#0039a6",
          orange: "#ff6319",
          yellow: "#fccc0a",
          purple: "#b933ad",
          lightgreen: "#6cbe45",
          gray: "#a7a9ac",
          brown: "#996633",
          darkgray: "#808183",
        },
      },
      keyframes: {
        "pulse-fade": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
      },
      animation: {
        "pulse-fade": "pulse-fade 1.6s ease-in-out infinite",
        flicker: "flicker 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
