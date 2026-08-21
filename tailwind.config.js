/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        struktur: {
          orange: '#e64f22',
          dark: '#0A0A0A',
          gray: '#1C1C1C',
          light: '#F5F5F5',
          muted: '#8A8A8A'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
