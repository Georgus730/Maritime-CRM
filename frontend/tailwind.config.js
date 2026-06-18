/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0EA5E9',
          hover: '#0284C7',
          active: '#0369A1',
        },
        secondary: {
          DEFAULT: '#64748B',
          hover: '#475569',
          bg: '#1E293B',
        },
        accent: {
          red: '#EF4444',
          green: '#10B981',
          amber: '#F59E0B',
        },
        maritime: {
          deep: '#020617',
          card: '#0F172A',
          sidebar: '#020617',
          border: '#1E293B',
        }
      },
      fontFamily: {
        heading: ['Barlow Condensed', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0,0,0,0.5)',
        'neon': '0 0 10px rgba(14, 165, 233, 0.3)',
      }
    },
  },
  plugins: [],
}

