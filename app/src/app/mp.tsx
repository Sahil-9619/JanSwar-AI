import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogOut, RefreshCw, Sun, Moon } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Audio } from 'expo-av';

import { useTheme } from '../context/ThemeContext';
import { ParticleBackground } from '../components/ParticleBackground';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { Suggestion } from '../types/suggestion';

// Import Modular Representative Components
import { MpMetricsSummary } from '../components/representative/MpMetricsSummary';
import { MpGrievanceList } from '../components/representative/MpGrievanceList';
import { MpDetailsModal } from '../components/representative/MpDetailsModal';
import { MpAiCommanderModal, DraggableAiFab } from '../components/representative/MpAiCommanderModal';
import { SignOutModal } from '../components/SignOutModal';
import { PdfViewerModal } from '../components/representative/PdfViewerModal';

export default function MpDashboard() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();
  const { user, logout } = useAuthStore();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // AI Command Center states
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: "Hello Representative. I am your JanSwar AI dashboard assistant.\n\nYou can type natural language commands to search, filter, or summarize grievances.\n\nTry typing:\n• 'show high priority'\n• 'filter road department'\n• 'status pending'\n• 'reset filters'"
    }
  ]);

  // Selected suggestion for detailed modal view
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);

  // Audio Playback states in details modal
  const [playbackSound, setPlaybackSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [docViewerUrl, setDocViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Clean playback sound on unmount
  useEffect(() => {
    return () => {
      if (playbackSound) {
        playbackSound.unloadAsync();
      }
    };
  }, [playbackSound]);

  // Trigger pincode location resolution when a valid 6-digit PIN is entered
  useEffect(() => {
    if (aiInput === 'reset' || aiInput === 'clear') {
      setFilteredSuggestions(suggestions);
    }
  }, [aiInput]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setListError(null);
    try {
      const res = await api.get('/suggestions');
      const data = res.data.suggestions || [];
      setSuggestions(data);
      setFilteredSuggestions(data);
    } catch (err: any) {
      setListError(err.response?.data?.error || 'Failed to load suggestions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAiCommand = (customCommand?: string) => {
    const cmd = (customCommand || aiInput).trim();
    if (!cmd) return;

    // Append user message
    const newHistory = [...chatHistory, { sender: 'user' as const, text: cmd }];
    setChatHistory(newHistory);
    setAiInput('');

    const query = cmd.toLowerCase();
    let responseText = '';
    let newList = [...suggestions];

    if (query.includes('priority') || query.includes('critical') || query.includes('high score') || query.includes('important')) {
      newList = suggestions.filter(s => s.priorityScore && s.priorityScore.finalScore >= 70);
      responseText = `I have filtered the dashboard to show critical/high-priority problems (AI Priority Score >= 70). Found ${newList.length} matching grievances.`;
    } else if (query.includes('reset') || query.includes('clear') || query.includes('all') || query.includes('show all')) {
      newList = suggestions;
      responseText = `I have reset all filters. Showing all ${suggestions.length} submitted citizen suggestions.`;
    } else if (query.includes('pending')) {
      newList = suggestions.filter(s => s.status === 'PENDING');
      responseText = `Filtering dashboard to show suggestions with status 'PENDING'. Found ${newList.length} items.`;
    } else if (query.includes('processing') || query.includes('active')) {
      newList = suggestions.filter(s => s.status === 'PROCESSING');
      responseText = `Filtering suggestions with status 'PROCESSING'. Found ${newList.length} active items.`;
    } else if (query.includes('analyzed') || query.includes('complete')) {
      newList = suggestions.filter(s => s.status === 'ANALYZED' || s.status === 'APPROVED');
      responseText = `Filtering suggestions marked as 'AI ANALYZED' or 'APPROVED'. Found ${newList.length} items.`;
    } else if (query.includes('rejected')) {
      newList = suggestions.filter(s => s.status === 'REJECTED');
      responseText = `Filtering suggestions marked as 'REJECTED'. Found ${newList.length} items.`;
    } else if (query.includes('road')) {
      newList = suggestions.filter(s => s.category?.name.toLowerCase().includes('road') || s.title.toLowerCase().includes('road') || (s.description && s.description.toLowerCase().includes('road')));
      responseText = `Filtering suggestions relating to 'Roads'. Found ${newList.length} items.`;
    } else if (query.includes('water')) {
      newList = suggestions.filter(s => s.category?.name.toLowerCase().includes('water') || s.title.toLowerCase().includes('water') || (s.description && s.description.toLowerCase().includes('water')));
      responseText = `Filtering suggestions relating to 'Water'. Found ${newList.length} items.`;
    } else if (query.includes('health') || query.includes('hospital')) {
      newList = suggestions.filter(s => s.category?.name.toLowerCase().includes('health') || s.title.toLowerCase().includes('health') || (s.description && s.description.toLowerCase().includes('health')));
      responseText = `Filtering suggestions relating to 'Health/Hospitals'. Found ${newList.length} items.`;
    } else if (query.includes('garbage') || query.includes('waste') || query.includes('clean')) {
      newList = suggestions.filter(s => s.category?.name.toLowerCase().includes('waste') || s.title.toLowerCase().includes('waste') || (s.description && s.description.toLowerCase().includes('waste')));
      responseText = `Filtering suggestions relating to 'Waste/Garbage'. Found ${newList.length} items.`;
    } else if (query.includes('summarize') || query.includes('summary')) {
      const avgScore = suggestions.length > 0
        ? (suggestions.reduce((acc, curr) => acc + (curr.priorityScore?.finalScore || 0), 0) / suggestions.length).toFixed(0)
        : 0;
      responseText = `**JanSwar AI Summary Report**:\n• Total Grievances: ${suggestions.length}\n• Pending: ${pendingCount}\n• Active: ${processingCount}\n• Analyzed: ${analyzedCount}\n• Avg Priority Score: ${avgScore}/100.`;
    } else {
      // General search filter
      newList = suggestions.filter(s =>
        s.title.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query)) ||
        s.block?.name?.toLowerCase().includes(query) ||
        s.village?.name?.toLowerCase().includes(query)
      );
      if (newList.length > 0) {
        responseText = `Filtering suggestions containing search phrase "${cmd}". Found ${newList.length} items.`;
      } else {
        responseText = `I searched for "${cmd}" across titles, descriptions, and addresses, but found no matching citizen grievances.`;
      }
    }

    setFilteredSuggestions(newList);
    setChatHistory([...newHistory, { sender: 'ai' as const, text: responseText }]);
  };


  const handlePlayAudio = async (audioUrl: string) => {
    try {
      if (playbackSound) {
        if (isPlayingAudio) {
          await playbackSound.pauseAsync();
          setIsPlayingAudio(false);
        } else {
          await playbackSound.playAsync();
          setIsPlayingAudio(true);
        }
      } else {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }
        );

        setPlaybackSound(newSound);
        setIsPlayingAudio(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlayingAudio(false);
            newSound.unloadAsync();
            setPlaybackSound(null);
          }
        });
      }
    } catch (err) {
      console.error('Audio play error:', err);
      Alert.alert('Error', 'Failed to play recorded voice.');
    }
  };

  const handleOpenDoc = (docUrl: string) => {
    setDocViewerUrl(docUrl);
  };

  const handleCloseModal = async () => {
    if (playbackSound) {
      await playbackSound.stopAsync();
      await playbackSound.unloadAsync();
      setPlaybackSound(null);
      setIsPlayingAudio(false);
    }
    setSelectedSuggestion(null);
  };

  const handleLogout = () => {
    setIsSignOutOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setIsSignOutOpen(false);
    await logout();
    router.replace('/');
  };

  // Status Metrics counts
  const totalCount = suggestions.length;
  const pendingCount = suggestions.filter(s => s.status === 'PENDING').length;
  const processingCount = suggestions.filter(s => s.status === 'PROCESSING').length;
  const analyzedCount = suggestions.filter(s => s.status === 'ANALYZED' || s.status === 'APPROVED').length;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ParticleBackground />

      {/* MP Premium Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b" style={{ borderColor: colors.cardBorder }}>
        <View className="flex-row items-center">
          <View
            className="w-10 h-10 rounded-xl justify-center items-center mr-3 bg-white overflow-hidden border"
            style={{ borderColor: 'rgba(249, 115, 22, 0.2)' }}
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
              JanSwar <Text style={{ color: '#f97316' }}>Representative</Text>
            </Text>
            <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.mutedForeground }}>Representative Portal</Text>
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

      <ScrollView contentContainerClassName="px-6 py-6 pb-24" showsVerticalScrollIndicator={false}>

        {/* Welcome representative card */}
        <Animated.View entering={FadeInUp.duration(500)} className="mb-6">
          <Text className="text-2xl font-black" style={{ color: colors.foreground }}>Representative Dashboard</Text>
          <Text className="text-xs font-semibold mt-1 leading-relaxed" style={{ color: colors.mutedForeground }}>
            Monitor submitted public infrastructure issues, review AI analysis & scores, and update progress states.
          </Text>
        </Animated.View>

        {/* MP Metrics summary Row */}
        <MpMetricsSummary
          totalCount={totalCount}
          pendingCount={pendingCount}
          processingCount={processingCount}
          analyzedCount={analyzedCount}
        />

        {/* Suggestion List Container */}
        <MpGrievanceList
          filteredSuggestions={filteredSuggestions}
          isLoading={isLoading}
          listError={listError}
          onSelectSuggestion={(item) => {
            setSelectedSuggestion(item);
          }}
        />

      </ScrollView>

      {/* FLOATING ACTION AI CHAT FAB - Draggable with JanSwar Logo */}
      <DraggableAiFab onPress={() => setIsAiOpen(true)} />

      {/* AI COMMAND CENTER MODAL */}
      <MpAiCommanderModal
        visible={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        aiInput={aiInput}
        setAiInput={setAiInput}
        chatHistory={chatHistory}
        onSendAiCommand={handleSendAiCommand}
      />

      {/* DETAIL MODAL OVERLAY */}
      <MpDetailsModal
        selectedSuggestion={selectedSuggestion}
        onClose={handleCloseModal}
        isPlayingAudio={isPlayingAudio}
        onPlayAudio={handlePlayAudio}
        onOpenDoc={handleOpenDoc}
      />

      {/* SIGN OUT CONFIRMATION MODAL */}
      <SignOutModal
        visible={isSignOutOpen}
        onClose={() => setIsSignOutOpen(false)}
        onConfirm={handleLogoutConfirm}
      />

      {/* PDF / DOCUMENT VIEWER MODAL */}
      <PdfViewerModal
        visible={docViewerUrl !== null}
        docUrl={docViewerUrl}
        onClose={() => setDocViewerUrl(null)}
      />
    </SafeAreaView>
  );
}
