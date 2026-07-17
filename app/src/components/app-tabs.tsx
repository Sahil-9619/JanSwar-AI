import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Home, Compass } from 'lucide-react-native';

import { lightColors, darkColors } from '../context/ThemeContext';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.cardBorder },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' }
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}
