import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { initializeApi } from '../src/services/config';

initializeApi();

export default function RootLayout() {
  return (
    <View className="flex-1 bg-bg-dark">
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#050505' },
          animation: 'fade',
        }}
      />
    </View>
  );
}
