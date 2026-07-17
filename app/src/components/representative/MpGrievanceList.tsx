import React from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { AlertCircle, FileText } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { Suggestion } from '../../types/suggestion';
import { MpGrievanceCard } from './MpGrievanceCard';

interface MpGrievanceListProps {
  filteredSuggestions: Suggestion[];
  isLoading: boolean;
  listError: string | null;
  onSelectSuggestion: (item: Suggestion) => void;
}

export const MpGrievanceList: React.FC<MpGrievanceListProps> = ({
  filteredSuggestions,
  isLoading,
  listError,
  onSelectSuggestion,
}) => {
  const { colors } = useTheme();

  return (
    <Animated.View entering={FadeInUp.delay(300).duration(500)}>
      <Text className="text-lg font-black mb-4" style={{ color: colors.foreground }}>Citizen Grievances & Suggestions</Text>
      
      {isLoading ? (
        <View className="py-20 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : listError ? (
        <View className="py-12 items-center justify-center border rounded-2xl p-6 bg-red-500/5" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <AlertCircle size={32} color="#ef4444" style={{ marginBottom: 8 }} />
          <Text className="font-bold text-center text-red-500">{listError}</Text>
        </View>
      ) : filteredSuggestions.length === 0 ? (
        <View className="py-16 items-center justify-center border rounded-2xl p-6 border-dashed" style={{ borderColor: colors.cardBorder }}>
          <FileText size={36} color={colors.mutedForeground} style={{ marginBottom: 12, opacity: 0.6 }} />
          <Text className="font-black text-center text-sm" style={{ color: colors.foreground }}>No grievances found</Text>
        </View>
      ) : (
        <View className="space-y-4">
          {filteredSuggestions.map((item, idx) => (
            <MpGrievanceCard 
              key={item.id} 
              item={item} 
              index={idx} 
              onPress={() => onSelectSuggestion(item)} 
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
};
