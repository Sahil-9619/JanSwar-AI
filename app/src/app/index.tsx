import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  Mail,
  Lock,
  User as UserIcon,
  MapPin,
  Building,
  KeyRound,
  ArrowRight,
  LogOut,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  Activity,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react-native';
import { API_URL } from '../constants/config';

// Cast icons to any to resolve target type conflicts (web vs native target types in IDE)
const MailIcon = Mail as any;
const LockIcon = Lock as any;
const UserIconComp = UserIcon as any;
const MapPinIcon = MapPin as any;
const BuildingIcon = Building as any;
const KeyRoundIcon = KeyRound as any;
const ArrowRightIcon = ArrowRight as any;
const LogOutIcon = LogOut as any;
const PlusIcon = Plus as any;
const RefreshCwIcon = RefreshCw as any;
const ClockIcon = Clock as any;
const CheckCircleIcon = CheckCircle as any;
const FileTextIcon = FileText as any;
const AlertCircleIcon = AlertCircle as any;
const ActivityIcon = Activity as any;
const ClipboardListIcon = ClipboardList as any;
const ShieldCheckIcon = ShieldCheck as any;

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  city?: string;
  state?: string;
}

interface Suggestion {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  category?: {
    name: string;
  } | null;
  village?: {
    name: string;
  } | null;
  block?: {
    name: string;
  } | null;
  priorityScore?: {
    score: number;
    finalScore?: number;
    urgencyReason?: string;
  } | null;
  user?: {
    fullName: string;
    phoneNumber: string | null;
  } | null;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priorityScore: number;
  status: string;
  category: { name: string };
  village: { name: string } | null;
  block: { name: string } | null;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  tableName: string;
  recordId: string;
  timestamp: string;
  user: {
    fullName: string;
    email: string;
    role: string;
  } | null;
}

