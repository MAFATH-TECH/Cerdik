/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cerdik: {
          primary: "#0E5230",
          secondary: "#5E8E4A",
          tertiary: "#669647",
          accent: "#F2BD23",
          warning: "#D4A017",
          background: "#F4F8F4",
          card: "#FFFFFF",
          textPrimary: "#0E5230",
          textSecondary: "#525B59",
          danger: "#B45309",
          income: "#5E8E4A",
          expense: "#C99A12",
        },
      },
    },
  },
  plugins: [],
};
