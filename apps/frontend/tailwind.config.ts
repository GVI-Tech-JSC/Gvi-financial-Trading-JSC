import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand:  { DEFAULT: "#3b82d4", dark: "#2563eb" },
        success:"#16a34a",
        danger: "#dc2626",
        warning:"#d97706",
      },
      fontFamily: { sans: ["-apple-system", "Segoe UI", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
