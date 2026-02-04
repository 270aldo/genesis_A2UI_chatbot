import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../src/components/navigation';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="train" options={{ title: 'Train' }} />
      <Tabs.Screen name="fuel" options={{ title: 'Fuel' }} />
      <Tabs.Screen name="mind" options={{ title: 'Mind' }} />
      <Tabs.Screen name="track" options={{ title: 'Track' }} />
    </Tabs>
  );
}
