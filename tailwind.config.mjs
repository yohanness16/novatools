/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        canvas: '#050811',
        surface: {
          DEFAULT: '#0A0F1D',
          sunken: '#0D1426',
          elevated: '#111A30',
          border: '#1E293B',
          hairline: '#1E293B',
        },
        primary: '#F1F5F9',
        secondary: '#94A3B8',
        muted: '#64748B',
        accent: {
          DEFAULT: '#38BDF8',
          hover: '#0EA5E9',
          subtle: '#0C2340',
          muted: '#1E3A5F',
        },
        status: {
          success: '#34D399',
          'success-subtle': '#06281E',
          warning: '#FBBF24',
          'warning-subtle': '#2D1F06',
          danger: '#F87171',
          'danger-subtle': '#2E1111',
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
