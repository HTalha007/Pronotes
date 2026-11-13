import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FAF8F5',
        card: '#FFFFFF',
        border: '#E8E4DE',
        'border-subtle': '#F0EDE8',
        'code-bg': '#F4F2EE',
        'text-primary': '#2E2E38',
        'text-secondary': '#6B6B76',
        'text-muted': '#9A9AA2',
        'nav-active-bg': '#E8ECFB',
        'nav-active-text': '#2F3A6B',
        code: {
          kw: '#6B5CA5',
          str: '#3D7A5F',
          cmt: '#8A8A94',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '8px',
        btn: '6px',
        input: '6px',
        code: '4px',
      },
    },
  },
  plugins: [],
} satisfies Config;
