/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Poppins"', "system-ui", "-apple-system", "sans-serif"],
        display: ['"Montserrat"', "system-ui", "sans-serif"],
      },
      colors: {
        navy: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#1e293b",
          800: "#0f172a",
          900: "#020617",
          950: "#010312",
        },
      },
    },
  },
  plugins: [],
};