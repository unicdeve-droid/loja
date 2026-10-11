/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'gazin-blue':   '#0D71F0',
        'gazin-orange': '#FF9D2E',
        'gazin-green':  '#6BB70B',
        'gazin-dark':   '#363843',
        'gazin-gray':   '#646981',
        'gazin-border': '#e8e8e8',
        'gazin-bg':     '#f5f5f5',
      },
    },
  },
  plugins: [],
}
