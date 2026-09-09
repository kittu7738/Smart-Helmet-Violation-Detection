/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#080c14',
          panel: '#0d1527',
          surface: '#131f37',
          border: '#1f2e4d',
          accent: '#00f2fe',
          teal: '#00ffcc',
          blue: '#3b82f6',
          warning: '#f59e0b',
          danger: '#ef4444',
          text: '#f1f5f9',
          muted: '#94a3b8'
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 15px -3px rgba(0, 242, 254, 0.3)',
        'neon-teal': '0 0 15px -3px rgba(0, 255, 204, 0.3)',
        'neon-red': '0 0 15px -3px rgba(239, 68, 68, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2.5s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
}
