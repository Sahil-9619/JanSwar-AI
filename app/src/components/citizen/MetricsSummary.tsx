import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

interface MetricsSummaryProps {
  totalCount: number;
  processingCount: number;
  analyzedCount: number;
  priorityCount: number;
}

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({
  totalCount,
  processingCount,
  analyzedCount,
  priorityCount,
}) => {
  const { theme, colors } = useTheme();

  return (
    <Animated.View entering={FadeInUp.delay(200).duration(500)} className="flex-row flex-wrap justify-between mb-8">
      <View className="w-[48%] rounded-2xl p-4 mb-3 border shadow-sm" style={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.3)' : 'rgba(255, 255, 255, 0.7)', borderColor: colors.cardBorder }}>
        <Text className="text-[10px] font-black uppercase tracking-wider" style={{ color: colors.mutedForeground }}>Submitted</Text>
        <Text className="text-2xl font-black mt-1" style={{ color: colors.foreground }}>{totalCount}</Text>
      </View>
      <View className="w-[48%] rounded-2xl p-4 mb-3 border shadow-sm" style={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.3)' : 'rgba(255, 255, 255, 0.7)', borderColor: colors.cardBorder }}>
        <Text className="text-[10px] font-black uppercase tracking-wider" style={{ color: colors.mutedForeground }}>Processing</Text>
        <Text className="text-2xl font-black mt-1 text-blue-500">{processingCount}</Text>
      </View>
      <View className="w-[48%] rounded-2xl p-4 border shadow-sm" style={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.3)' : 'rgba(255, 255, 255, 0.7)', borderColor: colors.cardBorder }}>
        <Text className="text-[10px] font-black uppercase tracking-wider" style={{ color: colors.mutedForeground }}>AI Analyzed</Text>
        <Text className="text-2xl font-black mt-1 text-emerald-500">{analyzedCount}</Text>
      </View>
      <View className="w-[48%] rounded-2xl p-4 border shadow-sm" style={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.3)' : 'rgba(255, 255, 255, 0.7)', borderColor: colors.cardBorder }}>
        <Text className="text-[10px] font-black uppercase tracking-wider" style={{ color: colors.mutedForeground }}>Priority Scored</Text>
        <Text className="text-2xl font-black mt-1 text-indigo-500">{priorityCount}</Text>
      </View>
    </Animated.View>
  );
};
