const path = require('path');
const monorepoRoot = path.resolve(__dirname, '../..');

module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@shopify/flash-list|@supabase/.*|nativewind|react-native-css-interop|lucide-react-native|react-native-reanimated|react-native-svg|react-native-worklets|expo-blur|expo-linear-gradient|expo-haptics|expo-constants|expo-linking|expo-router|expo-status-bar|react-native-screens|react-native-safe-area-context|@genesis/shared)',
  ],
  moduleNameMapper: {
    '^@genesis/shared$': path.resolve(monorepoRoot, 'packages/shared/src'),
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/'],
};
