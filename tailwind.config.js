/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F2F4F6',
        card: '#FFFFFF',
        text: {
          primary: '#111827',
          secondary: '#6B7280',
        },
        profit: '#EF4444',
        loss: '#3B82F6',
        accent: {
          green: '#10B981',
          yellow: '#F59E0B',
          purple: '#8B5CF6',
        }
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
      maxWidth: {
        'mobile': '480px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
