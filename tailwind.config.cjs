const colors = require('tailwindcss/colors');

module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif']
      },
      colors: {
        night: '#05010a',
        void: '#0f0a1a',
        neon: {
          100: '#e0f4ff',
          200: '#a4f6ff',
          300: '#5af9ff',
          400: '#15f1ff',
          500: '#0fd2ff',
          600: '#00a6d6',
          700: '#007aa6',
          800: '#004e73',
          900: '#00243d'
        },
        magenta: {
          400: '#ff3fd7',
          500: '#d80baf',
          600: '#9a0082'
        },
        glitch: {
          cyan: '#00f6ff',
          pink: '#ff3fd7',
          yellow: '#ffe066'
        }
      },
      boxShadow: {
        neon: '0 0 20px rgba(0, 242, 255, 0.45)',
        panel: '0 0 10px rgba(255, 63, 215, 0.3)'
      },
      animation: {
        glitch: 'glitch 1.5s infinite',
        pulseSoft: 'pulseSoft 4s infinite',
        float: 'float 8s ease-in-out infinite'
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-4px, -4px)' },
          '60%': { transform: 'translate(4px, 2px)' },
          '80%': { transform: 'translate(-2px, -2px)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        }
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
};
