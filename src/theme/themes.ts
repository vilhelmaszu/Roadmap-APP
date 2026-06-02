export type ThemeMode = 'dark' | 'light';

export type ThemeColors = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  primaryText: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  track: string;
  gradientFrom: string;
  gradientTo: string;
};

// Requirement to unlock a theme. Omitted = available from the start.
export type ThemeUnlock = {
  kind: 'level' | 'achievements' | 'streak' | 'goals';
  value: number;
};

export type Theme = {
  id: string;
  name: string;
  mode: ThemeMode;
  colors: ThemeColors;
  unlock?: ThemeUnlock;
};

export type UnlockContext = {
  level: number;
  earnedAchievements: number;
  bestStreak: number;
  completedGoals: number;
};

export function unlockValue(ctx: UnlockContext, u: ThemeUnlock): number {
  switch (u.kind) {
    case 'level':
      return ctx.level;
    case 'achievements':
      return ctx.earnedAchievements;
    case 'streak':
      return ctx.bestStreak;
    case 'goals':
      return ctx.completedGoals;
  }
}

export function themeUnlocked(theme: Theme, ctx: UnlockContext): boolean {
  if (!theme.unlock) return true;
  return unlockValue(ctx, theme.unlock) >= theme.unlock.value;
}

export function unlockLabel(u: ThemeUnlock): string {
  switch (u.kind) {
    case 'level':
      return `Reach level ${u.value}`;
    case 'achievements':
      return `Earn ${u.value} achievements`;
    case 'streak':
      return `${u.value}-day streak`;
    case 'goals':
      return `Complete ${u.value} goals`;
  }
}

