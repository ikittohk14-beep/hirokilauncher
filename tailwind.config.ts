import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hiroki: {
          dark: '#0f1117',
          card: '#161922',
          cardHover: '#1c202c',
          border: '#262b3a',
          primary: '#3b82f6',
          primaryHover: '#2563eb',
          accent: '#8b5cf6',
          success: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
          textMuted: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
