/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF1F1',
          100: '#FFE0E1',
          200: '#FFC4C6',
          500: '#E8303B',
          600: '#D41F2B',
          700: '#B01520',
          800: '#8A111A',
        },
        ink: { 900: '#241A1B', 700: '#4A3E3F', 500: '#7B6E6F', 300: '#B9AEAF' },
        night: { 900: '#1A1415', 800: '#241A1B', 700: '#2E2425' },
        paper: { 50: '#FFFFFF', 100: '#FBF8F7', 200: '#F3EDEC', 300: '#E8DEDC' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(36,26,27,.04), 0 6px 20px -8px rgba(36,26,27,.10)',
        lift: '0 2px 4px rgba(36,26,27,.05), 0 14px 30px -12px rgba(36,26,27,.18)',
      },
    },
  },
  plugins: [],
};
