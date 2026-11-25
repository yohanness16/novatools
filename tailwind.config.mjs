/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#F5F1E8',
          dark: '#141311',
        },
        well: {
          DEFAULT: '#EAE3D4',
          dark: '#0E0D0B',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#FCFBF8',
          sunken: '#EAE3D4',
          elevated: '#FFFFFF',
          border: 'rgba(20, 20, 19, 0.11)',
          hairline: 'rgba(20, 20, 19, 0.08)',
        },
        ink: {
          DEFAULT: '#141413',
          secondary: '#454038',
          muted: '#746D61',
          bone: '#FAF7F0',
        },
        studio: {
          yellow: '#FACC15',
          'yellow-hover': '#EAB308',
          'yellow-soft': '#FEF7D6',
          'yellow-border': '#D9A700',
        },
        brand: {
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
        },
        accent: {
          DEFAULT: '#FACC15',
          hover: '#EAB308',
          subtle: '#FEF7D6',
          muted: '#FDE68A',
        },
        status: {
          success: '#15803D',
          'success-subtle': '#ECFDF3',
          warning: '#A16207',
          'warning-subtle': '#FEF9C3',
          danger: '#B91C1C',
          'danger-subtle': '#FEF2F2',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '22px',
      },
      boxShadow: {
        card: 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 1px 2px rgba(20, 20, 19, 0.05), 0 8px 20px -6px rgba(38, 31, 20, 0.09), 0 2px 0 0 rgba(20, 20, 19, 0.05)',
        'card-hover': 'inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -2px rgba(20, 20, 19, 0.08), 0 16px 32px -8px rgba(38, 31, 20, 0.14), 0 3px 0 0 rgba(20, 20, 19, 0.10)',
        window: 'inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 2px 4px rgba(20, 20, 19, 0.06), 0 16px 36px -8px rgba(38, 31, 20, 0.12), 0 3px 0 0 rgba(20, 20, 19, 0.06)',
        well: 'inset 0 1px 3px rgba(20, 20, 19, 0.08)',
        keycap: 'inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 2px 0 rgba(0, 0, 0, 0.85), 0 4px 12px rgba(20, 20, 19, 0.15)',
        'keycap-yellow': 'inset 0 1px 0 rgba(255, 255, 255, 0.55), 0 2px 0 #B88E00, 0 6px 16px rgba(20, 20, 19, 0.12)',
        dropdown: '0 18px 42px -12px rgba(20, 20, 19, 0.25), 0 0 0 1px rgba(20, 20, 19, 0.10)',
      },
    },
  },
  plugins: [],
};
