import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Image as ImageIcon, FileText, Mic, Trash2, Square, Play } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

interface AttachmentsSectionProps {
  imageFile: ImagePicker.ImagePickerAsset | null;
  onPickImage: () => void;
  onClearImage: () => void;
  onViewImage: () => void;
  docFile: DocumentPicker.DocumentPickerAsset | null;
  onPickDoc: () => void;
  onClearDoc: () => void;
  onViewDoc: () => void;
  audioUri: string | null;
  isRecording: boolean;
  recordDuration: number;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onClearAudio: () => void;
  isPlaying: boolean;
  onPlayAudio: () => void;
}

export const AttachmentsSection: React.FC<AttachmentsSectionProps> = ({
  imageFile,
  onPickImage,
  onClearImage,
  onViewImage,
  docFile,
  onPickDoc,
  onClearDoc,
  onViewDoc,
  audioUri,
  isRecording,
  recordDuration,
  onStartRecord,
  onStopRecord,
  onClearAudio,
  isPlaying,
  onPlayAudio,
}) => {
  const { theme, colors } = useTheme();

  const formatDuration = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View className="space-y-4">
      <Text className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: colors.mutedForeground }}>
        Ingestion Attachments
      </Text>

      {/* PHOTO ATTACHMENT CARD */}
      <View 
        className="rounded-xl border p-4" 
        style={{ 
          backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.25)' : 'rgba(0, 0, 0, 0.01)', 
          borderColor: colors.cardBorder 
        }}
      >
        <Text className="text-[10px] font-black uppercase tracking-wider mb-2.5" style={{ color: colors.mutedForeground }}>Attach Photo</Text>
        
        {imageFile ? (
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={onViewImage} className="flex-row items-center flex-1 mr-3">
              <Image source={{ uri: imageFile.uri }} className="w-14 h-14 rounded-lg mr-3 bg-slate-500 border border-slate-700" resizeMode="cover" />
              <View className="flex-1">
                <Text className="text-xs font-bold truncate" style={{ color: colors.foreground }}>{imageFile.fileName || 'photo-attachment.jpg'}</Text>
                <Text className="text-[10px] text-blue-500 font-bold">Tap to view image</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onClearImage}
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)' }}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            onPress={onPickImage}
            className="w-full py-3.5 rounded-xl border border-dashed justify-center items-center flex-row"
            style={{ borderColor: colors.cardBorder }}
          >
            <ImageIcon size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <Text className="text-xs font-bold" style={{ color: colors.primary }}>Choose Photo from Library</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* DOCUMENT ATTACHMENT CARD */}
      <View 
        className="rounded-xl border p-4" 
        style={{ 
          backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.25)' : 'rgba(0, 0, 0, 0.01)', 
          borderColor: colors.cardBorder 
        }}
      >
        <Text className="text-[10px] font-black uppercase tracking-wider mb-2.5" style={{ color: colors.mutedForeground }}>Supporting Document (PDF, Doc, Text)</Text>
        
        {docFile ? (
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={onViewDoc} className="flex-row items-center flex-1 mr-3">
              <View className="w-11 h-11 rounded-lg mr-3 justify-center items-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                <FileText size={20} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold truncate" style={{ color: colors.foreground }}>{docFile.name}</Text>
                <Text className="text-[10px] text-blue-500 font-bold">Tap to view document</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onClearDoc}
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)' }}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            onPress={onPickDoc}
            className="w-full py-3.5 rounded-xl border border-dashed justify-center items-center flex-row"
            style={{ borderColor: colors.cardBorder }}
          >
            <FileText size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <Text className="text-xs font-bold" style={{ color: colors.primary }}>Upload Document File</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* VOICE RECORDING CARD */}
      <View 
        className="rounded-xl border p-4" 
        style={{ 
          backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.25)' : 'rgba(0, 0, 0, 0.01)', 
          borderColor: colors.cardBorder 
        }}
      >
        <Text className="text-[10px] font-black uppercase tracking-wider mb-2.5" style={{ color: colors.mutedForeground }}>Voice suggestion</Text>
        
        {isRecording ? (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-3 h-3 rounded-full bg-rose-500 mr-2 animate-ping" />
              <Text className="text-xs font-bold text-rose-500">Recording Suggestion...</Text>
              <Text className="font-mono text-xs font-extrabold ml-3" style={{ color: colors.foreground }}>{formatDuration(recordDuration)}</Text>
            </View>
            <TouchableOpacity 
              onPress={onStopRecord}
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)' }}
            >
              <Square size={16} color="#f43f5e" />
            </TouchableOpacity>
          </View>
        ) : audioUri ? (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <TouchableOpacity 
                onPress={onPlayAudio} 
                className="w-10 h-10 rounded-full justify-center items-center mr-3 border"
                style={{ 
                  backgroundColor: isPlaying ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)', 
                  borderColor: isPlaying ? '#10b981' : '#3b82f6' 
                }}
              >
                {isPlaying ? <Square size={14} color="#10b981" /> : <Play size={14} color="#3b82f6" />}
              </TouchableOpacity>
              <View>
                <Text className="text-xs font-bold text-indigo-500">Voice Recording Captured</Text>
                <Text className="text-[10px]" style={{ color: colors.mutedForeground }}>
                  {isPlaying ? 'Playing recorded voice...' : 'Tap to listen before submit'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={onClearAudio}
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)' }}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            onPress={onStartRecord}
            className="w-full py-3.5 rounded-xl border border-dashed justify-center items-center flex-row"
            style={{ borderColor: colors.cardBorder }}
          >
            <Mic size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <Text className="text-xs font-bold" style={{ color: colors.primary }}>Start Voice Recording</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
