import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#05070d",
          soft: "#0b0f1a",
          card: "#11172a",
          elevated: "#161d33",
        },
        accent: {
          DEFAULT: "#3b82f6",
          soft: "#60a5fa",
          dim: "#1d4ed8",
        },
        border: "#1f2740",
        muted: "#7c88a8",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.35rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 8px 30px -10px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(59,130,246,0.25), 0 8px 24px -8px rgba(59,130,246,0.35)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { "0%": { opacity: "0", transform: "scale(0.96)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        "slide-up": { "0%": { transform: "translateY(100%)" }, "100%": { transform: "translateY(0)" } },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "scale-in": "scale-in 0.18s ease-out",
        "slide-up": "slide-up 0.25s cubic-bezier(0.32,0.72,0,1)",
      },
    },
  },
  plugins: [],
};

export default config;
