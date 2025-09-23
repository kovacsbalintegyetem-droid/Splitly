module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        akaya: ["Akaya Kanadaka", "sans-serif"], 
        anton: ["Anton", "san-serif"],
      },
      backgroundImage: {
        'pattern': "url('/liquid-cheese.svg')", // Háttérminta betöltése
      },
    },
  },
  plugins: [],
};