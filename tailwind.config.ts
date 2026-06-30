import type { Config } from "tailwindcss";

// Brand tokens mirror design-system/meet/colors_and_type.css so Tailwind
// utilities and the design-system CSS variables stay in lockstep.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#004658",
        "navy-deep": "#09313C",
        teal: "#42B6B4",
        red: "#E04652",
        gray: "#6F7E84",
        cream: "#FEFBF4",
        "cream-soft": "#F4EFE5",
        "cream-edge": "#EBE6DA",
      },
      fontFamily: {
        display: ["Archer", "Georgia", "serif"],
        body: ["Proxima Nova", "Helvetica Neue", "Arial", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        pill: "999px",
      },
      letterSpacing: {
        tightish: "-0.01em",
      },
      boxShadow: {
        "meet-sm": "0 1px 2px rgba(0,0,0,0.18)",
        "meet-md": "0 4px 16px rgba(0,0,0,0.22)",
        "meet-lg": "0 12px 36px rgba(0,0,0,0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
