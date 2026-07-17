import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { 
  X, ChevronRight, Check, MapPin, Send, AlertCircle, 
  FileText, BookOpen, Layers, Map, Navigation, Home, Hash, Globe, Compass
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';

import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { AttachmentsSection } from './AttachmentsSection';

interface SuggestionWizardModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export const SuggestionWizardModal: React.FC<SuggestionWizardModalProps> = ({
  visible,
  onClose,
  onSubmitSuccess,
}) => {
  const { theme, colors } = useTheme();

  // Metadata dropdown selection lists state
  const [categories, setCategories] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  // Selected Geography IDs and Text Input states
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [districtInput, setDistrictInput] = useState('');
  const [showDistrictList, setShowDistrictList] = useState(false);

  const [selectedBlock, setSelectedBlock] = useState('');
  const [blockInput, setBlockInput] = useState('');
  const [showBlockList, setShowBlockList] = useState(false);

  const [selectedVillage, setSelectedVillage] = useState('');
  const [villageInput, setVillageInput] = useState('');
  const [showVillageList, setShowVillageList] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryList, setShowCategoryList] = useState(false);

  const [pincodeInput, setPincodeInput] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Coordinates Geolocation detection states
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Real Upload Attachments states
  const [imageFile, setImageFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [docFile, setDocFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  // Image Preview Overlay Modal State
  const [isPreviewImageOpen, setIsPreviewImageOpen] = useState(false);

  // Audio recording states
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordTimer, setRecordTimer] = useState<any>(null);

  // Playback sound states
  const [playbackSound, setPlaybackSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchMetadata();
    }
  }, [visible]);

  // Clean record timer interval and playback sound on unmount/reset
  useEffect(() => {
    return () => {
      if (recordTimer) clearInterval(recordTimer);
      if (playbackSound) {
        playbackSound.unloadAsync();
      }
    };
  }, [recordTimer, playbackSound]);

  // Trigger pincode location resolution when a valid 6-digit PIN is entered
  useEffect(() => {
    if (pincodeInput && pincodeInput.length === 6) {
      resolveLocationFromPincode(pincodeInput);
    }
  }, [pincodeInput]);

  const fetchMetadata = async () => {
    try {
      const catRes = await api.get('/categories');
      setCategories(catRes.data.categories || []);

      const distRes = await api.get('/locations/districts');
      setDistricts(distRes.data.districts || []);
    } catch (err) {
      console.error('Failed to load metadata in modal:', err);
    }
  };

  // Fetch blocks when district changes
  useEffect(() => {
    if (selectedDistrict) {
      api.get(`/locations/districts/${selectedDistrict}/blocks`)
        .then(res => {
          setBlocks(res.data.blocks || []);
          setVillages([]);
          setSelectedBlock('');
          setBlockInput('');
          setSelectedVillage('');
          setVillageInput('');
        })
        .catch(err => console.error('Fetch blocks error:', err));
    } else {
      setBlocks([]);
      setVillages([]);
    }
  }, [selectedDistrict]);

  // Fetch villages when block changes
  useEffect(() => {
    if (selectedBlock) {
      api.get(`/locations/blocks/${selectedBlock}/villages`)
        .then(res => {
          setVillages(res.data.villages || []);
          setSelectedVillage('');
          setVillageInput('');
        })
        .catch(err => console.error('Fetch villages error:', err));
    } else {
      setVillages([]);
    }
  }, [selectedBlock]);

  // Image selection pick handler
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant library access to select photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageFile(result.assets[0]);
      }
    } catch (err) {
      console.error('Image picking error:', err);
    }
  };

  // Document selection pick handler
  const handlePickDoc = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocFile(result.assets[0]);
      }
    } catch (err) {
      console.error('Document picking error:', err);
    }
  };

  // Document view trigger handler
  const handleViewDoc = async () => {
    if (docFile) {
      try {
        await Linking.openURL(docFile.uri);
      } catch (err) {
        // Fallback info alert if system handler fails to open local cache URI
        Alert.alert(
          'Document Selected', 
          `Name: ${docFile.name}\nSize: ${(docFile.size ? docFile.size / 1024 : 0).toFixed(0)} KB\nType: ${docFile.mimeType || 'unknown'}`
        );
      }
    }
  };

  // Audio start recording handler
  const handleStartRecord = async () => {
    try {
      // Stop playing if something was playing
      if (playbackSound) {
        await playbackSound.stopAsync();
        await playbackSound.unloadAsync();
        setPlaybackSound(null);
        setIsPlayingAudio(false);
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant microphone access to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordDuration(0);

      const interval = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
      setRecordTimer(interval);
    } catch (err) {
      console.error('Microphone recording failed:', err);
      Alert.alert('Error', 'Microphone recording failed.');
    }
  };

  // Audio stop recording handler
  const handleStopRecord = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setAudioUri(uri);
        setRecording(null);
        setIsRecording(false);
        if (recordTimer) {
          clearInterval(recordTimer);
          setRecordTimer(null);
        }
      }
    } catch (err) {
      console.error('Failed to stop audio recording:', err);
    }
  };

  const handleClearAudio = async () => {
    if (playbackSound) {
      await playbackSound.stopAsync();
      await playbackSound.unloadAsync();
      setPlaybackSound(null);
      setIsPlayingAudio(false);
    }
    setAudioUri(null);
    setRecordDuration(0);
  };

  // Hear audio playback handler
  const handlePlayAudio = async () => {
    try {
      if (playbackSound) {
        if (isPlayingAudio) {
          await playbackSound.pauseAsync();
          setIsPlayingAudio(false);
        } else {
          await playbackSound.playAsync();
          setIsPlayingAudio(true);
        }
      } else if (audioUri) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
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
      console.error('Audio playback error:', err);
      Alert.alert('Error', 'Could not play back audio clip.');
    }
  };

  // Reverse geocoding matching helper
  const matchAndLoadGeographics = async (distName: string, blkName: string, vilName: string) => {
    try {
      const matchedDist = districts.find(d => d.name.toLowerCase() === distName.toLowerCase());
      if (matchedDist) {
        setSelectedDistrict(matchedDist.id);
        
        const blocksRes = await api.get(`/locations/districts/${matchedDist.id}/blocks`);
        const fetchedBlocks = blocksRes.data.blocks || [];
        setBlocks(fetchedBlocks);

        const matchedBlk = fetchedBlocks.find((b: any) => 
          b.name.toLowerCase() === blkName.toLowerCase() || 
          b.name.toLowerCase().includes(blkName.toLowerCase())
        );

        if (matchedBlk) {
          setSelectedBlock(matchedBlk.id);

          const villagesRes = await api.get(`/locations/blocks/${matchedBlk.id}/villages`);
          const fetchedVillages = villagesRes.data.villages || [];
          setVillages(fetchedVillages);

          const matchedVil = fetchedVillages.find((v: any) => 
            v.name.toLowerCase() === vilName.toLowerCase() || 
            v.name.toLowerCase().includes(vilName.toLowerCase())
          );
          if (matchedVil) {
            setSelectedVillage(matchedVil.id);
          }
        }
      }
    } catch (err) {
      console.error('Prefilling geography failed:', err);
    }
  };

  const resolveLocationFromPincode = async (pin: string) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${pin}&country=India&format=json&addressdetails=1`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const result = data[0];
          const latVal = parseFloat(result.lat);
          const lonVal = parseFloat(result.lon);
          setLat(latVal);
          setLng(lonVal);

          const address = result.address;
          if (address) {
            const detectedDistrict = address.county || address.city || address.district || address.state_district || '';
            const detectedBlock = address.suburb || address.city_district || address.town || address.municipality || address.city || '';
            const detectedVillage = address.village || address.hamlet || address.neighbourhood || address.suburb || address.road || '';

            const cleanDistrict = detectedDistrict.replace(/\s*District/gi, '').trim();
            const cleanBlock = detectedBlock.trim();
            const cleanVillage = detectedVillage.trim();

            if (cleanDistrict) setDistrictInput(cleanDistrict);
            if (cleanBlock) setBlockInput(cleanBlock);
            if (cleanVillage) setVillageInput(cleanVillage);

            await matchAndLoadGeographics(cleanDistrict || 'Patna', cleanBlock || 'Patna Sadar', cleanVillage || 'Polson Village');
          }
        }
      }
    } catch (err) {
      console.error('Pincode geocoding error:', err);
    }
  };

  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permissions to fetch accurate coordinates.');
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;
      setLat(latitude);
      setLng(longitude);

      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocode && geocode.length > 0) {
        const address = geocode[0];
        
        const detectedDistrict = address.subregion || address.district || address.city || '';
        const detectedBlock = address.city || address.subregion || address.region || '';
        const detectedVillage = address.street || address.name || address.district || '';
        const detectedPincode = address.postalCode || '';

        const cleanDistrict = detectedDistrict.trim();
        const cleanBlock = detectedBlock.trim();
        const cleanVillage = detectedVillage.trim();
        const cleanPincode = detectedPincode.trim();

        if (cleanPincode) setPincodeInput(cleanPincode);
        if (cleanDistrict) setDistrictInput(cleanDistrict);
        if (cleanBlock) setBlockInput(cleanBlock);
        if (cleanVillage) setVillageInput(cleanVillage);

        await matchAndLoadGeographics(cleanDistrict || 'Patna', cleanBlock || 'Patna Sadar', cleanVillage || 'Polson Village');
      } else {
        // Fallback to OSM Nominatim
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
        if (response.ok) {
          const data = await response.json();
          const address = data.address;
          if (address) {
            const detectedDistrict = address.county || address.city || address.district || address.state_district || '';
            const detectedBlock = address.suburb || address.city_district || address.town || '';
            const detectedVillage = address.village || address.hamlet || address.neighbourhood || address.road || '';
            const detectedPincode = address.postcode || '';

            const cleanDistrict = detectedDistrict.replace(/\s*District/gi, '').trim();
            const cleanBlock = detectedBlock.trim();
            const cleanVillage = detectedVillage.trim();
            const cleanPincode = detectedPincode.trim();

            if (cleanPincode) setPincodeInput(cleanPincode);
            if (cleanDistrict) setDistrictInput(cleanDistrict);
            if (cleanBlock) setBlockInput(cleanBlock);
            if (cleanVillage) setVillageInput(cleanVillage);

            await matchAndLoadGeographics(cleanDistrict || 'Patna', cleanBlock || 'Patna Sadar', cleanVillage || 'Polson Village');
          }
        }
      }
    } catch (err) {
      console.warn('Geolocation access failed. Falling back to Patna Sadar, Bihar coordinates.', err);
      setLat(25.5941);
      setLng(85.1376);
      setDistrictInput('Patna');
      setBlockInput('Patna Sadar');
      setVillageInput('Polson Village');
      setPincodeInput('800001');
      await matchAndLoadGeographics('Patna', 'Patna Sadar', 'Polson Village');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmitSuggestion = async () => {
    setSubmitError(null);
    if (!title) {
      setSubmitError('Suggestion Title is required.');
      return;
    }
    if (!lat || !lng) {
      setSubmitError('GPS Coordinates are required. Please tap "Detect GPS Coordinates".');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    
    let finalDescription = description;
    const customLocs = [];
    if (!selectedDistrict && districtInput) customLocs.push(`District: ${districtInput}`);
    if (!selectedBlock && blockInput) customLocs.push(`Block: ${blockInput}`);
    if (!selectedVillage && villageInput) customLocs.push(`Village: ${villageInput}`);
    if (pincodeInput) customLocs.push(`Pincode: ${pincodeInput}`);
    
    if (customLocs.length > 0) {
      finalDescription = `${description}\n\n[Custom Location Details]\n${customLocs.join('\n')}`;
    }
    formData.append('description', finalDescription);
    formData.append('latitude', lat.toString());
    formData.append('longitude', lng.toString());
    
    if (selectedCategory) formData.append('categoryId', selectedCategory);
    if (selectedDistrict) formData.append('districtId', selectedDistrict);
    if (selectedBlock) formData.append('blockId', selectedBlock);
    if (selectedVillage) formData.append('villageId', selectedVillage);

    // Append Audio file
    if (audioUri) {
      formData.append('audio', {
        uri: Platform.OS === 'android' ? audioUri : audioUri.replace('file://', ''),
        name: 'voice-suggestion.m4a',
        type: 'audio/m4a',
      } as any);
    }

    // Append Image file
    if (imageFile) {
      formData.append('image', {
        uri: Platform.OS === 'android' ? imageFile.uri : imageFile.uri.replace('file://', ''),
        name: imageFile.fileName || 'photo-suggestion.jpg',
        type: imageFile.mimeType || 'image/jpeg',
      } as any);
    }

    // Append Document file
    if (docFile) {
      formData.append('document', {
        uri: Platform.OS === 'android' ? docFile.uri : docFile.uri.replace('file://', ''),
        name: docFile.name || 'supporting-document.pdf',
        type: docFile.mimeType || 'application/pdf',
      } as any);
    }

    try {
      await api.post('/suggestions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Success', 'Problems submitted to AI Engine successfully!');
      
      // Stop audio if playing
      if (playbackSound) {
        await playbackSound.stopAsync();
        await playbackSound.unloadAsync();
        setPlaybackSound(null);
        setIsPlayingAudio(false);
      }

      // Reset variables
      setTitle('');
      setDescription('');
      setSelectedCategory('');
      setSelectedDistrict('');
      setDistrictInput('');
      setSelectedBlock('');
      setBlockInput('');
      setSelectedVillage('');
      setVillageInput('');
      setPincodeInput('');
      setLat(null);
      setLng(null);
      setImageFile(null);
      setDocFile(null);
      setAudioUri(null);
      onSubmitSuccess();
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || 'Failed to submit problems.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // If recording in progress, stop it first
    if (isRecording) {
      handleStopRecord();
    }
    // If audio is playing, stop it
    if (playbackSound) {
      playbackSound.stopAsync().then(() => {
        playbackSound.unloadAsync();
        setPlaybackSound(null);
        setIsPlayingAudio(false);
      });
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View 
          className="w-full rounded-t-[2.5rem] overflow-hidden flex-col justify-between"
          style={{ backgroundColor: colors.background, height: '90%', borderTopWidth: 1, borderColor: colors.cardBorder }}
        >
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-6 py-5 border-b" style={{ borderColor: colors.cardBorder, backgroundColor: colors.card }}>
            <View>
              <Text className="text-xl font-black flex-row items-center" style={{ color: colors.foreground }}>
                Submit Problems
              </Text>
            </View>
            <TouchableOpacity className="p-2.5 rounded-full bg-slate-500/10" onPress={handleClose}>
              <X size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerClassName="p-6 flex-grow" 
            keyboardShouldPersistTaps="handled" 
            showsVerticalScrollIndicator={false}
            style={{ marginBottom: 10 }}
          >
            {submitError && (
              <View className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex-row items-start mb-6">
                <AlertCircle size={18} color="#rose-500" style={{ marginRight: 8, marginTop: 2 }} />
                <Text className="text-rose-500 font-bold text-xs flex-1">{submitError}</Text>
              </View>
            )}

            {/* SECTION 1: PROBLEM DETAILS */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3.5">
                <FileText size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text className="text-[11px] font-black uppercase tracking-widest" style={{ color: colors.primary }}>
                  1. Problem details
                </Text>
              </View>

              <View 
                className="rounded-2xl border p-5 shadow-sm" 
                style={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.2)' : 'rgba(255, 255, 255, 0.4)', 
                  borderColor: colors.cardBorder 
                }}
              >
                {/* Title Input */}
                <Text className="text-[10px] font-black uppercase tracking-wider mb-2.5" style={{ color: colors.mutedForeground }}>Problem Title *</Text>
                <View 
                  className="flex-row items-center rounded-xl px-4 border mb-5" 
                  style={{ 
                    height: 50, 
                    backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.25)' : 'rgba(0, 0, 0, 0.02)', 
                    borderColor: colors.cardBorder 
                  }}
                >
                  <FileText size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Repair damaged bridge at Village entry"
                    placeholderTextColor={colors.mutedForeground}
                    className="flex-1 text-[13px] font-medium"
                    style={{ color: colors.foreground }}
                  />
                </View>

                {/* Description Input */}
                <Text className="text-[10px] font-black uppercase tracking-wider mb-2.5" style={{ color: colors.mutedForeground }}>Detailed Description</Text>
                <View 
                  className="flex-row items-start rounded-xl px-4 py-3 border mb-5" 
                  style={{ 
                    height: 100, 
                    backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.25)' : 'rgba(0, 0, 0, 0.02)', 
                    borderColor: colors.cardBorder 
                  }}
                >
                  <BookOpen size={18} color={colors.mutedForeground} style={{ marginRight: 10, marginTop: 2 }} />
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Provide details about the infrastructure gap. (Optional if submitting Voice recording)"
                    placeholderTextColor={colors.mutedForeground}
                    multiline
                    numberOfLines={4}
                    className="flex-1 text-[13px] font-medium text-start h-full"
                    style={{ color: colors.foreground, textAlignVertical: 'top' }}
                  />
                </View>

                {/* Category Selection */}
                <Text className="text-[10px] font-black uppercase tracking-wider mb-2.5" style={{ color: colors.mutedForeground }}>Category</Text>
                <TouchableOpacity 
                  onPress={() => setShowCategoryList(!showCategoryList)}
                  className="w-full rounded-xl px-4 border flex-row justify-between items-center"
                  style={{ 
                    height: 50,
                    backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.25)' : 'rgba(0, 0, 0, 0.02)', 
                    borderColor: colors.cardBorder 
                  }}
                >
                  <View className="flex-row items-center">
                    <Layers size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                    <Text className="text-[13px] font-medium" style={{ color: selectedCategory ? colors.foreground : colors.mutedForeground }}>
                      {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Select Category'}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </TouchableOpacity>

                {showCategoryList && (
                  <View className="w-full mt-2 border rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
                    {categories.map((c) => (
                      <TouchableOpacity 
                        key={c.id}
                        className="py-3 px-4 border-b flex-row justify-between items-center"
                        style={{ borderColor: colors.cardBorder }}
                        onPress={() => {
                          setSelectedCategory(c.id);
                          setShowCategoryList(false);
                        }}
                      >
                        <Text style={{ color: colors.foreground }} className="font-semibold text-xs">{c.name}</Text>
                        {selectedCategory === c.id && <Check size={16} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* SECTION 2: GEOGRAPHY & LOCATION */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3.5">
                <Compass size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text className="text-[11px] font-black uppercase tracking-widest" style={{ color: colors.primary }}>
                  2. Geography & Location
                </Text>
              </View>

              <View 
                className="rounded-2xl border p-5 shadow-sm space-y-5" 
                style={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.2)' : 'rgba(255, 255, 255, 0.4)', 
                  borderColor: colors.cardBorder 
                }}
              >
                {/* GEOLOCATION COORDINATES DETECTOR */}
                <View className="p-4 rounded-xl border flex-row items-center justify-between" style={{ backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(0, 0, 0, 0.01)', borderColor: colors.cardBorder }}>
                  <View className="flex-1 mr-4">
                    <Text className="font-black text-xs" style={{ color: colors.foreground }}>GPS Location Coordinates *</Text>
                    <Text className="text-[9px] font-semibold mt-0.5" style={{ color: colors.mutedForeground }}>Required for district map integration</Text>
                    {lat && lng && (
                      <View className="flex-row items-center mt-1.5">
                        <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                        <Text className="text-[11px] font-mono font-bold text-emerald-500">Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity 
                    disabled={isLocating}
                    onPress={handleGetLocation}
                    className="py-2.5 px-4 rounded-xl border flex-row items-center"
                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.3)' }}
                  >
                    {isLocating ? (
                      <ActivityIndicator size="small" color="#3b82f6" style={{ marginRight: 6 }} />
                    ) : (
                      <>
                        <MapPin size={14} color="#3b82f6" style={{ marginRight: 5 }} />
                        <Text className="text-xs text-blue-500 font-extrabold">Detect</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* District Input */}
                <View className="relative">
                  <Text className="text-[10px] font-black uppercase tracking-wider mb-2.5" style={{ color: colors.mutedForeground }}>District *</Text>
                  <View 
                    className="flex-row items-center rounded-xl px-4 border" 
                    style={{ 
                      height: 50, 
                      backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.25)' : 'rgba(0, 0, 0, 0.02)', 
                      borderColor: colors.cardBorder 
                    }}
                  >
                    <Map size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                    <TextInput
                      value={districtInput}
                      onChangeText={(val) => {
                        setDistrictInput(val);
                        setShowDistrictList(true);
                        const matched = districts.find(d => d.name.toLowerCase() === val.toLowerCase());
                        if (matched) {
                          setSelectedDistrict(matched.id);
                        } else {
                          setSelectedDistrict('');
                          setSelectedBlock('');
                          setBlockInput('');
                          setSelectedVillage('');
                          setVillageInput('');
                        }
                      }}
                      onFocus={() => setShowDistrictList(true)}
                      placeholder="Type your district (e.g. Patna)"
                      placeholderTextColor={colors.mutedForeground}
                      className="flex-1 text-[13px] font-medium"
                      style={{ color: colors.foreground }}
                    />
                  </View>
                  {showDistrictList && districts.filter(d => d.name.toLowerCase().includes(districtInput.toLowerCase())).length > 0 && (
                    <View className="w-full mt-1.5 border rounded-xl overflow-hidden shadow-lg max-h-40" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
                      <ScrollView keyboardShouldPersistTaps="handled">
                        {districts.filter(d => d.name.toLowerCase().includes(districtInput.toLowerCase())).map((d) => (
                          <TouchableOpacity 
                            key={d.id}
                            className="py-3 px-4 border-b flex-row justify-between items-center"
                            style={{ borderColor: colors.cardBorder }}
                            onPress={() => {
                              setDistrictInput(d.name);
                              setSelectedDistrict(d.id);
                              setShowDistrictList(false);
                            }}
                          >
                            <Text style={{ color: colors.foreground }} className="font-semibold text-xs">{d.name}</Text>
                            {selectedDistrict === d.id && <Check size={14} color={colors.primary} />}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Block & Village split */}
                <View className="flex-row justify-between">
                  {/* Block Selection */}
                  <View className="w-[48%] relative">
                    <Text className="text-[10px] font-black uppercase tracking-wider mb-2.5" style={{ color: colors.mutedForeground }}>Block</Text>
                    <View 
                      className="flex-row items-center rounded-xl px-3 border" 
                      style={{ 
                        height: 50, 
                        backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.25)' : 'rgba(0, 0, 0, 0.02)', 
                        borderColor: colors.cardBorder 
                      }}
                    >
                      <Navigation size={16} color={colors.mutedForeground} style={{ marginRight: 6 }} />
                      <TextInput
                        value={blockInput}
                        onChangeText={(val) => {
                          setBlockInput(val);
                          setShowBlockList(true);
                          const matched = blocks.find(b => b.name.toLowerCase() === val.toLowerCase());
                          if (matched) {
                            setSelectedBlock(matched.id);
                          } else {
                            setSelectedBlock('');
                            setSelectedVillage('');
                            setVillageInput('');
                          }
                        }}
                        onFocus={() => setShowBlockList(true)}
                        placeholder="Type block"
                        placeholderTextColor={colors.mutedForeground}
                        className="flex-1 text-[12px] font-medium"
                        style={{ color: colors.foreground }}
                      />
                    </View>
                    {showBlockList && blocks.filter(b => b.name.toLowerCase().includes(blockInput.toLowerCase())).length > 0 && (
                      <View className="w-full mt-1.5 border rounded-xl overflow-hidden shadow-lg max-h-40 absolute z-55 top-16" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
                        <ScrollView keyboardShouldPersistTaps="handled">
                          {blocks.filter(b => b.name.toLowerCase().includes(blockInput.toLowerCase())).map((b) => (
                            <TouchableOpacity 
                              key={b.id}
                              className="py-2.5 px-3 border-b flex-row justify-between items-center"
                              style={{ borderColor: colors.cardBorder }}
                              onPress={() => {
                                setBlockInput(b.name);
                                setSelectedBlock(b.id);
                                setShowBlockList(false);
                              }}
                            >
                              <Text style={{ color: colors.foreground }} className="font-semibold text-xs">{b.name}</Text>
                              {selectedBlock === b.id && <Check size={12} color={colors.primary} />}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {/* Village Selection */}
                  <View className="w-[48%] relative">
                    <Text className="text-[10px] font-black uppercase tracking-wider mb-2.5" style={{ color: colors.mutedForeground }}>Village</Text>
                    <View 
                      className="flex-row items-center rounded-xl px-3 border" 
                      style={{ 
                        height: 50, 
                        backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.25)' : 'rgba(0, 0, 0, 0.02)', 
                        borderColor: colors.cardBorder 
                      }}
                    >
                      <Home size={16} color={colors.mutedForeground} style={{ marginRight: 6 }} />
                      <TextInput
                        value={villageInput}
                        onChangeText={(val) => {
                          setVillageInput(val);
                          setShowVillageList(true);
                          const matched = villages.find(v => v.name.toLowerCase() === val.toLowerCase());
                          if (matched) {
                            setSelectedVillage(matched.id);
                          } else {
                            setSelectedVillage('');
                          }
                        }}
                        onFocus={() => setShowVillageList(true)}
                        placeholder="Type village"
                        placeholderTextColor={colors.mutedForeground}
                        className="flex-1 text-[12px] font-medium"
                        style={{ color: colors.foreground }}
                      />
                    </View>
                    {showVillageList && villages.filter(v => v.name.toLowerCase().includes(villageInput.toLowerCase())).length > 0 && (
                      <View className="w-full mt-1.5 border rounded-xl overflow-hidden shadow-lg max-h-40 absolute z-55 top-16" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
                        <ScrollView keyboardShouldPersistTaps="handled">
                          {villages.filter(v => v.name.toLowerCase().includes(villageInput.toLowerCase())).map((v) => (
                            <TouchableOpacity 
                              key={v.id}
                              className="py-2.5 px-3 border-b flex-row justify-between items-center"
                              style={{ borderColor: colors.cardBorder }}
                              onPress={() => {
                                setVillageInput(v.name);
                                setSelectedVillage(v.id);
                                setShowVillageList(false);
                              }}
                            >
                              <Text style={{ color: colors.foreground }} className="font-semibold text-xs">{v.name}</Text>
                              {selectedVillage === v.id && <Check size={12} color={colors.primary} />}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>

                {/* Pincode Input */}
                <View>
                  <Text className="text-[10px] font-black uppercase tracking-wider mb-2.5" style={{ color: colors.mutedForeground }}>Pincode</Text>
                  <View 
                    className="flex-row items-center rounded-xl px-4 border" 
                    style={{ 
                      height: 50, 
                      backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.25)' : 'rgba(0, 0, 0, 0.02)', 
                      borderColor: colors.cardBorder 
                    }}
                  >
                    <Hash size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                    <TextInput
                      value={pincodeInput}
                      onChangeText={setPincodeInput}
                      placeholder="Type pincode (e.g. 800001)"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numeric"
                      className="flex-1 text-[13px] font-medium"
                      style={{ color: colors.foreground }}
                    />
                  </View>
                </View>

              </View>
            </View>

            {/* SECTION 3: ATTACHMENTS */}
            <View className="mb-8">
              <View className="flex-row items-center mb-3.5">
                <Globe size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text className="text-[11px] font-black uppercase tracking-widest" style={{ color: colors.primary }}>
                  3. Ingestion Attachments
                </Text>
              </View>

              <View 
                className="rounded-2xl border p-5 shadow-sm" 
                style={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.2)' : 'rgba(255, 255, 255, 0.4)', 
                  borderColor: colors.cardBorder 
                }}
              >
                <AttachmentsSection
                  imageFile={imageFile}
                  onPickImage={handlePickImage}
                  onClearImage={() => setImageFile(null)}
                  onViewImage={() => setIsPreviewImageOpen(true)}
                  docFile={docFile}
                  onPickDoc={handlePickDoc}
                  onClearDoc={() => setDocFile(null)}
                  onViewDoc={handleViewDoc}
                  audioUri={audioUri}
                  isRecording={isRecording}
                  recordDuration={recordDuration}
                  onStartRecord={handleStartRecord}
                  onStopRecord={handleStopRecord}
                  onClearAudio={handleClearAudio}
                  isPlaying={isPlayingAudio}
                  onPlayAudio={handlePlayAudio}
                />
              </View>
            </View>

          </ScrollView>

          {/* Modal Footer (Submit Button) */}
          <View className="p-6 border-t" style={{ borderColor: colors.cardBorder, backgroundColor: colors.card }}>
            <TouchableOpacity
              disabled={isSubmitting}
              onPress={handleSubmitSuggestion}
              className="w-full py-4 rounded-full flex-row items-center justify-center shadow-lg"
              style={{ backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                  <Text className="text-white font-extrabold text-[15px]">Submitting Problems...</Text>
                </>
              ) : (
                <>
                  <Text className="text-white font-extrabold text-[15px] mr-2">Submit Problems</Text>
                  <Send size={16} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Full Screen Image Preview Modal Overlay */}
      <Modal visible={isPreviewImageOpen} transparent={true} animationType="fade" onRequestClose={() => setIsPreviewImageOpen(false)}>
        <View className="flex-1 justify-center items-center bg-black/90 p-4">
          <TouchableOpacity className="absolute top-12 right-6 p-3 bg-white/10 rounded-full" onPress={() => setIsPreviewImageOpen(false)}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          {imageFile && (
            <Image 
              source={{ uri: imageFile.uri }} 
              className="w-full h-[70%]" 
              resizeMode="contain" 
            />
          )}
          <Text className="text-white text-xs mt-4 font-bold">{imageFile?.fileName || 'photo-attachment.jpg'}</Text>
        </View>
      </Modal>
    </Modal>
  );
};
