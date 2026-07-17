import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Calendar, Sparkles, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { Suggestion } from '../../types/suggestion';

interface MpGrievanceCardProps {
  item: Suggestion;
  index: number;
  onPress: () => void;
}

export const MpGrievanceCard: React.FC<MpGrievanceCardProps> = ({ item, index, onPress }) => {
  const { theme, colors } = useTheme();

  const getStatusBadge = (status: string) => {
    let bg = 'rgba(249, 115, 22, 0.15)';
    let text = '#f97316';
    let label = 'Pending';

    if (status === 'PROCESSING') {
      bg = 'rgba(59, 130, 246, 0.15)';
      text = '#3b82f6';
      label = 'Processing';
    } else if (status === 'ANALYZED' || status === 'APPROVED') {
      bg = 'rgba(16, 185, 129, 0.15)';
      text = '#10b981';
      label = 'AI Analyzed';
    } else if (status === 'REJECTED') {
      bg = 'rgba(239, 68, 68, 0.15)';
      text = '#ef4444';
      label = 'Rejected';
    }

    return (
      <View className="px-2.5 py-1 rounded-full border" style={{ backgroundColor: bg, borderColor: text + '30' }}>
        <Text className="text-[10px] font-black uppercase tracking-wider" style={{ color: text }}>{label}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Animated.View 
        entering={FadeInDown.delay(100 + index * 50).duration(400)}
        className="rounded-2xl p-5 border shadow-sm mb-4"
        style={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.7)', borderColor: colors.cardBorder }}
      >
        <View className="flex-row justify-between items-start mb-3 flex-wrap">
          <Text className="text-base font-black flex-1 mr-2" style={{ color: colors.foreground }}>{item.title}</Text>
          {item.category && (
            <View className="px-2.5 py-0.5 rounded bg-orange-500/10 border" style={{ borderColor: 'rgba(249, 115, 22, 0.3)' }}>
              <Text className="text-[9px] font-black uppercase text-orange-600 tracking-wider">{item.category.name}</Text>
            </View>
          )}
        </View>

        <Text className="text-xs font-semibold mb-4 leading-relaxed" style={{ color: colors.mutedForeground }} numberOfLines={2}>
          {item.description || item.transcription || 'No details provided'}
        </Text>

        {/* Geographics & Date */}
        <View className="flex-row items-center flex-wrap gap-x-4 gap-y-2 mb-4 border-b pb-4 border-dashed" style={{ borderColor: colors.cardBorder }}>
          <View className="flex-row items-center">
            <MapPin size={12} color={colors.mutedForeground} style={{ marginRight: 4 }} />
            <Text className="text-[10px] font-bold" style={{ color: colors.mutedForeground }}>
              {item.block?.name || 'Sadar'}, {item.village?.name || 'Village'}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Calendar size={12} color={colors.mutedForeground} style={{ marginRight: 4 }} />
            <Text className="text-[10px] font-bold" style={{ color: colors.mutedForeground }}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Footer elements */}
        <View className="flex-row items-center justify-between">
          {getStatusBadge(item.status)}
          <View className="flex-row items-center">
            {item.priorityScore && (
              <View className="flex-row items-center px-3 py-1.5 rounded-full bg-indigo-500/10 border mr-2" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                <Sparkles size={11} color="#6366f1" style={{ marginRight: 5 }} />
                <Text className="text-[10px] font-black text-indigo-500">Score: {item.priorityScore.finalScore.toFixed(0)}</Text>
              </View>
            )}
            <ChevronRight size={16} color={colors.mutedForeground} />
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};
