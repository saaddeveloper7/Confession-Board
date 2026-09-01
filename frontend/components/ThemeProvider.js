'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = ['light', 'dark', 'midnight', 'warm'];
const STORAGE_KEY = 'theme';
const DEFAULT_THEME = 'light';

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  themes: THEMES,
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(DEFAULT_THEME);

  // Sync React state from whatever the no-flash inline script already applied
  // to <html data-theme>. Falls back to localStorage, then to "light".
  useEffect(() => {
    let stored = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable (private mode / sandbox) — ignore.
    }
    const initial =
      stored && THEMES.includes(stored)
        ? stored
        : document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;

    setThemeState(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  function setTheme(next) {
    if (!THEMES.includes(next)) return;
    setThemeState(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persistence best-effort only.
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
