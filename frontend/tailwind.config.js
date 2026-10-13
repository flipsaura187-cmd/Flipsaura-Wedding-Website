/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff5f9",
          100: "#ffe6f0",
          200: "#ffd0e2",
          300: "#ffb3d1",
          400: "#ff8ab8",
          500: "#ff5fa0",
          600: "#e63f87",
          700: "#b32a68",
        },
        wine: "#8B1E3F",
        gold: "#d4af7a",
        ink: "#2a1726",
        muted: "#7a6470",
        line: "#f3d9e4",
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Segoe UI'", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        theme: "14px",
      },
      boxShadow: {
        theme: "0 8px 28px rgba(230, 63, 135, .12)",
      },
      maxWidth: {
        container: "1180px",
      },
    },
  },
  plugins: [],
};
