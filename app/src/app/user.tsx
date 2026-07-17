import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User as UserIcon, Mail, MapPin, LogOut } from 'lucide-react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

import { useTheme } from '../context/ThemeContext';
import { ParticleBackground } from '../components/ParticleBackground';
import { useAuthStore } from '../store/authStore';

export default function UserDashboard() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ParticleBackground />

      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
        <Animated.View 
          entering={ZoomIn.duration(600)} 
          className="w-full rounded-3xl p-6 border shadow-xl items-center"
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: colors.cardBorder,
          }}
        >
          {/* User Avatar Badge */}
          <View 
            className="w-20 h-20 rounded-full justify-center items-center mb-6 shadow-md"
            style={{ backgroundColor: colors.primary }}
          >
            <UserIcon size={40} color="#ffffff" />
          </View>

          {/* Title */}
          <Text className="text-3xl font-black mb-1" style={{ color: colors.foreground }}>
            Citizen Portal
          </Text>
          <Text className="text-base font-semibold mb-6" style={{ color: colors.primary }}>
            Welcome, {user?.fullName || 'User'}
          </Text>

          {/* Details Card */}
          <View className="w-full space-y-4 mb-8">
            <View 
              className="w-full flex-row items-center rounded-2xl px-4 py-3.5 border"
              style={{ 
                backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.3)' : 'rgba(0, 0, 0, 0.02)', 
                borderColor: colors.cardBorder 
              }}
            >
              <Mail size={20} color={colors.primary} style={{ marginRight: 12 }} />
              <View>
                <Text className="text-[12px] font-bold" style={{ color: colors.mutedForeground }}>Email Address</Text>
                <Text className="text-[15px] font-semibold" style={{ color: colors.foreground }}>{user?.email || 'N/A'}</Text>
              </View>
            </View>

            <View 
              className="w-full flex-row items-center rounded-2xl px-4 py-3.5 border mt-4"
              style={{ 
                backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.3)' : 'rgba(0, 0, 0, 0.02)', 
                borderColor: colors.cardBorder 
              }}
            >
              <UserIcon size={20} color={colors.primary} style={{ marginRight: 12 }} />
              <View>
                <Text className="text-[12px] font-bold" style={{ color: colors.mutedForeground }}>Role Assigned</Text>
                <Text className="text-[15px] font-semibold" style={{ color: colors.foreground }}>{user?.role || 'CITIZEN'}</Text>
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            className="w-full h-14 rounded-full flex-row items-center justify-center mt-4 border"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              borderColor: 'rgba(239, 68, 68, 0.4)',
            }}
            onPress={handleLogout}
          >
            <LogOut size={20} color="#ef4444" style={{ marginRight: 10 }} />
            <Text className="text-red-500 font-extrabold text-base">Sign Out</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
