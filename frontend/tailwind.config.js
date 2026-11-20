/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#070b14',
        card: 'rgba(15, 23, 42, 0.75)',
        cardBorder: 'rgba(56, 189, 248, 0.2)',
        primary: {
          blue: '#3b82f6',
          cyan: '#06b6d4',
          emerald: '#10b981',
          rose: '#f43f5e',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(59, 130, 246, 0.5)',
        'glow-green': '0 0 25px -5px rgba(16, 185, 129, 0.5)',
        'glow-red': '0 0 25px -5px rgba(244, 63, 94, 0.5)',
      }
    },
  },
  plugins: [],
}
