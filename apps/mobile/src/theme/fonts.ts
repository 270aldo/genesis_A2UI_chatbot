import { Platform } from 'react-native';

/**
 * Typography constants for Genesis Fusion design system.
 *
 * Font families reference the names exported by @expo-google-fonts packages.
 * Platform fallbacks used when fonts haven't loaded yet.
 */

const PLATFORM_MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });
const PLATFORM_SANS = Platform.select({
  ios: 'Helvetica Neue',
  default: 'sans-serif',
});

export const FONTS = {
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansBold: 'Inter_700Bold',

  // Platform fallbacks
  fallbackMono: PLATFORM_MONO,
  fallbackSans: PLATFORM_SANS,
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;
