/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#2563eb',
        primaryHover: '#1d4ed8',
        surface: '#ffffff',
        background: '#f8fafc',
        border: '#e2e8f0',
      }
    },
  },
  plugins: [],
}
