/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // bKash brand pink and a supporting deep magenta.
        bkash: {
          DEFAULT: '#E2136E',
          dark: '#B70E58',
          deep: '#8A0A43',
          tint: '#FDE7F1',
        },
        ink: {
          DEFAULT: '#151320',
          soft: '#5A5670',
          faint: '#8E8AA0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(21,19,32,0.04), 0 8px 24px rgba(21,19,32,0.06)',
        pop: '0 12px 40px rgba(226,19,110,0.18)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
