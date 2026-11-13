import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'pronotes_theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

function applyThemeToDocument(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

const initialTheme = getStoredTheme();
const initialResolved = initialTheme === 'system' ? getSystemTheme() : initialTheme;
applyThemeToDocument(initialResolved);

export const useThemeStore = create<ThemeState>((set, get) => {
  // Listen for system theme changes if set to system
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (get().theme === 'system') {
        const resolved = e.matches ? 'dark' : 'light';
        applyThemeToDocument(resolved);
        set({ resolvedTheme: resolved });
      }
    });
  }

  return {
    theme: initialTheme,
    resolvedTheme: initialResolved,

    setTheme: (theme: ThemeMode) => {
      localStorage.setItem(STORAGE_KEY, theme);
      const resolved = theme === 'system' ? getSystemTheme() : theme;
      applyThemeToDocument(resolved);
      set({ theme, resolvedTheme: resolved });
    },

    toggleTheme: () => {
      const current = get().resolvedTheme;
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      get().setTheme(nextTheme);
    },
  };
});
