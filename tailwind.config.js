/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sage-bg': '#191C1A',
        'sage-surface': '#242A27',
        'sage-accent': '#7CA992',
        'sage-text': '#E4EAE6',
        'sage-muted': '#9CAEA4',
      },
    },
  },
  plugins: [],
}
