import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { initializeApi } from '../src/services/config';
import { ChatFAB } from '../src/components/navigation';

// Import widgets to trigger registration
import '../src/components/widgets';

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
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="chat"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <ChatFAB />
    </View>
  );
}
