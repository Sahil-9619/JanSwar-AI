"use client";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageToggle } from "../../components/LanguageToggle";
import { useLanguage } from "../../context/LanguageContext";
import { Landmark } from "lucide-react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "../../store/authStore";
import { api } from "../../services/authService";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, MapPin, Calendar, Clock, CheckCircle2, AlertCircle, 
  Loader2, Sparkles, X, ListFilter, Activity, LayoutDashboard,
  Search, ShieldAlert, Check, TrendingUp, BarChart3, Users
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from "recharts";

interface Suggestion {
  id: string;
  title: string;
  description: string | null;
  transcription: string | null;
  translatedText: string | null;
  sentiment: string | null;
  status: "PENDING" | "PROCESSING" | "ANALYZED" | "APPROVED" | "REJECTED";
  latitude: number;
  longitude: number;
  createdAt: string;
  category: { name: string } | null;
  village: { name: string } | null;
  block: { name: string } | null;
  priorityScore: { finalScore: number } | null;
  user: { fullName: string; phoneNumber: string | null } | null;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priorityScore: number;
  status: "PENDING" | "APPROVED" | "COMPLETED";
  category: { name: string };
  village: { name: string } | null;
  block: { name: string } | null;
  createdAt: string;
}

interface BlockMetric {
  blockId: string;
  blockName: string;
  suggestionsCount: number;
  avgPriorityScore: number;
  avgInfrastructureGap: number;
}

