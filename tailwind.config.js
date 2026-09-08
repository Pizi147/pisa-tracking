/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './web/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#080f16', 900: '#0b141d', 850: '#0f1a24', 800: '#13212d',
          750: '#182a38', 700: '#1e3444', 600: '#2a4557', 500: '#3d5b70',
        },
        teal: {
          300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: { xl: '0.75rem', '2xl': '1rem' },
    },
  },
  plugins: [],
};