export const Radius = { sm: 6, md: 10, lg: 14, xl: 20, pill: 999 } as const;
export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const THEMES: Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    mode: 'dark',
    colors: {
      bg: '#0B1020',
      surface: '#141B30',
      surfaceAlt: '#1B2440',
      surfaceElevated: '#202C4E',
      border: '#26314F',
      text: '#EAF0FF',
      textMuted: '#9DA9C9',
      textFaint: '#5C698C',
      primary: '#6C8BFF',
      primaryText: '#0B1020',
      accent: '#22D3EE',
      success: '#34D399',
      warning: '#FBBF24',
      danger: '#FB7185',
      track: '#222C4A',
      gradientFrom: '#6C8BFF',
      gradientTo: '#22D3EE',
    },
  },
  {
    id: 'nebula',
    name: 'Nebula',
    mode: 'dark',
    colors: {
      bg: '#120A1F',
      surface: '#1D1130',
      surfaceAlt: '#27183F',
      surfaceElevated: '#311E4D',
      border: '#3A2657',
      text: '#F3EAFF',
      textMuted: '#B9A6D6',
      textFaint: '#7A688F',
      primary: '#A855F7',
      primaryText: '#120A1F',
      accent: '#F472B6',
      success: '#4ADE80',
      warning: '#FBBF24',
      danger: '#FB7185',
      track: '#2C1B45',
      gradientFrom: '#A855F7',
      gradientTo: '#F472B6',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    mode: 'dark',
    colors: {
      bg: '#0F1115',
      surface: '#181B21',
      surfaceAlt: '#20242C',
      surfaceElevated: '#272C35',
      border: '#2C323C',
      text: '#F1F3F6',
      textMuted: '#A0A8B4',
      textFaint: '#646C78',
      primary: '#5EEAD4',
      primaryText: '#0F1115',
      accent: '#FDBA74',
      success: '#34D399',
      warning: '#FBBF24',
      danger: '#F87171',
      track: '#252A33',
      gradientFrom: '#5EEAD4',
      gradientTo: '#34D399',
    },
  },
  {
    id: 'daylight',
    name: 'Daylight',
    mode: 'light',
    colors: {
      bg: '#F4F6FB',
      surface: '#FFFFFF',
      surfaceAlt: '#EEF2F9',
      surfaceElevated: '#FFFFFF',
      border: '#E2E8F2',
      text: '#16203A',
      textMuted: '#5A6B85',
      textFaint: '#94A0B8',
      primary: '#4F6BFF',
      primaryText: '#FFFFFF',
      accent: '#0EA5E9',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      track: '#E5EAF3',
      gradientFrom: '#4F6BFF',
      gradientTo: '#0EA5E9',
    },
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    mode: 'light',
    colors: {
      bg: '#FFF7F0',
      surface: '#FFFFFF',
      surfaceAlt: '#FFEEE0',
      surfaceElevated: '#FFFFFF',
      border: '#F6DFCB',
      text: '#3A2415',
      textMuted: '#8A6B55',
      textFaint: '#B89C88',
      primary: '#F97316',
      primaryText: '#FFFFFF',
      accent: '#EC4899',
      success: '#16A34A',
      warning: '#D97706',
      danger: '#DC2626',
      track: '#F3E2D3',
      gradientFrom: '#F97316',
      gradientTo: '#EC4899',
    },
  },

  // --- 10 additional themes -------------------------------------------------
  {
    id: 'aurora',
    name: 'Aurora',
    mode: 'dark',
    colors: {
      bg: '#06121A',
      surface: '#0C1E27',
      surfaceAlt: '#123040',
      surfaceElevated: '#163A4C',
      border: '#1B4357',
      text: '#E6FBFF',
      textMuted: '#92BECB',
      textFaint: '#557682',
      primary: '#2DD4BF',
      primaryText: '#06121A',
      accent: '#A3E635',
      success: '#34D399',
      warning: '#FACC15',
      danger: '#FB7185',
      track: '#123843',
      gradientFrom: '#2DD4BF',
      gradientTo: '#A3E635',
    },
  },
  {
    id: 'crimson',
    name: 'Crimson',
    mode: 'dark',
    colors: {
      bg: '#160A0C',
      surface: '#231114',
      surfaceAlt: '#31171C',
      surfaceElevated: '#3C1D23',
      border: '#4A2229',
      text: '#FFEDED',
      textMuted: '#D6A1A6',
      textFaint: '#92666C',
      primary: '#F43F5E',
      primaryText: '#160A0C',
      accent: '#FB923C',
      success: '#34D399',
      warning: '#FBBF24',
      danger: '#EF4444',
      track: '#371A20',
      gradientFrom: '#F43F5E',
      gradientTo: '#FB923C',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    mode: 'dark',
    colors: {
      bg: '#0A1410',
      surface: '#11201A',
      surfaceAlt: '#172E24',
      surfaceElevated: '#1D392C',
      border: '#234534',
      text: '#E9FBEF',
      textMuted: '#9DC6AC',
      textFaint: '#5E806C',
      primary: '#4ADE80',
      primaryText: '#0A1410',
      accent: '#FBBF24',
      success: '#22C55E',
      warning: '#EAB308',
      danger: '#F87171',
      track: '#1A3328',
      gradientFrom: '#4ADE80',
      gradientTo: '#A3E635',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    mode: 'dark',
    colors: {
      bg: '#04111F',
      surface: '#0A1D33',
      surfaceAlt: '#0F2945',
      surfaceElevated: '#143356',
      border: '#1B3E65',
      text: '#E6F2FF',
      textMuted: '#93B4D6',
      textFaint: '#54718F',
      primary: '#38BDF8',
      primaryText: '#04111F',
      accent: '#818CF8',
      success: '#34D399',
      warning: '#FBBF24',
      danger: '#FB7185',
      track: '#123356',
      gradientFrom: '#38BDF8',
      gradientTo: '#818CF8',
    },
  },
  {
    id: 'sandstone',
    name: 'Sandstone',
    mode: 'light',
    colors: {
      bg: '#FBF6EE',
      surface: '#FFFFFF',
      surfaceAlt: '#F3EADB',
      surfaceElevated: '#FFFFFF',
      border: '#E8DAC4',
      text: '#3B2F1E',
      textMuted: '#7C6A50',
      textFaint: '#AC9B81',
      primary: '#B45309',
      primaryText: '#FFFFFF',
      accent: '#0D9488',
      success: '#15803D',
      warning: '#CA8A04',
      danger: '#DC2626',
      track: '#EBDDC6',
      gradientFrom: '#B45309',
      gradientTo: '#CA8A04',
    },
  },
  {
    id: 'rose',
    name: 'Rosé',
    mode: 'light',
    colors: {
      bg: '#FFF5F8',
      surface: '#FFFFFF',
      surfaceAlt: '#FCE7EF',
      surfaceElevated: '#FFFFFF',
      border: '#F6D4E1',
      text: '#3F1D2B',
      textMuted: '#8A5A6E',
      textFaint: '#BC8B9C',
      primary: '#DB2777',
      primaryText: '#FFFFFF',
      accent: '#7C3AED',
      success: '#059669',
      warning: '#D97706',
      danger: '#E11D48',
      track: '#F7DDE7',
      gradientFrom: '#DB2777',
      gradientTo: '#7C3AED',
    },
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    mode: 'dark',
    colors: {
      bg: '#050505',
      surface: '#0F0F0F',
      surfaceAlt: '#171717',
      surfaceElevated: '#1F1F1F',
      border: '#2A2A2A',
      text: '#F5F5F5',
      textMuted: '#A3A3A3',
      textFaint: '#5C5C5C',
      primary: '#EAB308',
      primaryText: '#050505',
      accent: '#FACC15',
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#EF4444',
      track: '#202020',
      gradientFrom: '#EAB308',
      gradientTo: '#FDE68A',
    },
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    mode: 'dark',
    colors: {
      bg: '#070418',
      surface: '#100A2A',
      surfaceAlt: '#19103E',
      surfaceElevated: '#221651',
      border: '#2E1E64',
      text: '#EDE9FF',
      textMuted: '#A99FD6',
      textFaint: '#6A5E96',
      primary: '#8B5CF6',
      primaryText: '#070418',
      accent: '#22D3EE',
      success: '#34D399',
      warning: '#FBBF24',
      danger: '#FB7185',
      track: '#1C1248',
      gradientFrom: '#8B5CF6',
      gradientTo: '#22D3EE',
    },
  },
  {
    id: 'volcano',
    name: 'Volcano',
    mode: 'dark',
    colors: {
      bg: '#100604',
      surface: '#1D0C07',
      surfaceAlt: '#2A130B',
      surfaceElevated: '#371A0F',
      border: '#472113',
      text: '#FFF1E6',
      textMuted: '#D6A98F',
      textFaint: '#946A53',
      primary: '#F97316',
      primaryText: '#100604',
      accent: '#EF4444',
      success: '#84CC16',
      warning: '#FACC15',
      danger: '#DC2626',
      track: '#31170D',
      gradientFrom: '#F97316',
      gradientTo: '#DC2626',
    },
  },
  {
    id: 'prismatic',
    name: 'Prismatic',
    mode: 'dark',
    colors: {
      bg: '#0A0712',
      surface: '#140F22',
      surfaceAlt: '#1E1733',
      surfaceElevated: '#281F44',
      border: '#352A55',
      text: '#F4F0FF',
      textMuted: '#B3A6D0',
      textFaint: '#6F6196',
      primary: '#F472B6',
      primaryText: '#0A0712',
      accent: '#34D399',
      success: '#22D3EE',
      warning: '#FBBF24',
      danger: '#FB7185',
      track: '#221A3C',
      gradientFrom: '#F472B6',
      gradientTo: '#34D399',
    },
  },

  // --- 10 additional themes -------------------------------------------------
  // Same darker-surface + bright-primary playbook as Slate / Aurora, just
  // different hues so you can find one that matches your mood.

  {
    id: 'carbon',
    name: 'Carbon',
    mode: 'dark',
    colors: {
      bg: '#08090C',
      surface: '#101217',
      surfaceAlt: '#171A21',
      surfaceElevated: '#1E222B',
      border: '#262B35',
      text: '#ECEEF2',
      textMuted: '#9AA2B0',
      textFaint: '#5A6271',
      primary: '#3B82F6',
      primaryText: '#08090C',
      accent: '#C0C7D2',
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#F87171',
      track: '#1B1F27',
      gradientFrom: '#3B82F6',
      gradientTo: '#06B6D4',
    },
  },
  {
    id: 'twilight',
    name: 'Twilight',
    mode: 'dark',
    colors: {
      bg: '#0A0E22',
      surface: '#131934',
      surfaceAlt: '#1B2347',
      surfaceElevated: '#212C58',
      border: '#2C386E',
      text: '#EAEEFF',
      textMuted: '#9DA8D6',
      textFaint: '#5D688F',
      primary: '#818CF8',
      primaryText: '#0A0E22',
      accent: '#FDA4AF',
      success: '#34D399',
      warning: '#FBBF24',
      danger: '#F472B6',
      track: '#1F2856',
      gradientFrom: '#818CF8',
      gradientTo: '#FDA4AF',
    },
  },
  {
    id: 'mocha',
    name: 'Mocha',
    mode: 'dark',
    colors: {
      bg: '#140D08',
      surface: '#1F140C',
      surfaceAlt: '#2C1C12',
      surfaceElevated: '#382418',
      border: '#473022',
      text: '#FFF1E0',
      textMuted: '#C9A07E',
      textFaint: '#856248',
      primary: '#D6A77A',
      primaryText: '#140D08',
      accent: '#F0CFA0',
      success: '#A3E635',
      warning: '#FBBF24',
      danger: '#FB7185',
      track: '#2A1A11',
      gradientFrom: '#D6A77A',
      gradientTo: '#F0CFA0',
    },
  },
  {
    id: 'storm',
    name: 'Storm',
    mode: 'dark',
    colors: {
      bg: '#0B121A',
      surface: '#141D29',
      surfaceAlt: '#1B2838',
      surfaceElevated: '#233247',
      border: '#2D3F58',
      text: '#E9F1FA',
      textMuted: '#94AAC4',
      textFaint: '#566D89',
      primary: '#FACC15',
      primaryText: '#0B121A',
      accent: '#7DD3FC',
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#FB7185',
      track: '#1E2C42',
      gradientFrom: '#FACC15',
      gradientTo: '#7DD3FC',
    },
  },
  {
    id: 'pine',
    name: 'Pine',
    mode: 'dark',
    colors: {
      bg: '#091410',
      surface: '#0F211B',
      surfaceAlt: '#152F26',
      surfaceElevated: '#1B3A2E',
      border: '#22473A',
      text: '#E6F7EE',
      textMuted: '#94B9A4',
      textFaint: '#557366',
      primary: '#10B981',
      primaryText: '#091410',
      accent: '#A3E635',
      success: '#22C55E',
      warning: '#EAB308',
      danger: '#F87171',
      track: '#173429',
      gradientFrom: '#10B981',
      gradientTo: '#A3E635',
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    mode: 'dark',
    colors: {
      bg: '#110705',
      surface: '#1F0C08',
      surfaceAlt: '#2D130E',
      surfaceElevated: '#3A1B14',
      border: '#4A241B',
      text: '#FFEDE5',
      textMuted: '#D6A091',
      textFaint: '#94655A',
      primary: '#EA580C',
      primaryText: '#FFEDE5',
      accent: '#FDE047',
      success: '#84CC16',
      warning: '#FACC15',
      danger: '#DC2626',
      track: '#321811',
      gradientFrom: '#EA580C',
      gradientTo: '#FDE047',
    },
  },
  {
    id: 'glacier',
    name: 'Glacier',
    mode: 'light',
    colors: {
      bg: '#F0F7FB',
      surface: '#FFFFFF',
      surfaceAlt: '#E5EFF6',
      surfaceElevated: '#FFFFFF',
      border: '#D3E2EE',
      text: '#0F2436',
      textMuted: '#4F6982',
      textFaint: '#8AA2B6',
      primary: '#0284C7',
      primaryText: '#FFFFFF',
      accent: '#14B8A6',
      success: '#16A34A',
      warning: '#D97706',
      danger: '#DC2626',
      track: '#D9E6F0',
      gradientFrom: '#0284C7',
      gradientTo: '#14B8A6',
    },
  },
  {
    id: 'coral',
    name: 'Coral',
    mode: 'light',
    colors: {
      bg: '#FFF7F2',
      surface: '#FFFFFF',
      surfaceAlt: '#FFEAD9',
      surfaceElevated: '#FFFFFF',
      border: '#F4D6BC',
      text: '#3C1F0F',
      textMuted: '#8A604A',
      textFaint: '#B89282',
      primary: '#F97066',
      primaryText: '#FFFFFF',
      accent: '#0D9488',
      success: '#15803D',
      warning: '#D97706',
      danger: '#DC2626',
      track: '#F4DCC8',
      gradientFrom: '#F97066',
      gradientTo: '#FFA94D',
    },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    mode: 'dark',
    colors: {
      bg: '#031912',
      surface: '#072B20',
      surfaceAlt: '#0A3B2C',
      surfaceElevated: '#0F4938',
      border: '#155745',
      text: '#E2FBEF',
      textMuted: '#8FC9AF',
      textFaint: '#4F8472',
      primary: '#10B981',
      primaryText: '#031912',
      accent: '#FCD34D',
      success: '#22C55E',
      warning: '#FBBF24',
      danger: '#F87171',
      track: '#0B3A2B',
      gradientFrom: '#10B981',
      gradientTo: '#FCD34D',
    },
  },
  {
    id: 'copper',
    name: 'Copper',
    mode: 'dark',
    colors: {
      bg: '#160B05',
      surface: '#22120A',
      surfaceAlt: '#301A10',
      surfaceElevated: '#3D2316',
      border: '#4E2D1D',
      text: '#FFEEDC',
      textMuted: '#D8A079',
      textFaint: '#9A6747',
      primary: '#E07A3F',
      primaryText: '#160B05',
      accent: '#FED7AA',
      success: '#84CC16',
      warning: '#FBBF24',
      danger: '#F87171',
      track: '#2E180E',
      gradientFrom: '#E07A3F',
      gradientTo: '#FED7AA',
    },
  },
];

export const DEFAULT_THEME_ID = 'midnight';

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
