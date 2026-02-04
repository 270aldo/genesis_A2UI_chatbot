import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        genesis: '#6D00FF',
        'bg-dark': '#050505',
        'card-dark': 'rgba(255, 255, 255, 0.03)',
        'border-dark': 'rgba(255, 255, 255, 0.08)',
        training: '#EF4444',
        nutrition: '#22C55E',
        recovery: '#0EA5E9',
        habits: '#FBBF24',
        analytics: '#A855F7',
        education: '#6D00FF',
        'text-primary': 'rgba(255,255,255,0.95)',
        'text-secondary': 'rgba(255,255,255,0.75)',
        'text-tertiary': 'rgba(255,255,255,0.55)',
        'text-muted': 'rgba(255,255,255,0.45)',
      },
    },
  },
  plugins: [],
} satisfies Config;
