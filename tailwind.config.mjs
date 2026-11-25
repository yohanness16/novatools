/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#FAFAFA',
          dark: '#0B0C0F',
        },
        well: {
          DEFAULT: '#F3F4F6',
          dark: '#1A1D24',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#F8FAFC',
          sunken: '#F3F4F6',
          elevated: '#FFFFFF',
          border: '#E5E7EB',
          hairline: '#E5E7EB',
        },
        ink: {
          DEFAULT: '#111214',
          secondary: '#4B5563',
          muted: '#6B7280',
          bone: '#F3F4F6',
        },
        studio: {
          yellow: '#2563EB',
          'yellow-hover': '#1D4ED8',
          'yellow-soft': '#EFF6FF',
          'yellow-border': 'rgba(37, 99, 235, 0.28)',
        },
        brand: {
          400: '#3B82F6',
          500: '#2563EB',
          600: '#1D4ED8',
        },
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          subtle: '#EFF6FF',
          muted: '#DBEAFE',
        },
        status: {
          success: '#15803D',
          'success-subtle': '#ECFDF5',
          warning: '#B45309',
          'warning-subtle': '#FFFBEB',
          danger: '#DC2626',
          'danger-subtle': '#FEF2F2',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '14px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(17, 18, 20, 0.04)',
        'card-hover': '0 8px 24px -8px rgba(17, 18, 20, 0.10)',
        window: '0 1px 3px rgba(17, 18, 20, 0.05)',
        well: 'inset 0 1px 2px rgba(17, 18, 20, 0.04)',
        dropdown: '0 16px 40px -12px rgba(17, 18, 20, 0.18), 0 0 0 1px rgba(17, 18, 20, 0.08)',
      },
    },
  },
  plugins: [],
};
