/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBackground: '#121212',
        darkSurface: '#1E1E1E',
        darkBorder: '#333333',
        darkText: '#E0E0E0',
      }
    },
  },
  plugins: [],
}; 