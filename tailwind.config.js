export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Quicksand", "Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Nunito", "Quicksand", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        cozy: "0 18px 45px rgba(51, 31, 61, 0.12)",
        glow: "0 16px 42px rgba(255, 147, 179, 0.25)",
      },
    },
  },
  plugins: [],
};
