/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official Bannari Amman Institute of Technology (BIT) Branding Palette
        bit: {
          50: '#f0f4ff',
          100: '#dbe4fe',
          200: '#bfd0fd',
          300: '#93b1fb',
          400: '#608bf7',
          500: '#3b65ef',
          600: '#2548e3',
          700: '#1b357d', // Primary Official BIT Royal Blue (Logo Omega Arch)
          800: '#162a63', // Deep Institutional BIT Navy
          900: '#121f47', // BIT Dark Navy
          950: '#0a1129', // BIT Midnight
        },
        gold: {
          50: '#fffdf2',
          100: '#fef9c3',
          200: '#feef8a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#c59b27', // Official BIT Logo Inner Cube Gold
          700: '#a17a16', // BIT Warm Gold Accent
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        navy: {
          800: '#162a63',
          900: '#121f47',
          950: '#0a1129',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      perspective: {
        '1000': '1000px',
      }
    },
  },
  plugins: [],
}
