import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Clock, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Suggestion } from '../../types/suggestion';
import { GrievanceCard } from './GrievanceCard';

interface GrievanceHistoryListProps {
  suggestions: Suggestion[];
  isLoadingList: boolean;
  listError: string | null;
  onRefresh: () => void;
  onLaunchWizard: () => void;
}

export const GrievanceHistoryList: React.FC<GrievanceHistoryListProps> = ({
  suggestions,
  isLoadingList,
  listError,
  onRefresh,
  onLaunchWizard,
}) => {
  const { colors } = useTheme();

  return (
    <Animated.View entering={FadeInUp.delay(300).duration(500)} className="w-full">
      <View className="flex-row justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: colors.cardBorder }}>
        <Text className="text-lg font-black" style={{ color: colors.foreground }}>Grievance Tracking History</Text>
        <Clock size={16} color={colors.mutedForeground} />
      </View>

      {isLoadingList ? (
        <View className="py-20 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : listError ? (
        <View className="py-12 items-center justify-center border rounded-2xl p-6" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
          <AlertCircle size={32} color="#ef4444" style={{ marginBottom: 8 }} />
          <Text className="font-bold text-center text-red-500">{listError}</Text>
          <TouchableOpacity className="mt-4 px-5 py-2 rounded-xl" style={{ backgroundColor: colors.primary }} onPress={onRefresh}>
            <Text className="text-white font-extrabold text-xs">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : suggestions.length === 0 ? (
        <View className="py-16 items-center justify-center border rounded-2xl p-6 border-dashed" style={{ borderColor: colors.cardBorder }}>
          <Clock size={36} color={colors.mutedForeground} style={{ marginBottom: 12, opacity: 0.6 }} />
          <Text className="font-black text-center text-sm" style={{ color: colors.foreground }}>No suggestions submitted yet</Text>
          <Text className="text-xs text-center mt-2 leading-relaxed max-w-[260px]" style={{ color: colors.mutedForeground }}>
            Submit your first infrastructure issue using details and coordinates. Let the AI prioritize the development.
          </Text>
          <TouchableOpacity className="mt-6 px-6 py-3 rounded-full" style={{ backgroundColor: colors.primary }} onPress={onLaunchWizard}>
            <Text className="text-white font-bold text-xs">New Suggestion</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="space-y-4">
          {suggestions.map((item, idx) => (
            <GrievanceCard key={item.id} item={item} index={idx} />
          ))}
        </View>
      )}
    </Animated.View>
  );
};
