// Design presets — a "design language" layer on top of (or replacing) the color theme.
// Two designs only: Newspaper (editorial), and Neon (cyberpunk terminal — color-locked).

import { ThemeColors } from './themes';

export type DesignId = 'newspaper' | 'cyber';

export type Design = {
  id: DesignId;
  name: string;
  tagline: string;
  // shape
  radius: number; // base corner radius for cards/inputs
  pillRadius: number;
  borderWidth: number;
  // type
  fontScale: number; // multiplies AppText sizes
  titleWeight: '400' | '500' | '600' | '700' | '800' | '900';
  bodyWeight: '400' | '500' | '600' | '700';
  titleSpacing: number; // letterSpacing on big titles
  uppercaseTitles: boolean; // section titles rendered UPPERCASE
  monoFont: boolean; // use monospace font family for everything
  // surface
  cardElevation: number; // shadow strength 0..1
  glow: number; // accent glow strength 0..1 (neon)
  flat: boolean; // no shadows, hard edges
  // spacing
  density: number; // multiplies card padding & gaps (1 = normal)
  // accents
  accentBars: boolean; // show left accent bars on cards
  // Terminal-style decorations (brackets, prompts, status lines).
  terminal: boolean;
  // If set, this design FORCES its own color palette and hides the Theme picker.
  enforcedColors?: ThemeColors;
};

const CYBER_COLORS: ThemeColors = {
  bg: '#05050B',
  surface: '#0B0C18',
  surfaceAlt: '#0F1124',
  surfaceElevated: '#13162B',
  border: '#1F2BFF',
  text: '#E0F7FF',
  textMuted: '#7AD0FF',
  textFaint: '#3F6E9A',
  primary: '#00F0FF',
  primaryText: '#000000',
  accent: '#FF2DD1',
  success: '#5DFF8A',
  warning: '#FFD53A',
  danger: '#FF3B6B',
  track: '#0F1A2E',
  gradientFrom: '#00F0FF',
  gradientTo: '#FF2DD1',
};

export const DESIGNS: Design[] = [
  {
    id: 'newspaper',
    name: 'Newspaper',
    tagline: 'High-contrast, editorial clarity, hard-cornered.',
    radius: 2,
    pillRadius: 4,
    borderWidth: 1.5,
    fontScale: 1.04,
    titleWeight: '900',
    bodyWeight: '500',
    titleSpacing: -0.5,
    uppercaseTitles: true,
    monoFont: false,
    cardElevation: 0,
    glow: 0,
    flat: true,
    density: 1.08,
    accentBars: false,
    terminal: false,
  },
  {
    id: 'cyber',
    name: 'Cyber',
    tagline: 'Cyberpunk terminal — fixed cyan/magenta palette.',
    radius: 0,
    pillRadius: 2,
    borderWidth: 2,
    fontScale: 1,
    titleWeight: '900',
    bodyWeight: '600',
    titleSpacing: 2,
    uppercaseTitles: true,
    monoFont: true,
    cardElevation: 0,
    glow: 1,
    flat: false,
    density: 1,
    accentBars: true,
    terminal: true,
    enforcedColors: CYBER_COLORS,
  },
];

export const DEFAULT_DESIGN_ID: DesignId = 'newspaper';

export function getDesign(id: string): Design {
  return DESIGNS.find((d) => d.id === id) ?? DESIGNS[0];
}
