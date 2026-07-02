import type { Config } from 'tailwindcss';

/**
 * Mizan design system → Tailwind. Colours are CSS custom properties defined in
 * app/globals.css (light + dark), so the same tokens drive both themes and can
 * be swapped in one place. Mirrors the prototype's palette.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--page)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        elevated: 'var(--elevated)',
        line: 'var(--line)',
        'line-2': 'var(--line-2)',
        'ink-1': 'var(--ink-1)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        brand: { DEFAULT: 'var(--brand-1)', 2: 'var(--brand-2)', 3: 'var(--brand-3)' },
        good: 'var(--good)',
        warning: 'var(--warning)',
        serious: 'var(--serious)',
        critical: 'var(--critical)',
        c1: 'var(--c1)', c2: 'var(--c2)', c3: 'var(--c3)', c4: 'var(--c4)', c5: 'var(--c5)', c6: 'var(--c6)',
      },
      borderRadius: { xl: '14px', '2xl': '20px' },
      fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
      boxShadow: { card: 'var(--shadow)' },
      backgroundImage: { brand: 'var(--brand-grad)' },
    },
  },
  plugins: [],
};
export default config;
