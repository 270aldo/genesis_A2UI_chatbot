import { COLORS, WIDGET_CATEGORIES } from '@genesis/shared';

export { COLORS, WIDGET_CATEGORIES };

export const withOpacity = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const SURFACE = {
  bg: withOpacity('#FFFFFF', 0.07),
  bgElevated: withOpacity('#FFFFFF', 0.10),
  bgHover: withOpacity('#FFFFFF', 0.12),
  border: withOpacity('#FFFFFF', 0.10),
  borderStrong: withOpacity('#FFFFFF', 0.16),
} as const;

export const TEXT = {
  primary: 'rgba(255,255,255,0.95)',
  secondary: 'rgba(255,255,255,0.75)',
  tertiary: 'rgba(255,255,255,0.55)',
  muted: 'rgba(255,255,255,0.45)',
  disabled: 'rgba(255,255,255,0.35)',
} as const;
