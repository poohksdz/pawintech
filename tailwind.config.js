/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Prompt', 'Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563eb', // pw-primary
          soft: 'rgba(37, 99, 235, 0.1)',
          glow: 'rgba(37, 99, 235, 0.25)',
        },
        success: {
          DEFAULT: '#10b981',
          soft: 'rgba(16, 185, 129, 0.1)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          soft: 'rgba(245, 158, 11, 0.1)',
        },
        danger: {
          DEFAULT: '#ef4444',
          soft: 'rgba(239, 68, 68, 0.1)',
        },
        dark: '#1e293b',
        muted: '#64748b',
        surface: '#ffffff',
        border: '#e2e8f0',
        body: '#f8fafc',
      },
      spacing: {
        header: '70px',
        sidebar: '280px',
      },
      keyframes: {
        fadeInSteps: {
          '0%': { opacity: '0' },
          '75%': { opacity: '0.75' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          'from': { opacity: '0', transform: 'translateY(-10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        updown: {
          '0%, 100%': { transform: 'translateY(-20px)' },
          '50%': { transform: 'translateY(20px)' },
        }
      },
      animation: {
        fadeInSteps: 'fadeInSteps 0.5s ease-in-out forwards',
        fadeUp: 'fadeUp 0.5s ease-out forwards',
        fadeDown: 'fadeDown 0.5s ease-out forwards',
        slideDown: 'slideDown 0.3s ease-out',
        updown: 'updown 3s linear infinite',
      }
    },
  },
  plugins: [],
}