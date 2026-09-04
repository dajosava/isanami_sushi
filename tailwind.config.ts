import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sumi: {
          1: "#120a0d",
          2: "#1c1013",
          3: "#25141a",
          700: "#3d2a28",
          800: "#2a1c1a",
          900: "#120a0d",
        },
        washi: {
          DEFAULT: "#f4ecdf",
          dim: "#e7dcc9",
          50: "#f4ecdf",
          100: "#efe6d6",
          200: "#e7dcc9",
        },
        vermillion: {
          DEFAULT: "#c8402f",
          deep: "#9c2e21",
        },
        sakura: {
          DEFAULT: "#eec3cc",
          deep: "#dc8fa0",
          50: "#fbf3f5",
          100: "#f6e6ea",
          200: "#eec3cc",
          300: "#e5a9b5",
          400: "#dc8fa0",
          500: "#c8402f",
          600: "#9c2e21",
        },
        gold: {
          DEFAULT: "#c9a35c",
          dim: "#8a743f",
        },
        ink: "#2a1c1a",
        wasabi: {
          400: "#8fae5d",
          500: "#6f9148",
        },
        umeboshi: {
          400: "#d45a42",
          500: "#c8402f",
          600: "#9c2e21",
          700: "#7a2419",
        },
        aizome: {
          500: "#2c4a63",
          600: "#213a4e",
          700: "#182b3b",
        },
      },
      fontFamily: {
        sans: ["Zen Maru Gothic", "sans-serif"],
        display: ["Shippori Mincho", "serif"],
      },
      keyframes: {
        "soft-sway": {
          "0%, 100%": { transform: "rotate(-1.2deg)" },
          "50%": { transform: "rotate(1.2deg)" },
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
        "logo-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.04)", opacity: "0.92" },
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
        "soft-sway": "soft-sway 7s ease-in-out infinite",
        "fade-up": "fade-up 0.7s ease-out both",
        "fade-in": "fade-in 0.35s ease-out both",
        "logo-enter": "logo-enter 0.9s ease-out both",
        "logo-pulse": "logo-pulse 1.6s ease-in-out infinite",
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
      boxShadow: {
        lacquer: "0 8px 28px rgba(156, 46, 33, 0.35)",
        washi: "0 10px 36px rgba(18, 10, 13, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
