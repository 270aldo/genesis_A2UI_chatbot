import { Platform } from 'react-native';
import { setApiUrl } from '@genesis/shared';

const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:8000',
  ios: 'http://localhost:8000',
  default: 'http://localhost:8000',
});

export const initializeApi = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;
  setApiUrl(apiUrl);
};
