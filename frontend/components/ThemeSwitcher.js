'use client';

import { useTheme } from './ThemeProvider';

// Each swatch previews its theme: the disc is the page background, the dot is
// the accent. Keeps the control sleek and self-explanatory.
const SWATCHES = [
  { id: 'light', label: 'Light', bg: '#ffffff', dot: '#4f46e5' },
  { id: 'dark', label: 'Dark', bg: '#0f0f12', dot: '#3b82f6' },
  { id: 'midnight', label: 'Midnight', bg: '#0c0a1d', dot: '#6366f1' },
  { id: 'warm', label: 'Warm', bg: '#faf6f0', dot: '#d97706' },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="flex items-center gap-1.5"
    >
      {SWATCHES.map((s) => {
        const active = theme === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setTheme(s.id)}
            title={`${s.label} theme`}
            aria-label={`${s.label} theme`}
            aria-pressed={active}
            className={`relative h-6 w-6 rounded-full border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
              active
                ? 'border-transparent ring-2 ring-accent ring-offset-2 ring-offset-bg'
                : 'border-border hover:scale-110'
            }`}
            style={{ backgroundColor: s.bg }}
          >
            <span
              className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ backgroundColor: s.dot }}
            />
          </button>
        );
      })}
    </div>
  );
}
