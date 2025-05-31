// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
  extend: {
  fontFamily: {
    bookstore: ['"BookStore"', 'cursive'],
  },
  transitionDuration: {
    '2000': '2000ms',
  },
  transitionDelay: {
    '1000': '1000ms',
  },
  keyframes: {
    'slide-left': {
      '0%': { transform: 'translateX(0%)' },
      '100%': { transform: 'translateX(-100%)' },
    },
    'slide-right': {
      '0%': { transform: 'translateX(0%)' },
      '100%': { transform: 'translateX(100%)' },
    },
    // 👇 Animaciones para modales
    'fade-in': {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    'fade-out': {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' },
    },
    'zoom-in-95': {
      '0%': { transform: 'scale(0.95)' },
      '100%': { transform: 'scale(1)' },
    },
    'zoom-out-95': {
      '0%': { transform: 'scale(1)' },
      '100%': { transform: 'scale(0.95)' },
    },
  },
  animation: {
    'slide-left': 'slide-left 1s forwards',
    'slide-right': 'slide-right 1s forwards',
    // 👇 Nombres que usaremos en el modal
    'fade-in': 'fade-in 0.2s ease-out forwards',
    'fade-out': 'fade-out 0.2s ease-in forwards',
    'zoom-in-95': 'zoom-in-95 0.2s ease-out forwards',
    'zoom-out-95': 'zoom-out-95 0.2s ease-in forwards',
  },
}

  },
  plugins: [],
};
