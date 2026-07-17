import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogOut, Plus, ChevronRight, RefreshCw, Layers, Sun, Moon } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme } from '../context/ThemeContext';
import { ParticleBackground } from '../components/ParticleBackground';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { Suggestion } from '../types/suggestion';

// Import Modular Citizen Components
import { MetricsSummary } from '../components/citizen/MetricsSummary';
import { GrievanceHistoryList } from '../components/citizen/GrievanceHistoryList';
import { SuggestionWizardModal } from '../components/citizen/SuggestionWizardModal';
import { SignOutModal } from '../components/SignOutModal';

export default function UserDashboard() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();
  const { logout } = useAuthStore();

  // Suggestion history lists state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Form Open State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const res = await api.get('/suggestions');
      setSuggestions(res.data.suggestions || []);
    } catch (err: any) {
      setListError(err.response?.data?.error || 'Failed to load suggestions.');
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleLogout = () => {
    setIsSignOutOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setIsSignOutOpen(false);
    await logout();
    router.replace('/');
  };

  const handleWizardSuccess = () => {
    setIsSubmitOpen(false);
    fetchSuggestions();
  };

  // Status Metrics counts
  const totalCount = suggestions.length;
  const processingCount = suggestions.filter(s => s.status === 'PROCESSING').length;
  const analyzedCount = suggestions.filter(s => s.status === 'ANALYZED' || s.status === 'APPROVED').length;
  const priorityCount = suggestions.filter(s => s.priorityScore !== null).length;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ParticleBackground />

      {/* Premium Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b" style={{ borderColor: colors.cardBorder }}>
        <View className="flex-row items-center">
          <View 
            className="w-10 h-10 rounded-xl justify-center items-center mr-3 bg-white overflow-hidden border"
            style={{ borderColor: 'rgba(59, 130, 246, 0.2)' }}
          >
            <Image 
              source={require('../../assets/images/JS_logo.png')} 
              className="w-full h-full"
              style={{ transform: [{ scale: 1.6 }] }}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text className="text-lg font-black" style={{ color: colors.foreground }}>
              JanSwar <Text style={{ color: colors.primary }}>AI</Text>
            </Text>
            <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.mutedForeground }}>Citizen Portal</Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <TouchableOpacity 
            className="p-2.5 rounded-xl border mr-2.5" 
            style={{ backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', borderColor: colors.cardBorder }}
            onPress={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={16} color={colors.foreground} /> : <Moon size={16} color={colors.foreground} />}
          </TouchableOpacity>
          <TouchableOpacity 
            className="p-2.5 rounded-xl border mr-2.5" 
            style={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.7)', borderColor: colors.cardBorder }}
            onPress={fetchSuggestions}
          >
            <RefreshCw size={16} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity 
            className="p-2.5 rounded-xl border" 
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            onPress={handleLogout}
          >
            <LogOut size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerClassName="px-6 py-6" showsVerticalScrollIndicator={false}>
        
        {/* Welcome card */}
        <Animated.View entering={FadeInUp.duration(500)} className="mb-6">
          <Text className="text-2xl font-black" style={{ color: colors.foreground }}>Your Development Voice</Text>
          <Text className="text-xs font-semibold mt-1 leading-relaxed" style={{ color: colors.mutedForeground }}>
            Submit local infrastructure issues like roads, water, or health and track real-time AI prioritizations and updates.
          </Text>
        </Animated.View>

        {/* Quick Submit Trigger Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} className="mb-6">
          <TouchableOpacity 
            className="w-full rounded-2xl py-4 px-5 flex-row items-center justify-between"
            style={{ backgroundColor: colors.primary }}
            onPress={() => setIsSubmitOpen(true)}
          >
            <View className="flex-row items-center">
              <Plus size={22} color="#ffffff" style={{ marginRight: 10 }} />
              <Text className="text-white font-extrabold text-base">New Suggestion / Grievance</Text>
            </View>
            <ChevronRight size={18} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Metrics Summary Counts Row */}
        <MetricsSummary 
          totalCount={totalCount}
          processingCount={processingCount}
          analyzedCount={analyzedCount}
          priorityCount={priorityCount}
        />

        {/* Suggestion History List Container */}
        <GrievanceHistoryList 
          suggestions={suggestions}
          isLoadingList={isLoadingList}
          listError={listError}
          onRefresh={fetchSuggestions}
          onLaunchWizard={() => setIsSubmitOpen(true)}
        />

      </ScrollView>

      {/* Suggestion Wizard Modal */}
      <SuggestionWizardModal 
        visible={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSubmitSuccess={handleWizardSuccess}
      />

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        visible={isSignOutOpen}
        onClose={() => setIsSignOutOpen(false)}
        onConfirm={handleLogoutConfirm}
      />

    </SafeAreaView>
  );
}
