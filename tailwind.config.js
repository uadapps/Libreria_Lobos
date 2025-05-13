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
      },
      animation: {
        'slide-left': 'slide-left 1s forwards',
        'slide-right': 'slide-right 1s forwards',
      },
    },
  },
  plugins: [],
};
