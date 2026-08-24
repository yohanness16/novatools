/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0B0C0F',
        surface: {
          DEFAULT: '#131418',
          sunken: '#1B1D22',
          elevated: '#1A1C22',
          border: '#2A2D33',
          hairline: '#2A2D33',
        },
        primary: '#ECEDEF',
        secondary: '#8B8F98',
        muted: '#5B606D',
        accent: {
          DEFAULT: '#4F8CFF',
          hover: '#3B79F0',
          subtle: '#16233F',
          muted: '#1E2D4F',
        },
        status: {
          success: '#3FBE73',
          'success-subtle': '#122D1F',
          warning: '#E0A93E',
          'warning-subtle': '#332612',
          danger: '#F0564B',
          'danger-subtle': '#331614',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
      },
      boxShadow: {
        hairline: '0 0 0 1px #2A2D33',
        dropdown: '0 4px 16px 0 rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};
