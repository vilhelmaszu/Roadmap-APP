import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_DESIGN_ID, Design, getDesign } from './design';
import { DEFAULT_THEME_ID, getTheme, Theme } from './themes';

const STORAGE_KEY = 'roadmap.themeId';
const DESIGN_KEY = 'roadmap.designId';

type ThemeContextValue = {
  theme: Theme;
  themeId: string;
  setThemeId: (id: string) => void;
  design: Design;
  designId: string;
  setDesignId: (id: string) => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState(DEFAULT_THEME_ID);
  const [designId, setDesignIdState] = useState<string>(DEFAULT_DESIGN_ID);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(DESIGN_KEY)])
      .then(([savedTheme, savedDesign]) => {
        if (savedTheme) setThemeIdState(savedTheme);
        if (savedDesign) setDesignIdState(savedDesign);
      })
      .finally(() => setReady(true));
  }, []);

  const setThemeId = (id: string) => {
    setThemeIdState(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  };

  const setDesignId = (id: string) => {
    setDesignIdState(id);
    AsyncStorage.setItem(DESIGN_KEY, id).catch(() => {});
  };

  const value = useMemo<ThemeContextValue>(() => {
    const design = getDesign(designId);
    const baseTheme = getTheme(themeId);
    // A design can ENFORCE its own color palette (Neon does this). When enforced,
    // the active theme is overridden — and the Theme picker hides itself.
    const theme = design.enforcedColors
      ? { ...baseTheme, colors: design.enforcedColors }
      : baseTheme;
    return { theme, themeId, setThemeId, design, designId, setDesignId, ready };
  }, [themeId, designId, ready]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

// Convenience hook for components that only need the design language.
export function useDesign() {
  return useTheme().design;
}
