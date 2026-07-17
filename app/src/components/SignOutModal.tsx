import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { LogOut, AlertTriangle } from 'lucide-react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

interface SignOutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({ visible, onClose, onConfirm }) => {
  const { theme, colors } = useTheme();

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <Animated.View 
        entering={FadeIn.duration(200)}
        className="flex-1 justify-center items-center bg-black/60 px-6"
      >
        <Animated.View 
          entering={ZoomIn.duration(250)}
          className="w-full max-w-[340px] rounded-3xl p-6 border shadow-2xl items-center"
          style={{ 
            backgroundColor: colors.background, 
            borderColor: colors.cardBorder 
          }}
        >
          {/* Icon Header */}
          <View className="w-14 h-14 rounded-full justify-center items-center bg-red-500/10 mb-4 border border-red-500/20">
            <LogOut size={24} color="#ef4444" />
          </View>

          {/* Heading & description */}
          <Text className="text-lg font-black mb-1.5" style={{ color: colors.foreground }}>
            Sign Out
          </Text>
          <Text className="text-xs font-semibold text-center leading-relaxed mb-6" style={{ color: colors.mutedForeground }}>
            Are you sure you want to sign out of your JanSwar AI account? You will need to log in again to submit or inspect suggestions.
          </Text>

          {/* Buttons Actions Row */}
          <View className="flex-row w-full gap-3">
            <TouchableOpacity 
              onPress={onClose}
              className="flex-1 h-12 rounded-xl justify-center items-center border"
              style={{ 
                backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                borderColor: colors.cardBorder 
              }}
            >
              <Text className="font-extrabold text-xs" style={{ color: colors.foreground }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={onConfirm}
              className="flex-1 h-12 rounded-xl justify-center items-center bg-red-500 shadow-sm"
            >
              <Text className="text-white font-extrabold text-xs">
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};
