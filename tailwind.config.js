/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--paper)',
          deep: 'var(--paper-deep)',
          light: 'var(--paper-light)',
          card: 'var(--paper-card)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          faint: 'var(--ink-faint)',
        },
        muted: 'var(--muted)',
        accent: 'var(--accent)',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.035em',
        tighter: '-0.02em',
      },
      boxShadow: {
        'paper-sm': '0 1px 2px rgba(22, 20, 19, 0.06)',
        'paper': '0 4px 12px rgba(22, 20, 19, 0.08)',
        'paper-lg': '0 12px 32px rgba(22, 20, 19, 0.12)',
      }
    },
  },
  plugins: [],
}
