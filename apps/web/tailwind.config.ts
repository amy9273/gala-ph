import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        surface: {
          DEFAULT: "hsl(var(--surface) / <alpha-value>)",
          secondary: "hsl(var(--surface-secondary) / <alpha-value>)",
          tertiary: "hsl(var(--surface-tertiary) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        brand: {
          ocean: {
            DEFAULT: "hsl(var(--brand-ocean) / <alpha-value>)",
            glow: "var(--brand-ocean-glow)",
          },
        },
        accent: {
          sunset: {
            DEFAULT: "hsl(var(--accent-sunset) / <alpha-value>)",
            glow: "var(--accent-sunset-glow)",
          },
        },
        nature: {
          emerald: {
            DEFAULT: "hsl(var(--nature-emerald) / <alpha-value>)",
            glow: "var(--nature-emerald-glow)",
          },
        },
        travel: {
          autosweep: "hsl(var(--travel-autosweep) / <alpha-value>)",
          easytrip: "hsl(var(--travel-easytrip) / <alpha-value>)",
          commute: "hsl(var(--travel-commute) / <alpha-value>)",
          unsettled: "hsl(var(--travel-unsettled) / <alpha-value>)",
          settled: "hsl(var(--travel-settled) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        shimmer: {
          "100%": {
            transform: "translateX(100%)",
          },
        },
        beacon: {
          "0%, 100%": {
            transform: "scale(1)",
            opacity: "1",
          },
          "50%": {
            transform: "scale(1.3)",
            opacity: "0.5",
          },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite",
        beacon: "beacon 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
