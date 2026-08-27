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
        },
        theme: {
          canvas: 'rgb(var(--theme-canvas) / <alpha-value>)',
          ink: 'rgb(var(--theme-ink) / <alpha-value>)',
          surface: 'rgb(var(--theme-surface) / <alpha-value>)',
          section: 'rgb(var(--theme-section) / <alpha-value>)',
          'section-ink': 'rgb(var(--theme-section-ink) / <alpha-value>)'
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
