import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0f14",
        panel: "#121821",
        panelAlt: "#17202b",
        border: "#2b3646",
        foreground: "#e5ebf3",
        muted: "#95a2b8",
        accent: "#56b6c2",
        success: "#58d38b",
        warning: "#e7b35f",
        danger: "#e07070"
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      }
    }
  },
  plugins: [],
};

export default config;
