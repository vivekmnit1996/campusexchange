/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'brutal-yellow': '#FEF08A',
        'brutal-pink': '#FF6B97',
        'brutal-mint': '#6EE7B7',
        'brutal-cyan': '#67E8F9',
        'brutal-lavender': '#C4B5FD',
        'brutal-blue': '#5B85FA',
        // Sexy Dark Theme Cyber Colors
        'cyber-black': '#090A10',
        'cyber-surface': '#121522',
        'cyber-elevated': '#1A1E30',
        'cyber-pink': '#FF2A85',
        'cyber-cyan': '#00F0FF',
        'cyber-lime': '#00FF87',
        'cyber-yellow': '#FFE600',
        'cyber-purple': '#B026FF',
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px 0px #000000',
        'brutal': '4px 4px 0px 0px #000000',
        'brutal-lg': '6px 6px 0px 0px #000000',
        'brutal-xl': '8px 8px 0px 0px #000000',
        'cyber-glow-pink': '0px 0px 15px rgba(255, 42, 133, 0.4)',
        'cyber-glow-cyan': '0px 0px 15px rgba(0, 240, 255, 0.4)',
        'cyber-glow-lime': '0px 0px 15px rgba(0, 255, 135, 0.4)',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
