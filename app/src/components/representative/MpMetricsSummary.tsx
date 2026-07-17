import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

interface MpMetricsSummaryProps {
  totalCount: number;
  pendingCount: number;
  processingCount: number;
  analyzedCount: number;
}

export const MpMetricsSummary: React.FC<MpMetricsSummaryProps> = ({
  totalCount,
  pendingCount,
  processingCount,
  analyzedCount,
}) => {
  const { theme, colors } = useTheme();

  return (
    <Animated.View entering={FadeInUp.delay(200).duration(500)} className="flex-row flex-wrap justify-between mb-6">
      <View className="w-[23%] rounded-xl p-3 border shadow-sm items-center" style={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.3)' : 'rgba(255, 255, 255, 0.7)', borderColor: colors.cardBorder }}>
        <Text className="text-[9px] font-black uppercase text-center" style={{ color: colors.mutedForeground }}>Total</Text>
        <Text className="text-lg font-black mt-0.5" style={{ color: colors.foreground }}>{totalCount}</Text>
      </View>
      <View className="w-[23%] rounded-xl p-3 border shadow-sm items-center" style={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.3)' : 'rgba(255, 255, 255, 0.7)', borderColor: colors.cardBorder }}>
        <Text className="text-[9px] font-black uppercase text-center" style={{ color: colors.mutedForeground }}>Pending</Text>
        <Text className="text-lg font-black mt-0.5 text-orange-500">{pendingCount}</Text>
      </View>
      <View className="w-[23%] rounded-xl p-3 border shadow-sm items-center" style={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.3)' : 'rgba(255, 255, 255, 0.7)', borderColor: colors.cardBorder }}>
        <Text className="text-[9px] font-black uppercase text-center" style={{ color: colors.mutedForeground }}>Active</Text>
        <Text className="text-lg font-black mt-0.5 text-blue-500">{processingCount}</Text>
      </View>
      <View className="w-[23%] rounded-xl p-3 border shadow-sm items-center" style={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.3)' : 'rgba(255, 255, 255, 0.7)', borderColor: colors.cardBorder }}>
        <Text className="text-[9px] font-black uppercase text-center" style={{ color: colors.mutedForeground }}>Analyzed</Text>
        <Text className="text-lg font-black mt-0.5 text-emerald-500">{analyzedCount}</Text>
      </View>
    </Animated.View>
  );
};
