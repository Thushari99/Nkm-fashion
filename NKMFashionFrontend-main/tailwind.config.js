/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Adjust this path based on your project structure
  ],
  theme: {
    extend: {
      keyframes: {
        moveRight: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(20px)' },
        },
      },
      animation: {
        moveRight: 'moveRight 2s infinite',
      },
    },
  },
  plugins: [],
}