export default function App() {
  // Navigation / View States: 'WELCOME' | 'LOGIN' | 'SIGNUP' | 'OTP_VERIFY' | 'DASHBOARD'
  const [currentView, setCurrentView] = useState<'WELCOME' | 'LOGIN' | 'SIGNUP' | 'OTP_VERIFY' | 'DASHBOARD'>('WELCOME');
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'signup'>('login');
  
  // Auth Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // App Global State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  
  // Modal for new Suggestion
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategoryId, setNewCategoryId] = useState(''); // Category selection

  // Sub-Tab selections for MP and Admin Dashboards
  const [mpTab, setMpTab] = useState<'grievances' | 'proposals'>('grievances');
  const [adminTab, setAdminTab] = useState<'grievances' | 'audits'>('grievances');

  // MP Specific Recommendations state
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isFetchingRecommendations, setIsFetchingRecommendations] = useState(false);

  // Admin Specific Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isFetchingAudits, setIsFetchingAudits] = useState(false);

  // Client side search query
  const [searchQuery, setSearchQuery] = useState('');

  // Hardcoded categories for selection (matches seed data)
  const categories = [
    { id: '1', name: 'Roads & Transport' },
    { id: '2', name: 'Water & Sanitation' },
    { id: '3', name: 'Electricity & Power' },
    { id: '4', name: 'Health & Hospitals' },
    { id: '5', name: 'Education & Schools' },
    { id: '6', name: 'Agriculture & Irrigation' },
  ];

  // Check auth token on start
  useEffect(() => {
    checkLocalSession();
  }, []);

  const checkLocalSession = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('token');
      const savedUserStr = await AsyncStorage.getItem('user');
      if (savedToken && savedUserStr) {
        const userProfile = JSON.parse(savedUserStr);
        setToken(savedToken);
        setUser(userProfile);
        setCurrentView('DASHBOARD');
        syncDashboardData(savedToken, userProfile);
      }
    } catch (e) {
      console.error('Session restoration failed:', e);
    }
  };

  const saveSession = async (jwtToken: string, userProfile: User) => {
    try {
      await AsyncStorage.setItem('token', jwtToken);
      await AsyncStorage.setItem('user', JSON.stringify(userProfile));
      setToken(jwtToken);
      setUser(userProfile);
    } catch (e) {
      console.error('Session save failed:', e);
    }
  };

  const syncDashboardData = (jwtToken: string, userProfile: User) => {
    fetchSuggestions(jwtToken);
    if (userProfile.role === 'MP') {
      fetchRecommendations(jwtToken);
    } else if (userProfile.role === 'DISTRICT_ADMIN' || userProfile.role === 'SUPER_ADMIN') {
      fetchAuditLogs(jwtToken);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setSuggestions([]);
      setRecommendations([]);
      setAuditLogs([]);
      setEmail('');
      setPassword('');
      setOtpCode('');
      setSearchQuery('');
      setCurrentView('WELCOME');
    } catch (e) {
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  // FETCH SUGGESTIONS
  const fetchSuggestions = async (jwtToken: string) => {
    setIsFetchingSuggestions(true);
    try {
      // MPs/Admins get unscoped suggestions, citizens get scoped suggestions automatically via backend token logic
      const response = await axios.get(`${API_URL}/suggestions?limit=100`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (response.data && response.data.suggestions) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error: any) {
      console.error('Fetch suggestions error:', error?.response?.data || error.message);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  // FETCH MP RECOMMENDATIONS (AI PROPOSALS)
  const fetchRecommendations = async (jwtToken: string) => {
    setIsFetchingRecommendations(true);
    try {
      const response = await axios.get(`${API_URL}/recommendations`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (response.data && response.data.recommendations) {
        setRecommendations(response.data.recommendations);
      }
    } catch (error: any) {
      console.error('Fetch recommendations error:', error?.response?.data || error.message);
    } finally {
      setIsFetchingRecommendations(false);
    }
  };

  // FETCH ADMIN AUDIT LOGS
  const fetchAuditLogs = async (jwtToken: string) => {
    setIsFetchingAudits(true);
    try {
      const response = await axios.get(`${API_URL}/audit`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (response.data && response.data.auditLogs) {
        setAuditLogs(response.data.auditLogs);
      }
    } catch (error: any) {
      console.error('Fetch audits error:', error?.response?.data || error.message);
    } finally {
      setIsFetchingAudits(false);
    }
  };

  // APPROVE AI RECOMMENDATION (MP Action)
  const handleApproveRecommendation = async (recId: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      await axios.patch(
        `${API_URL}/recommendations/${recId}`,
        { status: 'APPROVED' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Proposal Approved', 'The AI constituency recommendation has been successfully approved for deployment.');
      fetchRecommendations(token);
    } catch (error: any) {
      Alert.alert('Approval Error', error?.response?.data?.error || 'Failed to approve proposal.');
    } finally {
      setIsLoading(false);
    }
  };

  // REQUEST OTP FOR LOGIN
  const handleRequestOtp = async () => {
    if (!email) {
      Alert.alert('Required', 'Please enter your email.');
      return;
    }
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/auth/request-otp`, { email });
      setOtpPurpose('login');
      setCurrentView('OTP_VERIFY');
      Alert.alert('OTP Sent', `A verification code has been sent to ${email}`);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // PASSWORD LOGIN
  const handlePasswordLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please fill in both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token: jwtToken, user: userProfile } = response.data;
      await saveSession(jwtToken, userProfile);
      setCurrentView('DASHBOARD');
      syncDashboardData(jwtToken, userProfile);
    } catch (error: any) {
      Alert.alert('Login Failed', error?.response?.data?.error || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // SIGNUP
  const handleSignupSubmit = async () => {
    if (!email || !password || !fullName || !city || !stateName) {
      Alert.alert('Required', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/auth/signup`, {
        fullName,
        email,
        password,
        city,
        state: stateName,
        role: 'CITIZEN',
      });
      setOtpPurpose('signup');
      setCurrentView('OTP_VERIFY');
      Alert.alert('Success', `OTP sent to ${email}. Verify to complete registration.`);
    } catch (error: any) {
      Alert.alert('Registration Failed', error?.response?.data?.error || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  // VERIFY OTP
  const handleVerifyOtp = async () => {
    if (!otpCode) {
      Alert.alert('Required', 'Please enter the 6-digit OTP code.');
      return;
    }
    setIsLoading(true);
    try {
      const endpoint = otpPurpose === 'login' ? 'verify-otp' : 'verify-signup';
      const response = await axios.post(`${API_URL}/auth/${endpoint}`, {
        email,
        otp: otpCode,
      });
      const { token: jwtToken, user: userProfile } = response.data;
      await saveSession(jwtToken, userProfile);
      setCurrentView('DASHBOARD');
      syncDashboardData(jwtToken, userProfile);
    } catch (error: any) {
      Alert.alert('Verification Failed', error?.response?.data?.error || 'Invalid verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // CREATE NEW SUGGESTION
  const handleCreateSuggestion = async () => {
    if (!newTitle) {
      Alert.alert('Required', 'Please enter a title.');
      return;
    }
    setIsLoading(true);
    try {
      const latitude = "26.5473";
      const longitude = "80.6085";

      await axios.post(
        `${API_URL}/suggestions`,
        {
          title: newTitle,
          description: newDescription,
          categoryId: newCategoryId || undefined,
          latitude,
          longitude,
          districtId: "",
          blockId: "",
          villageId: "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert('Success', 'Your suggestion has been submitted successfully and the AI scoring pipeline has started.');
      setIsModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewCategoryId('');
      if (token) fetchSuggestions(token);
    } catch (error: any) {
      Alert.alert('Submission Error', error?.response?.data?.error || 'Failed to submit suggestion.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Format Date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Helper: Status badge color styles
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return { bg: '#FEF3C7', text: '#D97706', label: 'Pending' };
      case 'PROCESSING':
        return { bg: '#DBEAFE', text: '#2563EB', label: 'Processing' };
      case 'APPROVED':
      case 'RESOLVED':
        return { bg: '#D1FAE5', text: '#059669', label: 'Resolved' };
      case 'REJECTED':
        return { bg: '#FEE2E2', text: '#DC2626', label: 'Rejected' };
      default:
        return { bg: '#E5E7EB', text: '#374151', label: status };
    }
  };

  // Helper: Action Badge background colors for audits
  const getAuditActionStyle = (action: string) => {
    if (action.includes('CREATE')) return { bg: '#d1fae5', text: '#065f46', label: 'Create' };
    if (action.includes('DELETE')) return { bg: '#fee2e2', text: '#991b1b', label: 'Delete' };
    return { bg: '#e0e7ff', text: '#3730a3', label: 'Update' };
  };

  // Client Side Suggestion Filtering
  const getFilteredSuggestions = () => {
    if (!searchQuery) return suggestions;
    return suggestions.filter(s =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.category?.name && s.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  // Client Side Recommendation Filtering
  const getFilteredRecommendations = () => {
    if (!searchQuery) return recommendations;
    return recommendations.filter(r =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Client Side Audit Filtering
  const getFilteredAudits = () => {
    if (!searchQuery) return auditLogs;
    return auditLogs.filter(a =>
      a.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.user?.fullName && a.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  // RENDER CITIZEN DASHBOARD
  const renderCitizenDashboard = () => {
    const userSuggestions = suggestions.filter(s => s.status !== 'REJECTED'); // Filtered for citizen view
    return (
      <View style={styles.dashboardRoot}>
        {/* Header Banner */}
        <View style={styles.dashboardHeader}>
          <View>
            <Text style={styles.welcomeTitle}>JanSwar AI</Text>
            <Text style={styles.welcomeUser}>Namaste, {user?.fullName || 'Citizen'}</Text>
          </View>
          <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
            <LogOutIcon size={16} color="#ef4444" />
            <Text style={styles.logoutText}>Exit</Text>
          </TouchableOpacity>
        </View>

        {/* User Info Stats Row */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{userSuggestions.length}</Text>
            <Text style={styles.statLabel}>Total Ideas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#fbbf24' }]}>
              {userSuggestions.filter((s) => s.status.toUpperCase() === 'PENDING').length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#10b981' }]}>
              {userSuggestions.filter((s) => ['APPROVED', 'RESOLVED'].includes(s.status.toUpperCase())).length}
            </Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
        </View>

        {/* List Title Row */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>My Submissions</Text>
          <TouchableOpacity
            style={styles.btnRefresh}
            onPress={() => token && fetchSuggestions(token)}
            disabled={isFetchingSuggestions}
          >
            <RefreshCwIcon size={14} color="#60a5fa" />
            <Text style={styles.btnRefreshText}>Reload</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Suggestions List */}
        {isFetchingSuggestions && userSuggestions.length === 0 ? (
          <View style={styles.listLoadingBox}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.listLoadingText}>Loading suggestions...</Text>
          </View>
        ) : userSuggestions.length === 0 ? (
          <View style={styles.emptyBox}>
            <FileTextIcon size={32} color="#475569" />
            <Text style={styles.emptyText}>You haven't submitted any suggestions yet.</Text>
            <Text style={styles.emptySubtext}>Submit your first suggestion to connect with your MP.</Text>
          </View>
        ) : (
          <ScrollView style={styles.suggestionsScroll}>
            {userSuggestions.map((item) => {
              const badge = getStatusBadge(item.status);
              return (
                <View key={item.id} style={styles.suggestionCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardCategory}>
                      {item.category?.name || 'General Grievance'}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{item.title}</Text>
                  
                  {item.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  {item.priorityScore && (
                    <View style={styles.priorityBox}>
                      <AlertCircleIcon size={14} color="#f59e0b" style={{ marginRight: 4 }} />
                      <Text style={styles.priorityText}>
                        Priority Index: <Text style={styles.priorityBold}>{(item.priorityScore.finalScore || item.priorityScore.score).toFixed(0)}/100</Text>
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <View style={styles.dateRow}>
                      <ClockIcon size={12} color="#64748b" style={{ marginRight: 4 }} />
                      <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
            <View style={{ height: 80 }} />
          </ScrollView>
        )}

        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab} onPress={() => setIsModalOpen(true)}>
          <PlusIcon size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  // RENDER MP DASHBOARD
  const renderMPDashboard = () => {
    const activeSuggestions = getFilteredSuggestions();
    const activeRecommendations = getFilteredRecommendations();
    const pendingRecs = recommendations.filter(r => r.status === 'PENDING');
    
    return (
      <View style={styles.dashboardRoot}>
        {/* Header Banner */}
        <View style={styles.dashboardHeader}>
          <View>
            <Text style={styles.welcomeTitle}>JanSwar AI MP Office</Text>
            <Text style={styles.welcomeUser}>Namaste, Representative {user?.fullName}</Text>
          </View>
          <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
            <LogOutIcon size={16} color="#ef4444" />
            <Text style={styles.logoutText}>Exit</Text>
          </TouchableOpacity>
        </View>

        {/* MP Metrics stats */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{suggestions.length}</Text>
            <Text style={styles.statLabel}>Grievances</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#f59e0b' }]}>{pendingRecs.length}</Text>
            <Text style={styles.statLabel}>Pending Proposals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#10b981' }]}>
              {recommendations.filter(r => r.status === 'APPROVED').length}
            </Text>
            <Text style={styles.statLabel}>Approved Projects</Text>
          </View>
        </View>

        {/* MP Dashboard Menu Switcher */}
        <View style={styles.roleTabRow}>
          <TouchableOpacity
            style={[styles.roleTabButton, mpTab === 'grievances' && styles.roleTabButtonActive]}
            onPress={() => { setMpTab('grievances'); setSearchQuery(''); }}
          >
            <ActivityIcon size={16} color={mpTab === 'grievances' ? '#3b82f6' : '#94a3b8'} />
            <Text style={[styles.roleTabText, mpTab === 'grievances' && styles.roleTabTextActive]}>Grievances</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTabButton, mpTab === 'proposals' && styles.roleTabButtonActive]}
            onPress={() => { setMpTab('proposals'); setSearchQuery(''); }}
          >
            <ShieldCheckIcon size={16} color={mpTab === 'proposals' ? '#3b82f6' : '#94a3b8'} />
            <Text style={[styles.roleTabText, mpTab === 'proposals' && styles.roleTabTextActive]}>AI Proposals ({pendingRecs.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBoxWrapper}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={mpTab === 'grievances' ? "Search grievances, categories..." : "Search proposals..."}
            placeholderTextColor="#64748b"
            style={styles.searchField}
          />
        </View>

        {/* Dynamic lists */}
        {mpTab === 'grievances' ? (
          // GRIEVANCES SCROLL VIEW
          isFetchingSuggestions && suggestions.length === 0 ? (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
          ) : activeSuggestions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No grievances matching search query.</Text>
            </View>
          ) : (
            <ScrollView style={styles.suggestionsScroll}>
              {activeSuggestions.map((item) => {
                const badge = getStatusBadge(item.status);
                const score = item.priorityScore?.finalScore || item.priorityScore?.score || 0;
                return (
                  <View key={item.id} style={styles.suggestionCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardCategory}>{item.category?.name || 'General'}</Text>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description || 'No detailed text context.'}</Text>
                    
                    <View style={styles.rowWrapper}>
                      <View style={[styles.priorityBox, { marginBottom: 0 }]}>
                        <AlertCircleIcon size={13} color="#f59e0b" style={{ marginRight: 4 }} />
                        <Text style={styles.priorityText}>Priority Score: {score.toFixed(0)}/100</Text>
                      </View>
                      <Text style={styles.locationFooter}>{item.village?.name || 'Patna Sadar'}</Text>
                    </View>
                  </View>
                );
              })}
              <View style={{ height: 100 }} />
            </ScrollView>
          )
        ) : (
          // AI PROPOSALS SCROLL VIEW
          isFetchingRecommendations && recommendations.length === 0 ? (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
          ) : activeRecommendations.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No recommendations found.</Text>
            </View>
          ) : (
            <ScrollView style={styles.suggestionsScroll}>
              {activeRecommendations.map((item) => {
                const isPending = item.status === 'PENDING';
                return (
                  <View key={item.id} style={[styles.suggestionCard, !isPending && { borderColor: '#10b98133' }]}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardCategory}>{item.category.name}</Text>
                      <View style={[styles.badge, { backgroundColor: isPending ? '#fbbf2422' : '#d1fae5', paddingHorizontal: 12 }]}>
                        <Text style={[styles.badgeText, { color: isPending ? '#d97706' : '#047857' }]}>
                          {isPending ? 'Pending Approval' : 'Approved'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDesc}>{item.description}</Text>

                    <View style={styles.proposalFooter}>
                      <Text style={styles.priorityBoldText}>AI Priority Score: {item.priorityScore.toFixed(0)}/100</Text>
                      {isPending ? (
                        <TouchableOpacity
                          style={styles.btnApprove}
                          onPress={() => handleApproveRecommendation(item.id)}
                          disabled={isLoading}
                        >
                          <Text style={styles.btnApproveText}>Approve Proposal</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.approvedBadge}>
                          <CheckCircleIcon size={14} color="#10b981" style={{ marginRight: 4 }} />
                          <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '700' }}>Ready for Dev</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
              <View style={{ height: 100 }} />
            </ScrollView>
          )
        )}
      </View>
    );
  };

  // RENDER ADMIN DASHBOARD
  const renderAdminDashboard = () => {
    const activeSuggestions = getFilteredSuggestions();
    const activeAudits = getFilteredAudits();

    return (
      <View style={styles.dashboardRoot}>
        {/* Header Banner */}
        <View style={styles.dashboardHeader}>
          <View>
            <Text style={styles.welcomeTitle}>JanSwar AI Admin Gateway</Text>
            <Text style={styles.welcomeUser}>Namaste, {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'District Admin'} {user?.fullName}</Text>
          </View>
          <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
            <LogOutIcon size={16} color="#ef4444" />
            <Text style={styles.logoutText}>Exit</Text>
          </TouchableOpacity>
        </View>

        {/* Admin stats card */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{suggestions.length}</Text>
            <Text style={styles.statLabel}>Suggestions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#fbbf24' }]}>
              {suggestions.filter(s => s.status === 'PENDING').length}
            </Text>
            <Text style={styles.statLabel}>Pending Queue</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#6366f1' }]}>{auditLogs.length}</Text>
            <Text style={styles.statLabel}>Audit Events</Text>
          </View>
        </View>

        {/* Tab switchers */}
        <View style={styles.roleTabRow}>
          <TouchableOpacity
            style={[styles.roleTabButton, adminTab === 'grievances' && styles.roleTabButtonActive]}
            onPress={() => { setAdminTab('grievances'); setSearchQuery(''); }}
          >
            <ClipboardListIcon size={16} color={adminTab === 'grievances' ? '#3b82f6' : '#94a3b8'} />
            <Text style={[styles.roleTabText, adminTab === 'grievances' && styles.roleTabTextActive]}>All Grievances</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTabButton, adminTab === 'audits' && styles.roleTabButtonActive]}
            onPress={() => { setAdminTab('audits'); setSearchQuery(''); }}
          >
            <ShieldCheckIcon size={16} color={adminTab === 'audits' ? '#3b82f6' : '#94a3b8'} />
            <Text style={[styles.roleTabText, adminTab === 'audits' && styles.roleTabTextActive]}>System Audit Logs</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBoxWrapper}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={adminTab === 'grievances' ? "Search grievances, blocks..." : "Search actions, database..."}
            placeholderTextColor="#64748b"
            style={styles.searchField}
          />
        </View>

        {/* Dynamic scroll fields */}
        {adminTab === 'grievances' ? (
          isFetchingSuggestions && suggestions.length === 0 ? (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
          ) : activeSuggestions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No grievances in database.</Text>
            </View>
          ) : (
            <ScrollView style={styles.suggestionsScroll}>
              {activeSuggestions.map((item) => {
                const badge = getStatusBadge(item.status);
                const score = item.priorityScore?.finalScore || item.priorityScore?.score || 0;
                return (
                  <View key={item.id} style={styles.suggestionCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardCategory}>{item.category?.name || 'Unassigned'}</Text>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description || 'No description added by citizen'}</Text>
                    
                    <View style={styles.rowWrapper}>
                      <Text style={styles.userSignature}>By: {item.user?.fullName || 'Anonymous'}</Text>
                      <Text style={styles.locationFooter}>Priority score: {score.toFixed(0)}</Text>
                    </View>
                  </View>
                );
              })}
              <View style={{ height: 100 }} />
            </ScrollView>
          )
        ) : (
          isFetchingAudits && auditLogs.length === 0 ? (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
          ) : activeAudits.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No audit entries found.</Text>
            </View>
          ) : (
            <ScrollView style={styles.suggestionsScroll}>
              {activeAudits.map((item) => {
                const actionStyle = getAuditActionStyle(item.action);
                return (
                  <View key={item.id} style={styles.auditCard}>
                    <View style={styles.auditHeader}>
                      <View style={[styles.auditBadge, { backgroundColor: actionStyle.bg }]}>
                        <Text style={[styles.auditBadgeText, { color: actionStyle.text }]}>{actionStyle.label}</Text>
                      </View>
                      <Text style={styles.auditTime}>{formatDate(item.timestamp)}</Text>
                    </View>
                    <Text style={styles.auditTableName}>Modified Entity: {item.tableName}</Text>
                    <Text style={styles.auditOperator}>Operator: {item.user?.fullName || 'System Controller'}</Text>
                    <Text style={styles.auditRefId} numberOfLines={1}>ID Reference: {item.recordId}</Text>
                  </View>
                );
              })}
              <View style={{ height: 100 }} />
            </ScrollView>
          )
        )}
      </View>
    );
  };

  // Render Splash Loading
  if (isLoading && currentView === 'WELCOME') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Connecting to JanSwar AI...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.outerContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {currentView === 'WELCOME' && (
        <ScrollView contentContainerStyle={styles.welcomeContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoTitle}>JanSwar</Text>
            <Text style={styles.logoSubtitle}>AI</Text>
          </View>

          <Text style={styles.heroText}>Constituency Intelligence Platform</Text>
          <Text style={styles.heroDesc}>
            Submit infrastructure issues via text, check local constituency priority indexes, and participate in community development.
          </Text>

          <View style={styles.actionCard}>
            <Text style={styles.actionHeader}>Get Started</Text>

            <TouchableOpacity style={styles.btnPrimary} onPress={() => setCurrentView('LOGIN')}>
              <Text style={styles.btnText}>Login to Account</Text>
              <ArrowRightIcon size={18} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSecondary} onPress={() => setCurrentView('SIGNUP')}>
              <Text style={styles.btnTextSecondary}>Create New Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {currentView === 'LOGIN' && (
        <ScrollView contentContainerStyle={styles.scrollFormContainer}>
          <Text style={styles.formHeader}>Welcome Back</Text>
          <Text style={styles.formSubheader}>Log in to connect with your constituency representative</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <MailIcon size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#64748b"
                style={styles.textInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password (Optional for OTP Login)</Text>
            <View style={styles.inputWrapper}>
              <LockIcon size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="#64748b"
                secureTextEntry
                style={styles.textInput}
              />
            </View>
          </View>

          <View style={styles.buttonSpacing}>
            <TouchableOpacity style={styles.btnPrimary} onPress={handlePasswordLogin} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.btnText}>Login with Password</Text>
                  <ArrowRightIcon size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.btnAccent} onPress={handleRequestOtp} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.btnTextAccent}>Send Login OTP Email</Text>
                  <KeyRoundIcon size={18} color="#3b82f6" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.linkButton} onPress={() => setCurrentView('WELCOME')}>
            <Text style={styles.linkText}>Back to Welcome</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {currentView === 'SIGNUP' && (
        <ScrollView contentContainerStyle={styles.scrollFormContainer}>
          <Text style={styles.formHeader}>Create Account</Text>
          <Text style={styles.formSubheader}>Sign up as a citizen to file grievances and suggestions</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <UserIconComp size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Rajesh Kumar"
                placeholderTextColor="#64748b"
                style={styles.textInput}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <MailIcon size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor="#64748b"
                style={styles.textInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <LockIcon size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Choose password"
                placeholderTextColor="#64748b"
                secureTextEntry
                style={styles.textInput}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <LockIcon size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor="#64748b"
                secureTextEntry
                style={styles.textInput}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>City</Text>
              <View style={styles.inputWrapper}>
                <BuildingIcon size={16} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="Purwa"
                  placeholderTextColor="#64748b"
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>State</Text>
              <View style={styles.inputWrapper}>
                <MapPinIcon size={16} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  value={stateName}
                  onChangeText={setStateName}
                  placeholder="Uttar Pradesh"
                  placeholderTextColor="#64748b"
                  style={styles.textInput}
                />
              </View>
            </View>
          </View>

          <View style={styles.buttonSpacing}>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleSignupSubmit} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.btnText}>Register Account</Text>
                  <ArrowRightIcon size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.linkButton} onPress={() => setCurrentView('WELCOME')}>
            <Text style={styles.linkText}>Back to Welcome</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {currentView === 'OTP_VERIFY' && (
        <ScrollView contentContainerStyle={styles.scrollFormContainer}>
          <Text style={styles.formHeader}>Verify Email</Text>
          <Text style={styles.formSubheader}>We sent a 6-digit OTP code to {email}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>6-Digit Code</Text>
            <View style={styles.inputWrapper}>
              <KeyRoundIcon size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                value={otpCode}
                onChangeText={setOtpCode}
                placeholder="000000"
                placeholderTextColor="#64748b"
                style={[styles.textInput, styles.otpInput]}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>

          <View style={styles.buttonSpacing}>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleVerifyOtp} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Confirm & Verify</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.linkButton} onPress={() => setCurrentView('LOGIN')}>
            <Text style={styles.linkText}>Resend OTP Code / Back</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {currentView === 'DASHBOARD' && (
        // ROUTE DASHBOARD VIEWS DYNAMICALLY BASED ON LOGGED IN USER ROLE
        user?.role === 'MP' ? renderMPDashboard() :
        (user?.role === 'DISTRICT_ADMIN' || user?.role === 'SUPER_ADMIN') ? renderAdminDashboard() :
        renderCitizenDashboard()
      )}

      {/* Citizen modal popup for filing suggestions */}
      {currentView === 'DASHBOARD' && user?.role === 'CITIZEN' && (
        <Modal visible={isModalOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>File Suggestion</Text>
              <Text style={styles.modalSub}>Detail the infrastructure needs or issues in your area.</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Issue / Suggestion Title</Text>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="e.g. Repair of Main Link Road"
                  placeholderTextColor="#64748b"
                  style={styles.modalTextInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Category</Text>
                <View style={styles.categoryPicker}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catChip,
                        newCategoryId === cat.id ? styles.catChipActive : null,
                      ]}
                      onPress={() => setNewCategoryId(cat.id)}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          newCategoryId === cat.id ? styles.catChipTextActive : null,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Description & Context</Text>
                <TextInput
                  value={newDescription}
                  onChangeText={setNewDescription}
                  placeholder="Describe details e.g., potholes near the primary school causing water collection during rains."
                  placeholderTextColor="#64748b"
                  style={[styles.modalTextInput, styles.multilineInput]}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.btnCancel}
                  onPress={() => setIsModalOpen(false)}
                  disabled={isLoading}
                >
                  <Text style={styles.btnCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnSubmit}
                  onPress={handleCreateSuggestion}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnSubmitText}>Submit Suggestion</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#0f172a', // Dark slate bg
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  welcomeContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '900',
  },
  logoSubtitle: {
    color: '#3b82f6',
    fontSize: 26,
    fontWeight: '900',
  },
  heroText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroDesc: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  actionCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 18,
    textAlign: 'center',
  },
  scrollFormContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  formHeader: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 8,
  },
  formSubheader: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 32,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otpInput: {
    fontSize: 20,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: '800',
  },
  buttonSpacing: {
    marginTop: 24,
  },
  btnPrimary: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  btnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    marginRight: 8,
  },
  btnSecondary: {
    backgroundColor: '#334155',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  btnTextSecondary: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#64748b',
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '700',
  },
  btnAccent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTextAccent: {
    color: '#3b82f6',
    fontWeight: '800',
    fontSize: 16,
    marginRight: 8,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  linkText: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '700',
  },
  dashboardRoot: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f8fafc',
  },
  welcomeUser: {
    fontSize: 14,
    color: '#60a5fa',
    fontWeight: '700',
    marginTop: 2,
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7f1d1d22',
    borderWidth: 1,
    borderColor: '#ef444455',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    margin: 16,
    borderRadius: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#334155',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f8fafc',
  },
  btnRefresh: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnRefreshText: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  suggestionsScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  suggestionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardCategory: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 12,
  },
  priorityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf2418',
    borderWidth: 1,
    borderColor: '#fbbf2433',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  priorityText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '700',
  },
  priorityBold: {
    fontWeight: '900',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#334155',
    paddingTop: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderTopWidth: 1,
    borderColor: '#334155',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 24,
    lineHeight: 18,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  modalTextInput: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    height: 48,
    paddingHorizontal: 16,
    color: '#f8fafc',
    fontSize: 14,
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  catChip: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    margin: 4,
  },
  catChipActive: {
    backgroundColor: '#3b82f61a',
    borderColor: '#3b82f6',
  },
  catChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  catChipTextActive: {
    color: '#3b82f6',
  },
  multilineInput: {
    height: 90,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  btnCancel: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnCancelText: {
    color: '#94a3b8',
    fontWeight: '800',
    fontSize: 14,
  },
  btnSubmit: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },
  btnSubmitText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  listLoadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  listLoadingText: {
    color: '#64748b',
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },

  // Role Tab elements
  roleTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 12,
    gap: 8,
  },
  roleTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  roleTabButtonActive: {
    backgroundColor: '#3b82f61a',
    borderColor: '#3b82f6',
  },
  roleTabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  roleTabTextActive: {
    color: '#3b82f6',
  },
  searchBoxWrapper: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchField: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    height: 46,
    paddingHorizontal: 16,
    color: '#f8fafc',
    fontSize: 13,
  },
  rowWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  locationFooter: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  proposalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#334155',
    paddingTop: 12,
    marginTop: 8,
  },
  priorityBoldText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
  },
  btnApprove: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnApproveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userSignature: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  auditCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  auditBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  auditBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  auditTime: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  auditTableName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  auditOperator: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  auditRefId: {
    color: '#64748b',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