export default function MPDashboard() {
  const router = useRouter();
  const { user, token, logout, isLoading: isAuthLoading, checkAuth } = useAuthStore();

  // Hydration guard
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Data states
  const [metrics, setMetrics] = useState<any>({
    total: 0, pending: 0, analyzed: 0, approved: 0, archived: 0, avgPriorityScore: 0
  });
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [blocksData, setBlocksData] = useState<BlockMetric[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  // UI filter states
  const [activeTab, setActiveTab] = useState<"overview" | "suggestions" | "recommendations">("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Selected interactive SVG Map item
  const [selectedMapVillage, setSelectedMapVillage] = useState<any>({
    name: "Kandap Village",
    block: "Sampatchak",
    population: 3100,
    gap: 0.82,
    road: 0.1,
    water: 0.2,
    electricity: 0.4,
    health: 0.1,
    education: 0.1
  });
  
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Auth verification & data synchronization
  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else if (!user) {
      checkAuth();
    }
  }, [token, user, checkAuth, router]);

  // Role guard redirect (now based on user.role after OTP verification)
  useEffect(() => {
    if (user) {
      if (user.role === "CITIZEN") {
        router.push("/citizen-dashboard");
      } else if (user.role === "DISTRICT_ADMIN" || user.role === "SUPER_ADMIN") {
        router.push("/admin-dashboard");
      }
    }
  }, [user, router]);

  // Fetch dashboard data when authenticated and role is not a guard role
  useEffect(() => {
    if (token && user && user.role !== "CITIZEN" && user.role !== "DISTRICT_ADMIN" && user.role !== "SUPER_ADMIN") {
      fetchAllData();
    }
  }, [token, user]);

  const fetchAllData = async () => {
    console.log('Starting fetchAllData');
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Fetch Metrics
      const metricsRes = await api.get("/analytics/metrics");
      setMetrics(metricsRes.data);

      // Fetch Categories Graph
      const catRes = await api.get("/analytics/categories");
      setCategoriesData(catRes.data.categories);

      // Fetch Geography data & points
      const locRes = await api.get("/analytics/locations");
      setBlocksData(locRes.data.blocks);

      // Fetch all suggestions (unscoped by user because role is MP)
      const sugRes = await api.get("/suggestions?limit=50");
      setSuggestions(sugRes.data.suggestions);

      // Fetch AI Recommendations
      const recRes = await api.get("/recommendations");
      setRecommendations(recRes.data.recommendations);

    } catch (err: any) {
      console.error("Fetch MP dashboard data error:", err);
      setErrorMessage("Unable to sync constituency metrics from the gateway.");
    } finally {
      setIsLoading(false);
      console.log('fetchAllData completed, isLoading:', false);
    }
  };

  const handleApproveRecommendation = async (recId: string) => {
    try {
      await api.patch(`/recommendations/${recId}`, { status: "APPROVED" });
      // Refresh
      fetchAllData();
    } catch (err) {
      console.error("Approve recommendation error:", err);
      alert("Failed to approve project proposal.");
    }
  };

  const handleLogout = async () => {
    logout();
    router.push("/login");
  };

  // Village coordinates and parameters for the custom Patna SVG Map
  const mockVillages = [
    { name: "Digha Village", block: "Patna Sadar", population: 12500, gap: 0.35, road: 0.8, water: 0.7, electricity: 0.9, health: 0.6, education: 0.7, cx: 160, cy: 110 },
    { name: "Phulwari Village", block: "Patna Sadar", population: 8400, gap: 0.58, road: 0.4, water: 0.5, electricity: 0.6, health: 0.3, education: 0.4, cx: 140, cy: 155 },
    { name: "Nasriganj Village", block: "Danapur", population: 9200, gap: 0.42, road: 0.6, water: 0.7, electricity: 0.8, health: 0.5, education: 0.6, cx: 80, cy: 75 },
    { name: "Khagaul Village", block: "Danapur", population: 15400, gap: 0.28, road: 0.9, water: 0.8, electricity: 0.9, health: 0.8, education: 0.8, cx: 105, cy: 125 },
    { name: "Bariarpur Village", block: "Sampatchak", population: 4300, gap: 0.75, road: 0.2, water: 0.3, electricity: 0.5, health: 0.1, education: 0.2, cx: 300, cy: 215 },
    { name: "Kandap Village", block: "Sampatchak", population: 3100, gap: 0.82, road: 0.1, water: 0.2, electricity: 0.4, health: 0.1, education: 0.1, cx: 335, cy: 190 }
  ];

  const getGapColor = (gap: number) => {
    if (gap < 0.35) return "#10b981"; // Green (Excellent)
    if (gap < 0.65) return "#f59e0b"; // Yellow (Warning)
    return "#ef4444"; // Red (Critical gap)
  };

  const getStatusBadge = (status: Suggestion["status"]) => {
    switch (status) {
      case "PENDING":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-amber-500/20 bg-amber-500/5 text-amber-300">Pending</span>;
      case "PROCESSING":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-blue-500/20 bg-blue-500/5 text-blue-300 flex items-center gap-1"><Loader2 className="w-2.5 h-2.5 animate-spin" /> Ingesting</span>;
      case "ANALYZED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-500/20 bg-emerald-500/5 text-emerald-300">AI Analyzed</span>;
      case "APPROVED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-teal-500/20 bg-teal-500/5 text-teal-300">Approved</span>;
      case "REJECTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-rose-500/20 bg-rose-500/5 text-rose-300">Archived</span>;
    }
  };

  // Recharts custom colors
  const CHART_COLORS = ["#3b82f6", "#818cf8", "#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

  // Filter items
  const filteredSuggestions = suggestions.filter(s => {
    const matchesCategory = categoryFilter === "ALL" || s.category?.name.toUpperCase() === categoryFilter.toUpperCase();
    const matchesSearch = searchQuery === "" || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.village?.name && s.village.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between overflow-x-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-border relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Landmark className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-foreground">
              JanSwar <span className="gradient-text">AI</span>
            </h1>
            <p className="text-[10px] text-primary uppercase tracking-widest font-semibold">MP constituency grid</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <LanguageToggle />
          <ThemeToggle />
          <div className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold">
              MP
            </div>
            <span className="max-w-[150px] truncate font-medium">{user.fullName}</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-rose-400 transition"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main dashboard content */}
      <main className="w-full max-w-7xl mx-auto px-6 py-8 flex-1 relative z-10">
        
        {/* Top summary row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Constituency Intelligence</h2>
            <p className="text-sm text-slate-400 mt-1">Patna District MP Planning Desk • Active development heatmaps & AI prioritization</p>
          </div>

          <div className="flex gap-2.5 bg-slate-900/60 p-1.5 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${activeTab === "overview" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
            >
              Overview Map
            </button>
            <button 
              onClick={() => setActiveTab("suggestions")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${activeTab === "suggestions" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
            >
              Citizen Suggestions ({suggestions.length})
            </button>
            <button 
              onClick={() => setActiveTab("recommendations")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${activeTab === "recommendations" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
            >
              AI Project Proposals ({recommendations.length})
            </button>
          </div>
        </div>

        {/* Loading / Error states */}
        {isLoading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm">Aggregating constituency metrics...</p>
          </div>
        ) : errorMessage ? (
          <div className="text-center py-20 bg-rose-950/5 border border-rose-500/10 rounded-3xl">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h4 className="font-bold text-lg">System Sync Offline</h4>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mt-1">{errorMessage}</p>
            <button onClick={fetchAllData} className="mt-6 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs hover:bg-white/10 transition">Re-establish Connection</button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Constituency Voice</span>
                      <span className="text-3xl font-extrabold mt-1 block">{metrics.total}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400"><Users className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Average Urgency Rate</span>
                      <span className="text-3xl font-extrabold mt-1 block text-indigo-300">
                        {metrics.avgPriorityScore ? metrics.avgPriorityScore.toFixed(0) : 0}/100
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400"><TrendingUp className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Approved Projects</span>
                      <span className="text-3xl font-extrabold mt-1 block text-emerald-400">{metrics.approved}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400"><CheckCircle2 className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Pending Review</span>
                      <span className="text-3xl font-extrabold mt-1 block text-amber-400">{metrics.pending}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400"><Clock className="w-5 h-5" /></div>
                  </div>
                </div>

                {/* GIS Maps & Interactive Region Details row */}
                <div className="grid lg:grid-cols-12 gap-6">
                  
                  {/* Custom Map Box */}
                  <div className="lg:col-span-8 glass-panel rounded-3xl p-6 border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-base text-white">Interactive Constituency Heatmap</h3>
                        <p className="text-xs text-slate-400">Patna blocks: Sadar, Danapur, Sampatchak. Color indicates infrastructure gap level.</p>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-semibold">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low Gap</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> High Gap</span>
                      </div>
                    </div>

                    {/* SVG Map Canvas */}
                    <div className="w-full bg-slate-950/50 rounded-2xl border border-white/5 flex items-center justify-center p-4 relative overflow-hidden h-[340px]">
                      {isMounted ? (
                        <svg viewBox="0 0 450 280" className="w-full h-full max-w-lg">
                          {/* Define map shadows */}
                          <defs>
                            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                              <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.5"/>
                            </filter>
                          </defs>

                          {/* Danapur Block Outline */}
                          <path 
                            d="M30,80 L180,40 L210,120 L130,170 L50,140 Z" 
                            fill="rgba(59, 130, 246, 0.05)" 
                            stroke="rgba(255,255,255,0.1)" 
                            strokeWidth="2" 
                            filter="url(#shadow)"
                            className="hover:fill-blue-500/10 transition cursor-pointer"
                          />
                          <text x="75" y="60" fill="rgba(255,255,255,0.2)" fontSize="10" fontWeight="bold" letterSpacing="1">DANAPUR</text>

                          {/* Patna Sadar Outline */}
                          <path 
                            d="M180,40 L300,50 L270,150 L210,120 Z" 
                            fill="rgba(99, 102, 241, 0.05)" 
                            stroke="rgba(255,255,255,0.1)" 
                            strokeWidth="2"
                            className="hover:fill-indigo-500/10 transition cursor-pointer"
                          />
                          <text x="210" y="70" fill="rgba(255,255,255,0.2)" fontSize="10" fontWeight="bold" letterSpacing="1">PATNA SADAR</text>

                          {/* Sampatchak Outline */}
                          <path 
                            d="M270,150 L420,110 L400,240 L290,260 L230,190 Z" 
                            fill="rgba(168, 85, 247, 0.05)" 
                            stroke="rgba(255,255,255,0.1)" 
                            strokeWidth="2"
                            className="hover:fill-purple-500/10 transition cursor-pointer"
                          />
                          <text x="310" y="140" fill="rgba(255,255,255,0.2)" fontSize="10" fontWeight="bold" letterSpacing="1">SAMPATCHAK</text>

                          {/* Draw Village Dots */}
                          {mockVillages.map((v) => (
                            <g 
                              key={v.name} 
                              onClick={() => setSelectedMapVillage(v)}
                              className="cursor-pointer"
                            >
                              <circle 
                                cx={v.cx} 
                                cy={v.cy} 
                                r={selectedMapVillage?.name === v.name ? "9" : "6"} 
                                fill={getGapColor(v.gap)} 
                                className="transition-all hover:r-9 hover:stroke-white hover:stroke-2"
                                stroke={selectedMapVillage?.name === v.name ? "#ffffff" : "rgba(255,255,255,0.2)"}
                                strokeWidth={selectedMapVillage?.name === v.name ? "2" : "1"}
                              />
                              <text 
                                x={v.cx} 
                                y={v.cy - 12} 
                                textAnchor="middle" 
                                fill="#94a3b8" 
                                fontSize="8" 
                                fontWeight="semibold"
                                className="pointer-events-none select-none bg-slate-900"
                              >
                                {v.name.split(" ")[0]}
                              </text>
                            </g>
                          ))}
                        </svg>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Map Detail Card */}
                  <div className="lg:col-span-4 glass-panel rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-indigo-400" />
                        <div>
                          <h4 className="font-bold text-white text-base">{selectedMapVillage.name}</h4>
                          <span className="text-xs text-indigo-300 font-medium">{selectedMapVillage.block} Block</span>
                        </div>
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                          <span className="text-slate-400">Total Population:</span>
                          <span className="text-white font-bold">{selectedMapVillage.population.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                          <span className="text-slate-400">Infrastructure Gap:</span>
                          <span className="text-rose-400 font-bold font-mono">{(selectedMapVillage.gap * 100).toFixed(0)}%</span>
                        </div>

                        {/* Access scores */}
                        <div className="space-y-2 pt-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Access Indicators (out of 10)</span>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Road Quality</span>
                              <span className="text-white font-mono">{(selectedMapVillage.road * 10).toFixed(0)}/10</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-blue-500 h-full" style={{ width: `${selectedMapVillage.road * 100}%` }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Clean Water Access</span>
                              <span className="text-white font-mono">{(selectedMapVillage.water * 10).toFixed(0)}/10</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-teal-500 h-full" style={{ width: `${selectedMapVillage.water * 100}%` }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Healthcare Access</span>
                              <span className="text-white font-mono">{(selectedMapVillage.health * 10).toFixed(0)}/10</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-red-500 h-full" style={{ width: `${selectedMapVillage.health * 100}%` }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Education Access</span>
                              <span className="text-white font-mono">{(selectedMapVillage.education * 10).toFixed(0)}/10</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-amber-500 h-full" style={{ width: `${selectedMapVillage.education * 100}%` }} />
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setActiveTab("suggestions");
                        setSearchQuery(selectedMapVillage.name);
                      }}
                      className="mt-6 w-full py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-semibold transition"
                    >
                      View Village Suggestions
                    </button>
                  </div>

                </div>

                {/* Bottom Charts Row */}
                <div className="grid md:grid-cols-12 gap-6">
                  
                  {/* Category Distribution Chart */}
                  <div className="md:col-span-8 glass-panel rounded-3xl p-6 border border-white/5">
                    <h3 className="font-bold text-base text-white mb-6 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      Suggestion Category Distribution
                    </h3>
                    <div className="h-[250px] w-full">
                      {isMounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={categoriesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <XAxis dataKey="category" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.08)", borderRadius: "12px", color: "#fff" }}
                              cursor={{ fill: "rgba(255,255,255,0.02)" }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {categoriesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Block Level Suggestions summary table */}
                  <div className="md:col-span-4 glass-panel rounded-3xl p-6 border border-white/5">
                    <h3 className="font-bold text-base text-white mb-4">Constituency Blocks</h3>
                    <div className="space-y-4 pt-2">
                      {blocksData.map((b) => (
                        <div key={b.blockId} className="flex justify-between items-center text-xs p-3 rounded-xl bg-white/5 border border-white/5">
                          <div>
                            <span className="font-bold text-slate-200 block">{b.blockName}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">{b.suggestionsCount} Suggestions</span>
                          </div>
                          <div className="text-right">
                            <span className="text-indigo-300 font-bold block">{b.avgPriorityScore.toFixed(0)} Avg Priority</span>
                            <span className="text-[10px] text-slate-400 block">Gap: {(b.avgInfrastructureGap * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </motion.div>
            )}

            {/* SUGGESTIONS TAB */}
            {activeTab === "suggestions" && (
              <motion.div 
                key="suggestions"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5 min-h-[500px]"
              >
                {/* Search / Filters Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6 pb-6 border-b border-white/5">
                  <div className="flex-1 relative max-w-sm">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search suggestions or villages..."
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
                    <button 
                      onClick={() => setCategoryFilter("ALL")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${categoryFilter === "ALL" ? "bg-blue-600 border-blue-500 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}
                    >
                      All
                    </button>
                    {categoriesData.map(c => (
                      <button 
                        key={c.category}
                        onClick={() => setCategoryFilter(c.category)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${categoryFilter.toUpperCase() === c.category.toUpperCase() ? "bg-blue-600 border-blue-500 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}
                      >
                        {c.category}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredSuggestions.length === 0 ? (
                  <div className="text-center py-20">
                    <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="font-bold text-slate-300">No suggestions match filters</h4>
                    <p className="text-slate-500 text-sm mt-1">Try relaxing your search terms or selecting another category.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSuggestions.map((item) => (
                      <div key={item.id} className="border border-white/5 bg-slate-900/10 rounded-2xl p-5 hover:border-white/10 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center flex-wrap gap-2.5">
                            <h4 className="font-bold text-base text-white">{item.title}</h4>
                            {item.category && (
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/10">
                                {item.category.name}
                              </span>
                            )}
                            {item.sentiment && (
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                item.sentiment === "POSITIVE" ? "bg-emerald-500/10 text-emerald-400" :
                                item.sentiment === "NEGATIVE" ? "bg-rose-500/10 text-rose-400" : "bg-slate-500/10 text-slate-400"
                              }`}>
                                {item.sentiment}
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-slate-400 line-clamp-2">{item.description || item.transcription || "No details provided"}</p>

                          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-600" />
                              <span>{item.block?.name || "Patna Sadar"}, {item.village?.name || "Village"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-600" />
                              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-600" />
                              <span>By {item.user?.fullName || "Citizen"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status / Priority Score */}
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-3 justify-between w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-white/5">
                          {getStatusBadge(item.status)}
                          
                          {item.priorityScore && (
                            <div className="flex items-center gap-1 text-xs text-indigo-300 font-semibold bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/10">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                              Priority Score: {item.priorityScore.finalScore.toFixed(0)}/100
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* RECOMMENDATIONS TAB */}
            {activeTab === "recommendations" && (
              <motion.div 
                key="recommendations"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="glass-panel rounded-3xl p-6 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-lg text-white">AI-Powered Development Proposals</h3>
                  </div>
                  <p className="text-xs text-slate-400">These recommendations are automatically generated by the JanSwar AI Engine using aggregated citizen request clusters and local infrastructure gaps.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col justify-between gap-6 hover:border-white/10 transition relative">
                      <div className="absolute top-6 right-6 flex items-center gap-1.5 text-xs text-indigo-300 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/10">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                        Priority: {rec.priorityScore.toFixed(0)}/100
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md text-[9px] uppercase font-bold bg-blue-500/10 text-blue-300 border border-blue-500/10">
                            {rec.category.name}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {rec.block?.name || "Patna"}, {rec.village?.name || "Constituency"}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-base text-white pr-20">{rec.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400">Status:</span>
                          {rec.status === "PENDING" && <span className="text-amber-400 font-bold">Awaiting Approval</span>}
                          {rec.status === "APPROVED" && <span className="text-blue-400 font-bold">Approved for Planning</span>}
                          {rec.status === "COMPLETED" && <span className="text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Project Completed</span>}
                        </div>

                        {rec.status === "PENDING" && (
                          <button 
                            onClick={() => handleApproveRecommendation(rec.id)}
                            className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow shadow-blue-500/10 hover:shadow-blue-500/20 transition"
                          >
                            Approve Project
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-white/5 relative z-10 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© 2026 JanSwar AI. All Rights Reserved. Built for Smarter District & MP Constituency Planning.</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer">Constituency Maps</span>
            <span className="hover:text-white cursor-pointer">AI Scoring Models</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
