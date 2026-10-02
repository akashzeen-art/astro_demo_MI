import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    screens: {
      xs: "475px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // PalmAstro brand colors
        cosmic: {
          DEFAULT: "hsl(var(--cosmic))",
          foreground: "hsl(var(--cosmic-foreground))",
        },
        mystic: {
          DEFAULT: "hsl(var(--mystic))",
          foreground: "hsl(var(--mystic-foreground))",
        },
        golden: {
          DEFAULT: "hsl(var(--golden))",
          foreground: "hsl(var(--golden-foreground))",
        },
        stellar: {
          DEFAULT: "hsl(var(--stellar))",
          foreground: "hsl(var(--stellar-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.2", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        "call-blink": {
          "0%, 100%": { opacity: "1", transform: "scale(1)", boxShadow: "0 0 12px 2px rgba(34,197,94,0.4)" },
          "50%": { opacity: "0.55", transform: "scale(0.97)", boxShadow: "0 0 4px 0 rgba(34,197,94,0.15)" },
        },
        "queue-blink": {
          "0%, 100%": { opacity: "1", transform: "scale(1)", boxShadow: "0 0 12px 2px rgba(251,191,36,0.45)" },
          "50%": { opacity: "0.5", transform: "scale(0.97)", boxShadow: "0 0 4px 0 rgba(251,191,36,0.15)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
        shimmer: "shimmer 3s ease-in-out infinite",
        twinkle: "twinkle 2s ease-in-out infinite",
        "call-blink": "call-blink 1.2s ease-in-out infinite",
        "queue-blink": "queue-blink 1.1s ease-in-out infinite",
      },
      backgroundImage: {
        "sutra-gradient":
          "linear-gradient(135deg, hsl(24 90% 50%) 0%, hsl(43 96% 56%) 50%, hsl(168 55% 38%) 100%)",
        "cosmic-gradient":
          "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(350 45% 18%) 50%, hsl(24 90% 40%) 100%)",
        "stellar-gradient":
          "linear-gradient(45deg, hsl(168 55% 38%) 0%, hsl(24 90% 50%) 50%, hsl(43 96% 56%) 100%)",
        "golden-gradient":
          "linear-gradient(135deg, hsl(var(--golden)) 0%, #f59e0b 50%, #d97706 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
