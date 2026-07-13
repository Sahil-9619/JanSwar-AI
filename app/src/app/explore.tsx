import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Map,
  Activity,
  Server,
  Layers,
  Percent,
  TrendingUp,
  Cpu,
  Database,
  Lock,
  Compass,
} from 'lucide-react-native';

// Cast icons to any to bypass compilation warnings on target conflicts
const MapIcon = Map as any;
const ActivityIcon = Activity as any;
const ServerIcon = Server as any;
const LayersIcon = Layers as any;
const PercentIcon = Percent as any;
const TrendingUpIcon = TrendingUp as any;
const CpuIcon = Cpu as any;
const DatabaseIcon = Database as any;
const LockIcon = Lock as any;
const CompassIcon = Compass as any;

interface User {
  id: string;
  fullName: string;
  role: string;
}

interface VillageGap {
  name: string;
  block: string;
  population: number;
  gap: number;
  road: number;
  water: number;
  electricity: number;
  health: number;
  education: number;
}

export default function ExploreScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVillage, setSelectedVillage] = useState<VillageGap | null>(null);

  // Seeded mock villages matching the web app SVG map metrics
  const villages: VillageGap[] = [
    { name: "Kandap Village", block: "Sampatchak", population: 3100, gap: 0.82, road: 0.88, water: 0.75, electricity: 0.60, health: 0.90, education: 0.85 },
    { name: "Bariarpur Village", block: "Sampatchak", population: 4300, gap: 0.75, road: 0.80, water: 0.70, electricity: 0.50, health: 0.90, education: 0.80 },
    { name: "Phulwari Village", block: "Patna Sadar", population: 8400, gap: 0.58, road: 0.60, water: 0.50, electricity: 0.40, health: 0.70, education: 0.60 },
    { name: "Nasriganj Village", block: "Danapur", population: 9200, gap: 0.42, road: 0.40, water: 0.30, electricity: 0.20, health: 0.50, education: 0.40 },
    { name: "Digha Village", block: "Patna Sadar", population: 12500, gap: 0.35, road: 0.20, water: 0.30, electricity: 0.10, health: 0.40, education: 0.30 },
    { name: "Khagaul Village", block: "Danapur", population: 15400, gap: 0.28, road: 0.10, water: 0.20, electricity: 0.10, health: 0.20, education: 0.20 }
  ];

  // Mock server diagnostics for Admin
  const serverMetrics = [
    { name: "CPU Utilization", value: "14% Load", progress: 14, color: "#10b981", icon: CpuIcon },
    { name: "Memory Allocations", value: "1.4 GB / 8.0 GB", progress: 18, color: "#3b82f6", icon: ServerIcon },
    { name: "PostgreSQL Pools", value: "24 Active Pools", progress: 30, color: "#6366f1", icon: DatabaseIcon },
    { name: "Gemini AI API Latency", value: "320ms (Optimal)", progress: 10, color: "#14b8a6", icon: ActivityIcon },
  ];

  useEffect(() => {
    checkUserSession();
    // Default select highest gap village
    setSelectedVillage(villages[0]);
  }, []);

  const checkUserSession = async () => {
    setIsLoading(true);
    try {
      const savedUserStr = await AsyncStorage.getItem('user');
      if (savedUserStr) {
        setUser(JSON.parse(savedUserStr));
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getGapColor = (gap: number) => {
    if (gap < 0.35) return "#10b981"; // Green (Low gap)
    if (gap < 0.65) return "#fbbf24"; // Yellow (Medium gap)
    return "#ef4444"; // Red (Critical gap)
  };

  const renderProgressBar = (progress: number, color: string) => {
    return (
      <View style={styles.progressBackground}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Syncing intelligence map...</Text>
      </View>
    );
  }

  // GUEST STATE (NOT LOGGED IN)
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.centerContent}>
          <View style={styles.lockCircle}>
            <LockIcon size={32} color="#fbbf24" />
          </View>
          <Text style={styles.headerText}>Access Restricted</Text>
          <Text style={styles.descText}>
            Please log in on the Home screen to unlock constituency developmental maps, priority indicators, and server telemetry pipelines.
          </Text>
          <TouchableOpacity style={styles.btnSync} onPress={checkUserSession}>
            <Text style={styles.btnSyncText}>Check Session Status</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isAdmin = user.role === 'DISTRICT_ADMIN' || user.role === 'SUPER_ADMIN';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {isAdmin ? (
        // RENDER TELEMETRY DIAGNOSTICS FOR ADMIN
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerRow}>
            <ServerIcon size={24} color="#6366f1" />
            <Text style={styles.headerTitle}>System Telemetry</Text>
          </View>
          <Text style={styles.headerDesc}>Real-time status diagnostics of database connection pools, memory allocations, and AI API endpoints.</Text>

          {/* Telemetry charts */}
          <View style={styles.metricsWrapper}>
            {serverMetrics.map((met, idx) => {
              const MetricIcon = met.icon;
              return (
                <View key={idx} style={styles.metricCard}>
                  <View style={styles.metricRow}>
                    <View style={styles.metricTitleRow}>
                      <MetricIcon size={16} color={met.color} style={{ marginRight: 8 }} />
                      <Text style={styles.metricName}>{met.name}</Text>
                    </View>
                    <Text style={styles.metricVal}>{met.value}</Text>
                  </View>
                  <View style={styles.progressBackground}>
                    <View style={[styles.progressFill, { width: `${met.progress}%`, backgroundColor: met.color }]} />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Network deployment nodes status */}
          <Text style={styles.sectionTitle}>Deployment Nodes Status</Text>
          
          <View style={styles.nodeCard}>
            <View style={styles.nodeItem}>
              <View>
                <Text style={styles.nodeName}>Frontend Gateway</Text>
                <Text style={styles.nodeDesc}>Next.js App Server • Port 3000</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
            </View>

            <View style={styles.nodeDivider} />

            <View style={styles.nodeItem}>
              <View>
                <Text style={styles.nodeName}>Backend Controller Gateway</Text>
                <Text style={styles.nodeDesc}>Express REST API • Port 5000</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
            </View>

            <View style={styles.nodeDivider} />

            <View style={styles.nodeItem}>
              <View>
                <Text style={styles.nodeName}>Gemini AI FastAPI Service</Text>
                <Text style={styles.nodeDesc}>Python Inference • Port 8000</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
            </View>
          </View>
          <View style={{ height: 60 }} />
        </ScrollView>
      ) : (
        // RENDER CONSTITUENCY GAPS MAP FOR CITIZENS / MPs
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerRow}>
            <CompassIcon size={24} color="#3b82f6" />
            <Text style={styles.headerTitle}>Constituency Gaps</Text>
          </View>
          <Text style={styles.headerDesc}>Track geographical priorities and village developmental gap indexes (water, roads, power, education).</Text>

          {/* Selected Village Detail Sheet */}
          {selectedVillage && (
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <View>
                  <Text style={styles.detailName}>{selectedVillage.name}</Text>
                  <Text style={styles.detailBlock}>Block: {selectedVillage.block}</Text>
                </View>
                <View style={[styles.gapBadge, { backgroundColor: getGapColor(selectedVillage.gap) + '15', borderColor: getGapColor(selectedVillage.gap) + '33' }]}>
                  <Text style={[styles.gapBadgeText, { color: getGapColor(selectedVillage.gap) }]}>
                    Gap: {(selectedVillage.gap * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>

              <Text style={styles.populationText}>Population Index: {selectedVillage.population.toLocaleString()} citizens</Text>
              <View style={styles.detailDivider} />

              <View style={styles.gapMetricsRow}>
                <View style={styles.gapMetricItem}>
                  <Text style={styles.metricLabel}>Road Infrastructure</Text>
                  <View style={styles.barContainer}>
                    {renderProgressBar(selectedVillage.road, '#3b82f6')}
                    <Text style={styles.barPercentage}>{(selectedVillage.road * 100).toFixed(0)}%</Text>
                  </View>
                </View>

                <View style={styles.gapMetricItem}>
                  <Text style={styles.metricLabel}>Clean Water Supply</Text>
                  <View style={styles.barContainer}>
                    {renderProgressBar(selectedVillage.water, '#10b981')}
                    <Text style={styles.barPercentage}>{(selectedVillage.water * 100).toFixed(0)}%</Text>
                  </View>
                </View>

                <View style={styles.gapMetricItem}>
                  <Text style={styles.metricLabel}>Power Grid/Electricity</Text>
                  <View style={styles.barContainer}>
                    {renderProgressBar(selectedVillage.electricity, '#f59e0b')}
                    <Text style={styles.barPercentage}>{(selectedVillage.electricity * 100).toFixed(0)}%</Text>
                  </View>
                </View>

                <View style={styles.gapMetricItem}>
                  <Text style={styles.metricLabel}>Public Healthcare</Text>
                  <View style={styles.barContainer}>
                    {renderProgressBar(selectedVillage.health, '#ec4899')}
                    <Text style={styles.barPercentage}>{(selectedVillage.health * 100).toFixed(0)}%</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Interactive Village Selection List */}
          <Text style={styles.sectionTitle}>Select Village to Analyze</Text>
          <View style={styles.villageGrid}>
            {villages.map((item, idx) => {
              const isSelected = selectedVillage?.name === item.name;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.villageChip, isSelected && styles.villageChipActive]}
                  onPress={() => setSelectedVillage(item)}
                >
                  <View style={[styles.villageIndicator, { backgroundColor: getGapColor(item.gap) }]} />
                  <Text style={[styles.villageChipText, isSelected && styles.villageChipTextActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  lockCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#fbbf2415',
    borderWidth: 1,
    borderColor: '#fbbf2433',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 10,
  },
  descText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  btnSync: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnSyncText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  scrollContainer: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f8fafc',
  },
  headerDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 24,
  },
  metricsWrapper: {
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 18,
    padding: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  metricVal: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 12,
    marginTop: 10,
  },
  nodeCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  nodeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  nodeName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  nodeDesc: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  nodeDivider: {
    height: 1,
    backgroundColor: '#334155',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f8fafc',
  },
  detailBlock: {
    fontSize: 12,
    color: '#60a5fa',
    fontWeight: '700',
    marginTop: 2,
  },
  gapBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gapBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  populationText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 14,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 14,
  },
  gapMetricsRow: {
    gap: 12,
  },
  gapMetricItem: {
    gap: 6,
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barPercentage: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
    width: 32,
    textAlign: 'right',
  },
  villageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  villageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    margin: 4,
  },
  villageChipActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f61a',
  },
  villageIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  villageChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  villageChipTextActive: {
    color: '#3b82f6',
  },
});
export { styles };
