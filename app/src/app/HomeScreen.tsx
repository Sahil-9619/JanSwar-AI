import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Lock, Moon, Sun, Mail, User, MapPin, Building2, KeyRound, ArrowLeft, ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  FadeOutDown,
  ZoomIn,
  BounceIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  LinearTransition,
} from 'react-native-reanimated';

import { useTheme } from '../context/ThemeContext';
import { ParticleBackground } from '../components/ParticleBackground';
import { useAuthStore, Role } from '../store/authStore';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const { theme, toggleTheme, colors } = useTheme();
  const { login, signup, verifySignup, isLoading, error, clearError, user, checkAuth } = useAuthStore();

  // Unified State
  const [activeView, setActiveView] = useState<'HOME' | 'AUTH'>('HOME');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'VERIFY_SIGNUP'>('LOGIN');

  // Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [otp, setOtp] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isAuth = activeView === 'AUTH';

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === 'CITIZEN') {
        router.replace('/user');
      } else {
        router.replace('/mp');
      }
    }
  }, [user]);

  // Smooth Morphing Values for the Header
  const logoSize = useSharedValue(140);
  const fontSize = useSharedValue(52);
  const logoRadius = useSharedValue(32);

  useEffect(() => {
    logoSize.value = withTiming(isAuth ? 48 : 140, { duration: 400 });
    fontSize.value = withTiming(isAuth ? 28 : 52, { duration: 400 });
    logoRadius.value = withTiming(isAuth ? 14 : 32, { duration: 400 });
  }, [isAuth]);

  const logoOuterStyle = useAnimatedStyle(() => ({
    width: logoSize.value,
    height: logoSize.value,
    borderRadius: logoRadius.value,
    marginRight: isAuth ? 12 : 0,
    marginBottom: isAuth ? 0 : 20,
  }));

  const logoInnerStyle = useAnimatedStyle(() => ({
    width: logoSize.value * 0.85,
    height: logoSize.value * 0.85,
    borderRadius: logoSize.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    fontSize: fontSize.value,
  }));

  // Actions
  const handleStart = (mode: 'LOGIN' | 'SIGNUP') => {
    setAuthMode(mode);
    setActiveView('AUTH');
    clearError();
  };

  const handleToggleMode = (newMode: 'LOGIN' | 'SIGNUP') => {
    setAuthMode(newMode);
    clearError();
  };

  const handleLoginSubmit = async () => {
    if (!loginEmail || !loginPassword) return;
    try {
      await login(loginEmail, loginPassword);
      // Success is handled globally by auth flow, but we can reset view if needed
    } catch (err) { }
  };

  const handleSignupSubmit = async () => {
    if (!fullName || !signupEmail || !signupPassword || !confirmPassword || !city || !stateName) return;
    if (signupPassword !== confirmPassword) {
      useAuthStore.setState({ error: "Passwords do not match" });
      return;
    }
    try {
      await signup({ fullName, email: signupEmail, pass: signupPassword, city, state: stateName, role: 'CITIZEN' });
      setAuthMode('VERIFY_SIGNUP');
    } catch (err) { }
  };

  const handleVerifySignupSubmit = async () => {
    if (!signupEmail || !otp) return;
    try {
      await verifySignup(signupEmail, otp);
    } catch (err) { }
  };

  // Helper for Auth Inputs
  const renderInput = (
    icon: React.ReactNode,
    placeholder: string,
    value: string,
    onChangeText: (t: string) => void,
    isSecure = false,
    keyboardType: 'default' | 'email-address' | 'numeric' = 'default',
    passwordType: 'login' | 'signup' | 'confirm' | 'none' = 'none'
  ) => {
    let isVisible = false;
    if (passwordType === 'login') isVisible = showLoginPassword;
    else if (passwordType === 'signup') isVisible = showSignupPassword;
    else if (passwordType === 'confirm') isVisible = showConfirmPassword;

    const secureEntry = isSecure && !isVisible;
    const toggleVisibility = () => {
      if (passwordType === 'login') setShowLoginPassword(!showLoginPassword);
      else if (passwordType === 'signup') setShowSignupPassword(!showSignupPassword);
      else if (passwordType === 'confirm') setShowConfirmPassword(!showConfirmPassword);
    };

    return (
      <View
        className="w-full flex-row items-center rounded-xl px-4 mb-3 border"
        style={{
          backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.7)',
          borderColor: colors.cardBorder,
          height: 48,
        }}
      >
        <View style={{ marginRight: 10 }}>{icon}</View>
        <TextInput
          className="flex-1 text-[15px] font-medium"
          style={{ color: colors.foreground, paddingVertical: 0 }}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureEntry}
          keyboardType={keyboardType}
          autoCapitalize={isSecure ? 'none' : (keyboardType === 'email-address' ? 'none' : 'words')}
          autoCorrect={!isSecure}
          textContentType={isSecure ? 'oneTimeCode' : 'none'}
        />
        {isSecure && (
          <TouchableOpacity 
            onPress={toggleVisibility}
            style={{ padding: 4 }}
          >
            {isVisible ? (
              <EyeOff size={18} color={colors.mutedForeground} />
            ) : (
              <Eye size={18} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ParticleBackground />

      {/* Theme Toggle Button */}
      <Animated.View entering={FadeInRight.delay(800).duration(500)} className="absolute top-[50px] right-5 z-50">
        <TouchableOpacity
          className="p-2 rounded-3xl"
          style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
          onPress={toggleTheme}
        >
          {theme === 'dark' ? <Sun color={colors.foreground} size={24} /> : <Moon color={colors.foreground} size={24} />}
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerClassName={`flex-grow ${isAuth ? '' : 'justify-center'} px-6 pb-10`}>

          {/* Morphing Header (Logo + Title) */}
          <Animated.View layout={LinearTransition.duration(400)} className={`w-full ${isAuth ? 'flex-row items-center justify-start z-50 mt-4 mb-8' : 'items-center'}`}>
            <Pressable
              disabled={!isAuth}
              onPress={() => setActiveView('HOME')}
              className={`flex-row items-center ${!isAuth ? 'flex-col items-center' : ''}`}
            >
              <Animated.View
                entering={BounceIn.delay(100).duration(800)}
                className="bg-blue-600 justify-center items-center shadow-black shadow-lg"
                style={[{ elevation: isAuth ? 5 : 15 }, logoOuterStyle]}
              >
                <Animated.View
                  className="bg-white justify-center items-center overflow-hidden shadow-black shadow-md"
                  style={[{ elevation: 5 }, logoInnerStyle]}
                >
                  <Image
                    source={require('../../assets/images/JS_logo.png')}
                    className="w-full h-full"
                    style={{ transform: [{ scale: 1.8 }] }}
                    resizeMode="contain"
                  />
                </Animated.View>
              </Animated.View>

              <Animated.Text
                className="font-black tracking-tighter"
                style={[{ color: colors.foreground }, titleStyle]}
              >
                JanSwar <Text style={{ color: colors.primary }}>AI</Text>
              </Animated.Text>
            </Pressable>
          </Animated.View>

          {/* HOME CONTENT */}
          {!isAuth && (
            <Animated.View entering={ZoomIn.delay(100)} exiting={FadeOutDown.duration(400)} className="items-center w-full">

              <Animated.Text
                entering={FadeInRight.delay(300).duration(600)}
                className="text-xl font-extrabold text-center mb-4 mt-2"
                style={{ color: theme === 'dark' ? '#bfdbfe' : '#1e3a8a' }}
              >
                Constituency Intelligence Platform
              </Animated.Text>

              <Animated.Text
                entering={FadeInUp.delay(500).duration(600)}
                className="text-[15px] text-center leading-6 mb-16 px-2.5"
                style={{ color: colors.mutedForeground }}
              >
                Connect directly with your representatives, report infrastructure issues, and track your local priority index.
              </Animated.Text>

              <Animated.View entering={FadeInUp.delay(700).duration(600)} className="w-full">
                <TouchableOpacity
                  className="w-full h-16 rounded-full flex-row items-center justify-center shadow-lg"
                  style={{ backgroundColor: colors.primary, shadowColor: colors.primary, elevation: 5 }}
                  onPress={() => handleStart('SIGNUP')}
                >
                  <Text className="text-white font-black text-lg mr-3">Get Started Now</Text>
                  <ArrowRight size={22} color="#ffffff" />
                </TouchableOpacity>

                <TouchableOpacity
                  className="w-full border h-16 rounded-full flex-row items-center justify-center mt-4"
                  style={{
                    backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.8)',
                    borderColor: colors.cardBorder
                  }}
                  onPress={() => handleStart('LOGIN')}
                >
                  <Lock size={20} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                  <Text className="font-extrabold text-base" style={{ color: colors.foreground }}>Login to Account</Text>
                </TouchableOpacity>
              </Animated.View>

            </Animated.View>
          )}

          {/* AUTH CONTENT */}
          {isAuth && (
            <Animated.View entering={FadeInUp.delay(200).duration(500)} exiting={FadeOutDown.duration(300)} className="w-full flex-1 justify-center">

              <View className="mb-8 items-center mt-4">
                <Text className="text-4xl font-black mb-2" style={{ color: colors.foreground }}>
                  {authMode === 'LOGIN' ? 'Welcome Back' : authMode === 'SIGNUP' ? 'Create Account' : 'Verify Email'}
                </Text>
                <Text className="text-base text-center px-4" style={{ color: colors.mutedForeground }}>
                  {authMode === 'LOGIN'
                    ? 'Sign in to connect with your representatives.'
                    : authMode === 'SIGNUP'
                      ? 'Join JanSwar AI to amplify your voice in your constituency.'
                      : 'Enter the 6-digit OTP sent to your email to verify your account.'}
                </Text>
              </View>

              {authMode !== 'VERIFY_SIGNUP' && (
                <View
                  className="flex-row rounded-full p-1 mb-8"
                  style={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)' }}
                >
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-full items-center justify-center`}
                    style={{ backgroundColor: authMode === 'LOGIN' ? colors.primary : 'transparent' }}
                    onPress={() => handleToggleMode('LOGIN')}
                  >
                    <Text className={`font-bold ${authMode === 'LOGIN' ? 'text-white' : ''}`} style={{ color: authMode === 'LOGIN' ? '#fff' : colors.mutedForeground }}>Login</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-full items-center justify-center`}
                    style={{ backgroundColor: authMode === 'SIGNUP' ? colors.primary : 'transparent' }}
                    onPress={() => handleToggleMode('SIGNUP')}
                  >
                    <Text className={`font-bold ${authMode === 'SIGNUP' ? 'text-white' : ''}`} style={{ color: authMode === 'SIGNUP' ? '#fff' : colors.mutedForeground }}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              )}

              {error && (
                <View className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 mb-6 items-center">
                  <Text className="text-red-500 font-medium">{error}</Text>
                </View>
              )}

               {authMode === 'LOGIN' && (
                <View>
                  {renderInput(<Mail size={20} color={colors.primary} />, "Email Address", loginEmail, setLoginEmail, false, 'email-address')}
                  {renderInput(<Lock size={20} color={colors.primary} />, "Password", loginPassword, setLoginPassword, true, 'default', 'login')}
                  <TouchableOpacity className="self-end mb-6">
                    <Text className="font-bold" style={{ color: colors.primary }}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
              )}

              {authMode === 'SIGNUP' && (
                <View>
                  {renderInput(<User size={20} color={colors.primary} />, "Full Name", fullName, setFullName)}
                  {renderInput(<Mail size={20} color={colors.primary} />, "Email Address", signupEmail, setSignupEmail, false, 'email-address')}
                  {renderInput(<Lock size={20} color={colors.primary} />, "Password", signupPassword, setSignupPassword, true, 'default', 'signup')}
                  {renderInput(<Lock size={20} color={colors.primary} />, "Confirm Password", confirmPassword, setConfirmPassword, true, 'default', 'confirm')}
                  <View className="flex-row justify-between">
                    <View className="flex-1 mr-2">
                      {renderInput(<Building2 size={20} color={colors.primary} />, "City", city, setCity)}
                    </View>
                    <View className="flex-1 ml-2">
                      {renderInput(<MapPin size={20} color={colors.primary} />, "State", stateName, setStateName)}
                    </View>
                  </View>
                </View>
              )}

              {authMode === 'VERIFY_SIGNUP' && (
                <View>
                  {renderInput(<KeyRound size={20} color={colors.primary} />, "6-Digit OTP", otp, setOtp, false, 'numeric')}
                </View>
              )}

              <TouchableOpacity
                className="w-full h-[60px] rounded-full flex-row items-center justify-center shadow-lg mt-4"
                style={{ backgroundColor: colors.primary, shadowColor: colors.primary, elevation: 5, opacity: isLoading ? 0.7 : 1 }}
                onPress={authMode === 'LOGIN' ? handleLoginSubmit : authMode === 'SIGNUP' ? handleSignupSubmit : handleVerifySignupSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text className="text-white font-black text-lg mr-2">
                      {authMode === 'LOGIN' ? 'Log In' : authMode === 'SIGNUP' ? 'Create Account' : 'Verify Account'}
                    </Text>
                    <ArrowRight size={20} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>

              {authMode === 'VERIFY_SIGNUP' && (
                <TouchableOpacity className="mt-6 flex-row items-center justify-center" onPress={() => setAuthMode('SIGNUP')}>
                  <ArrowLeft size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                  <Text className="font-bold text-base" style={{ color: colors.mutedForeground }}>Back to Sign Up</Text>
                </TouchableOpacity>
              )}

              {authMode !== 'VERIFY_SIGNUP' && (
                <TouchableOpacity 
                  className="mt-8 flex-row items-center justify-center self-center py-2.5 px-5 rounded-full" 
                  style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                  onPress={() => setActiveView('HOME')}
                >
                  <ChevronLeft size={18} color={colors.mutedForeground} style={{ marginRight: 6 }} />
                  <Text className="font-bold text-[15px]" style={{ color: colors.mutedForeground }}>Back to Home</Text>
                </TouchableOpacity>
              )}

            </Animated.View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
