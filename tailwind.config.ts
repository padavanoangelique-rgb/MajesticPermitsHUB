import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0B1F3F",
          hover: "#152C56",
          50: "#F0F4F8",
          100: "#D9E2EC",
          900: "#0B1F3F",
        },
        gold: {
          DEFAULT: "#C9A24B",
          light: "#E0C878",
          dark: "#A68535",
        },
        surface: {
          light: "#F7F8FA",
          dark: "#111827",
        },
        background: {
          light: "#FFFFFF",
          dark: "#0A0F1C",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(11, 31, 63, 0.08)",
        "soft-lg": "0 10px 40px -4px rgba(11, 31, 63, 0.12)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
