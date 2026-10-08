'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, readTheme, saveTheme, type Theme } from '@/lib/theme';

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>('light');
  React.useEffect(() => {
    const t = readTheme();
    setTheme(t);
    applyTheme(t);
    // leaving the signed-in shell (logout) puts the page back on the light theme
    return () => applyTheme('light');
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    saveTheme(next);
    applyTheme(next);
  }
  const Icon = theme === 'dark' ? Sun : Moon;
  return (
    <button type="button" className="btn ghost sm" onClick={toggle} aria-label={theme === 'dark' ? 'switch to light mode' : 'switch to dark mode'} title="light / dark">
      <Icon size={16} strokeLinejoin="miter" strokeLinecap="square" />
    </button>
  );
}
