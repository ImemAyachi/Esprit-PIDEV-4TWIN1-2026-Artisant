/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-teal': '#2D5A5A',
        'brand-orange': '#A66E4E',
        'brand-cream': '#FDFCFB',
        'brand-slate': '#1A2F2F',
      },
    },
  },
};

