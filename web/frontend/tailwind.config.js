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
          dark: '#050811',
          panel: '#0a1022',
          surface: '#0f172e',
          border: '#1a2744',
          cyan: '#00E5FF',
          blue: '#1687FF',
          cobalt: '#006CFF',
          green: '#00FF9C',
          violet: '#8B5CFF',
          purple: '#B44CFF',
          amber: '#FFD400',
          orange: '#FF8A00',
          red: '#FF3158',
          pink: '#FF2A85',
          text: '#FFFFFF',
          muted: '#94A3B8'
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 20px -2px rgba(0, 229, 255, 0.45)',
        'neon-cyan-lg': '0 0 30px 2px rgba(0, 229, 255, 0.6)',
        'neon-green': '0 0 20px -2px rgba(0, 255, 156, 0.45)',
        'neon-green-lg': '0 0 30px 2px rgba(0, 255, 156, 0.6)',
        'neon-red': '0 0 20px -2px rgba(255, 49, 88, 0.5)',
        'neon-red-lg': '0 0 30px 2px rgba(255, 49, 88, 0.65)',
        'neon-purple': '0 0 20px -2px rgba(180, 76, 255, 0.45)',
        'neon-purple-lg': '0 0 30px 2px rgba(180, 76, 255, 0.6)',
        'neon-amber': '0 0 20px -2px rgba(255, 212, 0, 0.45)',
        'neon-blue': '0 0 20px -2px rgba(22, 135, 255, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2.5s linear infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: 0.8, filter: 'drop-shadow(0 0 12px rgba(0, 229, 255, 0.6))' },
          '50%': { opacity: 1, filter: 'drop-shadow(0 0 24px rgba(0, 229, 255, 0.95))' },
        }
      }
    },
  },
  plugins: [],
}
