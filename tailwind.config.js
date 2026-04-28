/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cerdik: {
          primary: "#6C63FF",
          secondary: "#43D9AD",
          accent: "#FF6B6B",
          warning: "#FFB347",
          background: "#F8F9FF",
          card: "#FFFFFF",
          textPrimary: "#1A1A2E",
          textSecondary: "#64748B",
        },
      },
    },
  },
  plugins: [],
};
