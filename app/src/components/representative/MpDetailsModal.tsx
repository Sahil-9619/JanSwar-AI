import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import { 
  X, MapPin, Calendar, Sparkles, FileText, Play, Square, Compass, Globe, HelpCircle
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Suggestion } from '../../types/suggestion';

interface MpDetailsModalProps {
  selectedSuggestion: Suggestion | null;
  onClose: () => void;
  isPlayingAudio: boolean;
  onPlayAudio: (url: string) => void;
  onOpenDoc: (url: string) => void;
}

export const MpDetailsModal: React.FC<MpDetailsModalProps> = ({
  selectedSuggestion,
  onClose,
  isPlayingAudio,
  onPlayAudio,
  onOpenDoc,
}) => {
  const { theme, colors } = useTheme();
  const [isPreviewImageOpen, setIsPreviewImageOpen] = useState(false);

  if (!selectedSuggestion) return null;

  // Extract real backend media attachments
  const imageMedia = selectedSuggestion.media?.find(m => m.mediaType === 'IMAGE');
  const docMedia = selectedSuggestion.media?.find(m => m.mediaType === 'DOCUMENT');
  const voiceMedia = selectedSuggestion.media?.find(m => m.mediaType === 'VOICE');
  const hasAttachments = !!(imageMedia || docMedia || voiceMedia);

  return (
    <Modal visible={true} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View 
          className="w-full rounded-t-[2.5rem] overflow-hidden flex-col justify-between"
          style={{ backgroundColor: colors.background, height: '90%', borderTopWidth: 1, borderColor: colors.cardBorder }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-5 border-b" style={{ borderColor: colors.cardBorder, backgroundColor: colors.card }}>
            <View>
              <Text className="text-xl font-black flex-row items-center" style={{ color: colors.foreground }}>
                Grievance Details
              </Text>
            </View>
            <TouchableOpacity className="p-2.5 rounded-full bg-slate-500/10" onPress={onClose}>
              <X size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerClassName="p-6 flex-grow" 
            keyboardShouldPersistTaps="handled" 
            showsVerticalScrollIndicator={false}
            style={{ marginBottom: 10 }}
          >
            {/* Title and Category */}
            <View className="mb-6">
              <Text className="text-xl font-black leading-snug" style={{ color: colors.foreground }}>{selectedSuggestion.title}</Text>
              {selectedSuggestion.category && (
                <View className="self-start px-3 py-1 rounded bg-orange-500/10 border mt-3.5" style={{ borderColor: 'rgba(249, 115, 22, 0.3)' }}>
                  <Text className="text-xs font-black uppercase text-orange-600 tracking-wider">{selectedSuggestion.category.name}</Text>
                </View>
              )}
            </View>

            {/* SECTION 1: GEOGRAPHY & LOCATION */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Compass size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text className="text-[11px] font-black uppercase tracking-widest" style={{ color: colors.primary }}>
                  1. Location details
                </Text>
              </View>

              <View 
                className="rounded-2xl border p-5 shadow-sm" 
                style={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.2)' : 'rgba(255, 255, 255, 0.4)', 
                  borderColor: colors.cardBorder 
                }}
              >
                <Text className="text-xs font-bold leading-relaxed" style={{ color: colors.foreground }}>
                  Address: {selectedSuggestion.block?.name || 'Sadar'}, {selectedSuggestion.village?.name || 'Village'}
                </Text>
                <View className="flex-row items-center mt-2.5">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                  <Text className="text-xs font-bold font-mono text-emerald-500">
                    GPS Coordinates: Lat {selectedSuggestion.latitude.toFixed(5)}, Lng {selectedSuggestion.longitude.toFixed(5)}
                  </Text>
                </View>
              </View>
            </View>

            {/* SECTION 2: DESCRIPTION */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <FileText size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text className="text-[11px] font-black uppercase tracking-widest" style={{ color: colors.primary }}>
                  2. Description Details
                </Text>
              </View>

              <View 
                className="rounded-2xl border p-5 shadow-sm" 
                style={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.2)' : 'rgba(255, 255, 255, 0.4)', 
                  borderColor: colors.cardBorder 
                }}
              >
                <Text className="text-xs font-medium leading-relaxed" style={{ color: colors.foreground }}>
                  {selectedSuggestion.description || 'No description entered.'}
                </Text>
              </View>
            </View>

            {/* SECTION 3: AI PARSING LOGS */}
            {(selectedSuggestion.translatedText || selectedSuggestion.transcription) && (
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Sparkles size={14} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text className="text-[11px] font-black uppercase tracking-widest" style={{ color: colors.primary }}>
                    3. AI Ingestion Logs
                  </Text>
                </View>

                <View 
                  className="rounded-2xl border p-5 shadow-sm space-y-4" 
                  style={{ 
                    backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.2)' : 'rgba(255, 255, 255, 0.4)', 
                    borderColor: 'rgba(99, 102, 241, 0.2)' 
                  }}
                >
                  {selectedSuggestion.transcription && (
                    <View>
                      <Text className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">Voice Transcription</Text>
                      <Text className="text-xs font-bold mt-1 leading-relaxed" style={{ color: colors.foreground }}>{selectedSuggestion.transcription}</Text>
                    </View>
                  )}
                  {selectedSuggestion.translatedText && (
                    <View className="pt-3.5 border-t" style={{ borderColor: 'rgba(99, 102, 241, 0.1)' }}>
                      <Text className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">English Translation</Text>
                      <Text className="text-xs font-bold mt-1 leading-relaxed" style={{ color: colors.foreground }}>{selectedSuggestion.translatedText}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* SECTION 4: MEDIA FILES ATTACHMENTS */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Globe size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text className="text-[11px] font-black uppercase tracking-widest" style={{ color: colors.primary }}>
                  4. Media Attachments
                </Text>
              </View>

              <View 
                className="rounded-2xl border p-5 shadow-sm space-y-4" 
                style={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.2)' : 'rgba(255, 255, 255, 0.4)', 
                  borderColor: colors.cardBorder 
                }}
              >
                {!hasAttachments ? (
                  <View className="py-4 items-center justify-center">
                    <HelpCircle size={24} color={colors.mutedForeground} style={{ marginBottom: 6, opacity: 0.5 }} />
                    <Text className="text-xs font-bold" style={{ color: colors.mutedForeground }}>No attachments uploaded</Text>
                  </View>
                ) : (
                  <View className="space-y-3.5">
                    {/* Image attachment card */}
                    {imageMedia && (
                      <View className="rounded-xl border p-3 flex-row items-center justify-between" style={{ borderColor: colors.cardBorder, backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(0, 0, 0, 0.01)' }}>
                        <TouchableOpacity onPress={() => setIsPreviewImageOpen(true)} className="flex-row items-center flex-1 mr-3">
                          <Image source={{ uri: imageMedia.url }} className="w-12 h-12 rounded bg-slate-500 mr-3 border border-slate-700" resizeMode="cover" />
                          <View className="flex-1">
                            <Text className="text-xs font-bold truncate" style={{ color: colors.foreground }}>Attached Site Image</Text>
                            <Text className="text-[9px] text-blue-500 font-bold">Tap to view full photo</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Doc attachment card */}
                    {docMedia && (
                      <View className="rounded-xl border p-3 flex-row items-center justify-between" style={{ borderColor: colors.cardBorder, backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(0, 0, 0, 0.01)' }}>
                        <TouchableOpacity onPress={() => onOpenDoc(docMedia.url)} className="flex-row items-center flex-1 mr-3">
                          <View className="w-11 h-11 rounded justify-center items-center bg-blue-500/10 mr-3">
                            <FileText size={20} color="#3b82f6" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs font-bold truncate" style={{ color: colors.foreground }}>Supporting Document File</Text>
                            <Text className="text-[9px] text-blue-500 font-bold">Tap to view PDF/Doc</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Audio voice recording card */}
                    {voiceMedia && (
                      <View className="rounded-xl border p-3 flex-row items-center justify-between" style={{ borderColor: colors.cardBorder, backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(0, 0, 0, 0.01)' }}>
                        <View className="flex-row items-center flex-1 mr-3">
                          <TouchableOpacity 
                            onPress={() => onPlayAudio(voiceMedia.url)} 
                            className="w-9 h-9 rounded-full justify-center items-center mr-3 border"
                            style={{ 
                              backgroundColor: isPlayingAudio ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)', 
                              borderColor: isPlayingAudio ? '#10b981' : '#3b82f6' 
                            }}
                          >
                            {isPlayingAudio ? <Square size={12} color="#10b981" /> : <Play size={12} color="#3b82f6" />}
                          </TouchableOpacity>
                          <View className="flex-1">
                            <Text className="text-xs font-bold" style={{ color: colors.foreground }}>Voice Recording</Text>
                            <Text className="text-[9px]" style={{ color: colors.mutedForeground }}>
                              {isPlayingAudio ? 'Playing back clip...' : 'Tap to hear voice clip'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>

          </ScrollView>
        </View>
      </View>

      {/* Full Screen Photo Preview modal */}
      {imageMedia && (
        <Modal visible={isPreviewImageOpen} transparent={true} animationType="fade" onRequestClose={() => setIsPreviewImageOpen(false)}>
          <View className="flex-1 justify-center items-center bg-black/90 p-4">
            <TouchableOpacity className="absolute top-12 right-6 p-3 bg-white/10 rounded-full" onPress={() => setIsPreviewImageOpen(false)}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
            <Image 
              source={{ uri: imageMedia.url }} 
              className="w-full h-[70%]" 
              resizeMode="contain" 
            />
            <Text className="text-white text-xs mt-4 font-bold">Attached Site Image Preview</Text>
          </View>
        </Modal>
      )}
    </Modal>
  );
};
