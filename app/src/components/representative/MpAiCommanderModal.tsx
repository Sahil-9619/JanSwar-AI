import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Image,
  PanResponder,
  Animated as RNAnimated,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface MpAiCommanderModalProps {
  visible: boolean;
  onClose: () => void;
  aiInput: string;
  setAiInput: (v: string) => void;
  chatHistory: Array<{ sender: 'user' | 'ai'; text: string }>;
  onSendAiCommand: (customCommand?: string) => void;
}

/** Draggable FAB anchored at bottom-right. Finger drag repositions it. JanSwar logo fills the button. */
export const DraggableAiFab: React.FC<{
  onPress: () => void;
}> = ({ onPress }) => {
  const { colors, theme } = useTheme();

  // Translation delta from the fixed anchor — starts at (0,0) = bottom-right anchor
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const translateY = useRef(new RNAnimated.Value(0)).current;
  const isDragging = useRef(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
    onPanResponderGrant: () => {
      isDragging.current = false;
      // Capture current accumulated offset so next drag is relative
      (translateX as any).setOffset((translateX as any)._value);
      (translateY as any).setOffset((translateY as any)._value);
      translateX.setValue(0);
      translateY.setValue(0);
    },
    onPanResponderMove: (_, g) => {
      if (Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3) {
        isDragging.current = true;
      }
      translateX.setValue(g.dx);
      translateY.setValue(g.dy);
    },
    onPanResponderRelease: () => {
      // Flatten offsets so next drag starts from new position
      (translateX as any).flattenOffset();
      (translateY as any).flattenOffset();
      if (!isDragging.current) {
        onPress();
      }
    },
  });

  const SIZE = 58;

  return (
    <RNAnimated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        // Vertically centered on right side with 16px gap from screen edge
        top: SCREEN_HEIGHT / 2 - SIZE / 2,
        right: 16,
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE / 2,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: colors.primary,
        shadowOpacity: 0.45,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        borderWidth: 2.5,
        borderColor: theme === 'dark'
          ? 'rgba(255,255,255,0.18)'
          : 'rgba(255,255,255,0.7)',
        overflow: 'hidden',
        transform: [
          { translateX },
          { translateY },
        ],
      }}
    >
      {/* Logo fills the full button container */}
      <Image
        source={require('../../../assets/images/JS_logo.png')}
        style={{ width: SIZE, height: SIZE }}
        resizeMode="cover"
      />
    </RNAnimated.View>
  );
};

export const MpAiCommanderModal: React.FC<MpAiCommanderModalProps> = ({
  visible,
  onClose,
  aiInput,
  setAiInput,
  chatHistory,
  onSendAiCommand,
}) => {
  const { theme, colors } = useTheme();

  const sendBgColor = colors.primary;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View
          style={{
            width: '100%',
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            overflow: 'hidden',
            backgroundColor: colors.background,
            height: '75%',
            borderTopWidth: 1,
            borderColor: colors.cardBorder,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 24,
              paddingVertical: 20,
              borderBottomWidth: 1,
              borderColor: colors.cardBorder,
              backgroundColor: colors.card,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#fff',
                  borderWidth: 2,
                  borderColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                  overflow: 'hidden',
                }}
              >
                <Image
                  source={require('../../../assets/images/JS_logo.png')}
                  style={{ width: 28, height: 28 }}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: colors.foreground }}>
                  AI Command Center
                </Text>
                <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 1 }}>
                  Natural Language Dashboard Control
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                padding: 10,
                borderRadius: 20,
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              }}
            >
              <X size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Chat Messages */}
          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {chatHistory.map((msg, index) => {
              if (msg.sender === 'ai') {
                return (
                  <View
                    key={index}
                    style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, maxWidth: '85%' }}
                  >
                    {/* JanSwar Bot avatar */}
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: '#ffffff',
                        borderWidth: 2,
                        borderColor: colors.primary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 10,
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      <Image
                        source={require('../../../assets/images/JS_logo.png')}
                        style={{ width: 26, height: 26 }}
                        resizeMode="contain"
                      />
                    </View>
                    <View
                      style={{
                        borderRadius: 18,
                        borderTopLeftRadius: 4,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                        backgroundColor:
                          theme === 'dark'
                            ? 'rgba(30, 41, 59, 0.5)'
                            : 'rgba(255, 255, 255, 0.8)',
                        flex: 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: '900',
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                          color: colors.primary,
                          marginBottom: 4,
                        }}
                      >
                        JanSwar Bot
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          lineHeight: 18,
                          color: colors.foreground,
                        }}
                      >
                        {msg.text}
                      </Text>
                    </View>
                  </View>
                );
              } else {
                return (
                  <View
                    key={index}
                    style={{
                      alignSelf: 'flex-end',
                      maxWidth: '75%',
                      borderRadius: 18,
                      borderBottomRightRadius: 4,
                      padding: 14,
                      marginBottom: 16,
                      backgroundColor: colors.primary,
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700', lineHeight: 18 }}>
                      {msg.text}
                    </Text>
                  </View>
                );
              }
            })}
          </ScrollView>

          {/* Quick pill shortcuts */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              borderTopWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            {[
              { text: 'High Priority', cmd: 'show high priority' },
              { text: 'Pending', cmd: 'pending' },
              { text: 'Water', cmd: 'water' },
              { text: 'Road', cmd: 'road' },
              { text: 'Reset All', cmd: 'reset' },
              { text: 'Summarize', cmd: 'summary' },
            ].map((pill, pIdx) => (
              <TouchableOpacity
                key={pIdx}
                onPress={() => onSendAiCommand(pill.cmd)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.primary + '40',
                  backgroundColor: colors.primary + '10',
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    color: colors.primary,
                  }}
                >
                  {pill.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input Bar */}
          <View
            style={{
              padding: 16,
              borderTopWidth: 1,
              borderColor: colors.cardBorder,
              backgroundColor: colors.card,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <TextInput
              value={aiInput}
              onChangeText={setAiInput}
              placeholder="Type dashboard commands..."
              placeholderTextColor={colors.mutedForeground}
              style={{
                flex: 1,
                borderRadius: 16,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderWidth: 1,
                fontSize: 13,
                fontWeight: '500',
                marginRight: 12,
                backgroundColor:
                  theme === 'dark' ? 'rgba(15, 23, 42, 0.3)' : 'rgba(0, 0, 0, 0.02)',
                borderColor: colors.cardBorder,
                color: colors.foreground,
              }}
            />
            <TouchableOpacity
              onPress={() => onSendAiCommand()}
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: sendBgColor,
                overflow: 'hidden',
              }}
            >
              <Image
                source={require('../../../assets/images/JS_logo.png')}
                style={{ width: 26, height: 26 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
