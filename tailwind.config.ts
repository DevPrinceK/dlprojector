import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        gold: {
          50: "#fff8e1",
          100: "#ffedb2",
          300: "#e6bf5a",
          500: "#c79a22",
          700: "#8a6816"
        },
        navy: {
          900: "#071426",
          800: "#0a1d35",
          700: "#102b4f"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      fontFamily: {
        display: ["Aptos Display", "Segoe UI", "sans-serif"],
        body: ["Aptos", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        soft: "0 22px 70px rgba(2, 8, 23, 0.18)"
      },
      keyframes: {
        "loader-pulse": {
          "0%, 100%": { opacity: "0.55", transform: "scale(0.98)" },
          "50%": { opacity: "1", transform: "scale(1.02)" }
        },
        "light-sweep": {
          "0%": { transform: "translateX(-120%) rotate(12deg)" },
          "100%": { transform: "translateX(220%) rotate(12deg)" }
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        }
      },
      animation: {
        "loader-pulse": "loader-pulse 2.8s ease-in-out infinite",
        "light-sweep": "light-sweep 4s ease-in-out infinite",
        "slide-up": "slide-up 480ms ease-out both",
        "fade-in": "fade-in 320ms ease-out both"
      }
    }
  },
  plugins: []
};

export default config;
