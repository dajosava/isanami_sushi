import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Isanami: base neutra tipo "washi" + acento indigo (ai-zome) + acento wasabi
        washi: {
          50: "#faf9f6",
          100: "#f1efe8",
          200: "#e4e0d3",
        },
        sumi: {
          700: "#2b2b2e",
          800: "#1c1c1e",
          900: "#121213",
        },
        aizome: {
          500: "#2c4a63",
          600: "#213a4e",
          700: "#182b3b",
        },
        wasabi: {
          400: "#8fae5d",
          500: "#71914a",
        },
        umeboshi: {
          400: "#d45a42",
          500: "#b3462c",
          600: "#8f3420",
          700: "#6b2416",
        },
        sakura: {
          50: "#fff5f5",
          100: "#ffe4e8",
          200: "#ffc9d4",
          300: "#f5a3b5",
          400: "#e87a90",
          500: "#c94b66",
          600: "#a8324c",
        },
      },
      keyframes: {
        "petal-fall": {
          "0%": { transform: "translateY(-10vh) translateX(0) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "1" },
          "100%": { transform: "translateY(110vh) translateX(40px) rotate(360deg)", opacity: "0.2" },
        },
        "soft-sway": {
          "0%, 100%": { transform: "rotate(-1.5deg)" },
          "50%": { transform: "rotate(1.5deg)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "logo-enter": {
          "0%": { opacity: "0", transform: "scale(0.88)" },
          "60%": { opacity: "1", transform: "scale(1.04)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "shimmer-bar": {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(380%)" },
        },
        "bounce-dot": {
          "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.45" },
          "40%": { transform: "translateY(-6px)", opacity: "1" },
        },
      },
      animation: {
        "petal-fall": "petal-fall linear infinite",
        "soft-sway": "soft-sway 6s ease-in-out infinite",
        "fade-up": "fade-up 0.7s ease-out both",
        "fade-in": "fade-in 0.35s ease-out both",
        "logo-enter": "logo-enter 0.9s ease-out both",
        "shimmer-bar": "shimmer-bar 1.4s ease-in-out infinite",
        "bounce-dot": "bounce-dot 1.2s ease-in-out infinite",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};

export default config;
