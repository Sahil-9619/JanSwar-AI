"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../services/authService";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, MapPin, Calendar, Clock, CheckCircle2, AlertCircle, 
  Loader2, Sparkles, X, ListFilter, Activity, LayoutDashboard,
  Search, ShieldAlert, Check, TrendingUp, BarChart3, Users,
  Maximize, Minimize, ShieldCheck, ClipboardList, Settings, HeartPulse, HardDrive, RefreshCw
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageToggle } from "../../components/LanguageToggle";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  LineChart, Line, CartesianGrid
} from "recharts";
import Image from "next/image";
import Link from "next/link";

interface AuditLog {
  id: string;
  action: string;
  tableName: string;
  recordId: string;
  oldValues: string | null;
  newValues: string | null;
  timestamp: string;
  user: {
    fullName: string;
    email: string;
    role: string;
  } | null;
}

interface Suggestion {
  id: string;
  title: string;
  description: string | null;
  transcription: string | null;
  status: "PENDING" | "PROCESSING" | "ANALYZED" | "APPROVED" | "REJECTED";
  createdAt: string;
  category: { name: string } | null;
  village: { name: string } | null;
  block: { name: string } | null;
  priorityScore: { finalScore: number } | null;
  user: { fullName: string; phoneNumber: string | null } | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user, token, logout, isLoading: isAuthLoading, checkAuth } = useAuthStore();

  // Navigation sidebar collapse state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "audits" | "suggestions" | "health">("overview");

  // Full Screen API state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Data states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [metrics, setMetrics] = useState<any>({
    total: 0, pending: 0, analyzed: 0, approved: 0, archived: 0, avgPriorityScore: 0
  });
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  // Hydration state
  const [isMounted, setIsMounted] = useState(false);

  // Authenticate user & check admin roles
  useEffect(() => {
    setIsMounted(true);
    if (!token) {
      router.push("/login");
    } else if (!user) {
      checkAuth();
    }
  }, [token, user, checkAuth, router]);

  // Client-side role redirection guard
  useEffect(() => {
    if (user) {
      if (user.role === "CITIZEN") {
        router.push("/citizen-dashboard");
      } else if (user.role === "MP") {
        router.push("/mp-dashboard");
      }
    }
  }, [user, router]);

  // Fetch admin dashboard parameters
  useEffect(() => {
    if (token && user && (user.role === "DISTRICT_ADMIN" || user.role === "SUPER_ADMIN")) {
      fetchAdminData();
    }
  }, [token, user]);

  const fetchAdminData = async () => {
    setIsLoadingData(true);
    setErrorMsg(null);
    try {
      // 1. Fetch Metrics
      const metricsRes = await api.get("/analytics/metrics");
      setMetrics(metricsRes.data);

      // 2. Fetch Category Distribution
      const catRes = await api.get("/analytics/categories");
      setCategoriesData(catRes.data.categories);

      // 3. Fetch Audit Logs
      const auditRes = await api.get("/audit");
      setAuditLogs(auditRes.data.auditLogs);

      // 4. Fetch Suggestions
      const suggestionsRes = await api.get("/suggestions?limit=100");
      setSuggestions(suggestionsRes.data.suggestions);

    } catch (err: any) {
      console.error("Admin Dashboard Fetch Error:", err);
      setErrorMsg("Failed to synchronize administrative metrics from microservices.");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Full Screen trigger
  const toggleFullscreen = () => {
    if (typeof window === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error("Fullscreen fail:", err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch((err) => console.error("Exit fullscreen fail:", err));
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isAuthLoading || !user || (user.role !== "DISTRICT_ADMIN" && user.role !== "SUPER_ADMIN")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Filtered Audit Logs
  const filteredAudits = auditLogs.filter(log => {
    const query = auditSearch.toLowerCase();
    return log.action.toLowerCase().includes(query) ||
           log.tableName.toLowerCase().includes(query) ||
           (log.user?.fullName && log.user.fullName.toLowerCase().includes(query)) ||
           (log.user?.email && log.user.email.toLowerCase().includes(query));
  });

  // Filtered Suggestions
  const filteredSuggestions = suggestions.filter(s => {
    const query = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(query) ||
           (s.description && s.description.toLowerCase().includes(query)) ||
           (s.user?.fullName && s.user.fullName.toLowerCase().includes(query));
  });

  const getStatusBadge = (status: Suggestion["status"]) => {
    switch (status) {
      case "PENDING":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/25 bg-amber-500/10 text-amber-500 dark:text-amber-300">Pending</span>;
      case "PROCESSING":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-blue-500/25 bg-blue-500/10 text-blue-500 dark:text-blue-300 flex items-center gap-1"><Loader2 className="w-2.5 h-2.5 animate-spin" /> Ingesting</span>;
      case "ANALYZED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/25 bg-emerald-500/10 text-emerald-500 dark:text-emerald-300">AI Analyzed</span>;
      case "APPROVED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-teal-500/25 bg-teal-500/10 text-teal-500 dark:text-teal-300">Approved</span>;
      case "REJECTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-rose-500/25 bg-rose-500/10 text-rose-500 dark:text-rose-300">Archived</span>;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20";
    if (action.includes("DELETE")) return "text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20";
    return "text-indigo-500 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20";
  };

  // Mock server health indicators
  const serverMetrics = [
    { name: "CPU Utilization", value: "14%", progress: 14, color: "bg-emerald-500" },
    { name: "Memory Allocations", value: "1.4 GB / 8.0 GB", progress: 18, color: "bg-blue-500" },
    { name: "PostgreSQL Connections", value: "24 Active", progress: 30, color: "bg-indigo-500" },
    { name: "Gemini AI API Latency", value: "320ms", progress: 10, color: "bg-teal-500" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between overflow-x-hidden pt-14">
      {/* Ambient background glows */}
      <div className="absolute top-[10%] left-[-10%] w-[30vw] h-[30vw] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-5%] w-[35vw] h-[35vw] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Thin top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full h-14 border-b border-border/40 bg-background/65 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-[1600px] h-full mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-8 h-8 rounded-lg border border-primary/20 bg-white/5 p-0.5 flex items-center justify-center">
                <Image src="/JS_logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <span className="font-black text-base tracking-tight text-foreground flex items-center gap-1 select-none">
                JanSwar <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Admin</span>
              </span>
            </Link>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] font-black uppercase text-rose-500 tracking-wider">
              {user.role === "SUPER_ADMIN" ? "Super Controller" : "District Admin"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            
            {/* Fullscreen Option */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-card border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition shadow-sm"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            <div className="hidden md:flex items-center gap-2 bg-card/60 border border-border/60 rounded-full px-2.5 py-1 text-xs font-bold">
              <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 text-[9px] font-black">
                {user.fullName.charAt(0)}
              </div>
              <span className="max-w-[90px] truncate">{user.fullName}</span>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg bg-card border border-border/60 hover:border-rose-500/20 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition shadow-sm"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar + Main Grid Content Wrapper */}
      <div className="flex flex-1 max-w-[1600px] w-full mx-auto px-4 gap-4 relative z-10 items-stretch">
        
        {/* Collapsible Sidebar */}
        <aside className={`${sidebarOpen ? "w-64" : "w-16"} transition-all duration-300 border-r border-border/40 py-6 pr-4 hidden md:flex flex-col gap-6 flex-shrink-0 select-none`}>
          <div className="flex flex-col gap-1.5">
            <button 
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "overview" ? "bg-primary text-white shadow-md shadow-primary/10" : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              {sidebarOpen && <span>{language === "hi" ? "अवलोकन" : "System Overview"}</span>}
            </button>

            <button 
              onClick={() => setActiveTab("audits")}
              className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "audits" ? "bg-primary text-white shadow-md shadow-primary/10" : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <ClipboardList className="w-4.5 h-4.5" />
              {sidebarOpen && <span>{language === "hi" ? "ऑडिट लॉग" : "System Audit Logs"}</span>}
            </button>

            <button 
              onClick={() => setActiveTab("suggestions")}
              className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "suggestions" ? "bg-primary text-white shadow-md shadow-primary/10" : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity className="w-4.5 h-4.5" />
              {sidebarOpen && <span>{language === "hi" ? "सुझाव प्रबंधन" : "Constituency Grievances"}</span>}
            </button>

            <button 
              onClick={() => setActiveTab("health")}
              className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "health" ? "bg-primary text-white shadow-md shadow-primary/10" : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <HeartPulse className="w-4.5 h-4.5" />
              {sidebarOpen && <span>{language === "hi" ? "सिस्टम स्वास्थ्य" : "Telemetry Health"}</span>}
            </button>
          </div>

          <div className="mt-auto border-t border-border/40 pt-4 flex flex-col gap-2">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="py-1.5 px-3 bg-muted border border-border/60 hover:bg-accent text-[10px] font-black rounded-lg text-center transition tracking-widest uppercase text-muted-foreground hover:text-foreground w-full"
            >
              {sidebarOpen ? "Collapse Navigation" : "»"}
            </button>
          </div>
        </aside>

        {/* Dynamic Panel Window */}
        <main className="flex-1 py-6 overflow-hidden flex flex-col">
          {isLoadingData ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Syncing Admin Engine data...</p>
            </div>
          ) : errorMsg ? (
            <div className="flex-1 flex flex-col items-center justify-center border border-rose-500/25 bg-rose-500/5 rounded-3xl p-10 text-center max-w-lg mx-auto self-center">
              <ShieldAlert className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
              <h4 className="font-black text-lg text-foreground">Sync Link Severed</h4>
              <p className="text-muted-foreground text-xs font-semibold mt-1.5 leading-relaxed">{errorMsg}</p>
              <button 
                onClick={fetchAdminData} 
                className="mt-6 px-5 py-2.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition"
              >
                Reconnect Dashboard Link
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              
              {/* SYSTEM OVERVIEW TAB */}
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 flex-1 overflow-y-auto pr-1"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-black text-foreground">Administrative Core Overview</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Macro telemetry, system-wide prioritization stats, and audits sync.</p>
                    </div>
                    <button 
                      onClick={fetchAdminData}
                      className="p-2 bg-card border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition"
                      title="Sync Database Logs"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Summary Metric Blocks */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card/50 border border-border/60 rounded-2xl p-4 shadow-sm relative overflow-hidden backdrop-blur-sm">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">System Suggestions</span>
                      <span className="text-2xl font-black mt-1 block text-foreground">{metrics.total}</span>
                    </div>

                    <div className="bg-card/50 border border-border/60 rounded-2xl p-4 shadow-sm relative overflow-hidden backdrop-blur-sm">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Average Urgency Index</span>
                      <span className="text-2xl font-black mt-1 block text-indigo-500">
                        {metrics.avgPriorityScore ? metrics.avgPriorityScore.toFixed(1) : 0}/100
                      </span>
                    </div>

                    <div className="bg-card/50 border border-border/60 rounded-2xl p-4 shadow-sm relative overflow-hidden backdrop-blur-sm">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block font-bold">Approved Proposals</span>
                      <span className="text-2xl font-black mt-1 block text-emerald-500">{metrics.approved}</span>
                    </div>

                    <div className="bg-card/50 border border-border/60 rounded-2xl p-4 shadow-sm relative overflow-hidden backdrop-blur-sm">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block font-bold">Pending Review</span>
                      <span className="text-2xl font-black mt-1 block text-rose-500">{metrics.pending}</span>
                    </div>
                  </div>

                  {/* High quality graph & telemetry columns */}
                  <div className="grid lg:grid-cols-12 gap-4">
                    
                    {/* Category distribution */}
                    <div className="lg:col-span-8 bg-card/50 border border-border/60 rounded-3xl p-5 shadow-sm backdrop-blur-sm">
                      <h3 className="font-black text-sm text-foreground mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                        Grievances Grouped by Ingested Categories
                      </h3>
                      <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={categoriesData} margin={{ top: 5, right: 10, left: -30, bottom: 5 }}>
                            <XAxis dataKey="category" stroke="currentColor" className="text-[9px] opacity-60" tickLine={false} />
                            <YAxis stroke="currentColor" className="text-[9px] opacity-60" tickLine={false} allowDecimals={false} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "10px" }}
                              cursor={{ fill: "rgba(0,0,0,0.05)" }}
                            />
                            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                              {categoriesData.map((entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={idx % 2 === 0 ? "#2563eb" : "#4f46e5"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Audit logs quick glimpse */}
                    <div className="lg:col-span-4 bg-card/50 border border-border/60 rounded-3xl p-5 shadow-sm flex flex-col justify-between backdrop-blur-sm">
                      <div>
                        <h3 className="font-black text-sm text-foreground mb-4 flex items-center gap-1.5">
                          <ShieldCheck className="w-4.5 h-4.5 text-indigo-500" />
                          Recent System Activity
                        </h3>
                        <div className="space-y-3">
                          {auditLogs.slice(0, 3).map((log) => (
                            <div key={log.id} className="text-[11px] bg-background/50 border border-border p-2.5 rounded-xl flex flex-col gap-1 relative shadow-sm">
                              <div className="flex justify-between items-center">
                                <span className={getActionColor(log.action)}>{log.action.split("_")[0]}</span>
                                <span className="text-[9px] text-muted-foreground font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <span className="text-foreground font-extrabold truncate block">{log.tableName} reference</span>
                              <span className="text-muted-foreground font-semibold truncate block">By {log.user?.fullName || "System Admin"}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={() => setActiveTab("audits")}
                        className="mt-4 w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition text-center"
                      >
                        Launch Audit Log Viewer
                      </button>
                    </div>

                  </div>

                </motion.div>
              )}

              {/* AUDIT LOGS PANEL */}
              {activeTab === "audits" && (
                <motion.div
                  key="audits"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5 flex-1 flex flex-col overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-black text-foreground">System Audit Trail</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Seeded tracking logs for district entities, MP approvals, and user updates.</p>
                    </div>

                    <div className="relative w-full max-w-xs">
                      <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                      <input 
                        type="text"
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                        placeholder="Search audit trail..."
                        className="w-full bg-background border border-border rounded-xl py-1.5 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Audit logs Table */}
                  <div className="flex-1 bg-card/50 border border-border/60 rounded-3xl overflow-hidden flex flex-col shadow-sm backdrop-blur-sm">
                    <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-muted/80 text-muted-foreground uppercase font-black text-[9px] tracking-wider sticky top-0 z-10 border-b border-border">
                          <tr>
                            <th className="py-3 px-4">Timestamp</th>
                            <th className="py-3 px-4">Operator</th>
                            <th className="py-3 px-4">Action</th>
                            <th className="py-3 px-4">Database Table</th>
                            <th className="py-3 px-4">Record Identifier</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 font-semibold text-foreground">
                          {filteredAudits.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-20 text-muted-foreground">
                                No audit events matching search criteria found.
                              </td>
                            </tr>
                          ) : (
                            filteredAudits.map((log) => (
                              <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                                <td className="py-2.5 px-4 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="py-2.5 px-4 whitespace-nowrap">
                                  <div>
                                    <span className="font-extrabold block text-[11px]">{log.user?.fullName || "System Engine"}</span>
                                    <span className="text-[10px] text-muted-foreground block">{log.user?.email || "internal@janswar.com"}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-4 whitespace-nowrap">
                                  <span className={getActionColor(log.action)}>{log.action}</span>
                                </td>
                                <td className="py-2.5 px-4 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                                  {log.tableName}
                                </td>
                                <td className="py-2.5 px-4 font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                                  {log.recordId}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* CONSTITUENCY GRIEVANCES LIST */}
              {activeTab === "suggestions" && (
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5 flex-1 flex flex-col overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-black text-foreground">Constituency Grievance Dashboard</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Manage, track AI scores, and audit user-raised infrastructural issues.</p>
                    </div>

                    <div className="relative w-full max-w-xs">
                      <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search suggestions or users..."
                        className="w-full bg-background border border-border rounded-xl py-1.5 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex-1 bg-card/50 border border-border/60 rounded-3xl overflow-hidden flex flex-col shadow-sm backdrop-blur-sm">
                    <div className="flex-1 overflow-y-auto">
                      <div className="divide-y divide-border/60">
                        {filteredSuggestions.length === 0 ? (
                          <div className="text-center py-20 text-muted-foreground text-xs">
                            No citizen suggestions found.
                          </div>
                        ) : (
                          filteredSuggestions.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-muted/10 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div className="flex-1 space-y-1.5">
                                <div className="flex items-center flex-wrap gap-2">
                                  <h4 className="font-extrabold text-sm text-foreground">{item.title}</h4>
                                  {item.category && (
                                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-primary/10 text-primary border border-primary/20">
                                      {item.category.name}
                                    </span>
                                  )}
                                  {item.priorityScore && (
                                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                      Score: {item.priorityScore.finalScore.toFixed(0)}
                                    </span>
                                  )}
                                </div>

                                <p className="text-[11px] text-muted-foreground font-semibold line-clamp-2 leading-relaxed">
                                  {item.description || item.transcription || "No details provided"}
                                </p>

                                <div className="flex flex-wrap items-center gap-x-3 text-[10px] font-black uppercase text-muted-foreground/80 tracking-wider">
                                  <span>Block: {item.block?.name || "Patna Sadar"}</span>
                                  <span>•</span>
                                  <span>Village: {item.village?.name || "Village"}</span>
                                  <span>•</span>
                                  <span>By {item.user?.fullName || "Citizen"}</span>
                                </div>
                              </div>

                              <div className="flex-shrink-0">
                                {getStatusBadge(item.status)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TELEMETRY HEALTH PANEL */}
              {activeTab === "health" && (
                <motion.div
                  key="health"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 flex-1 overflow-y-auto pr-1"
                >
                  <div>
                    <h2 className="text-xl font-black text-foreground">Infrastructure Telemetry & Health</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Real-time status of gateways, databases, and microservices.</p>
                  </div>

                  {/* Telemetry diagnostics */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {serverMetrics.map((met) => (
                      <div key={met.name} className="bg-card/50 border border-border/60 rounded-2xl p-4 shadow-sm flex flex-col gap-2 backdrop-blur-sm">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-muted-foreground uppercase text-[10px] tracking-wider">{met.name}</span>
                          <span className="text-foreground">{met.value}</span>
                        </div>
                        <div className="w-full bg-background rounded-full h-2 overflow-hidden shadow-inner border border-border/50">
                          <div className={`h-full ${met.color}`} style={{ width: `${met.progress}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Microservice health cards */}
                  <div className="bg-card/50 border border-border/60 rounded-3xl p-5 shadow-sm backdrop-blur-sm space-y-4">
                    <h3 className="font-black text-sm text-foreground flex items-center gap-1.5">
                      <Settings className="w-4.5 h-4.5 text-blue-500" />
                      Constituency Deployment Topology
                    </h3>

                    <div className="grid sm:grid-cols-3 gap-4 text-xs font-semibold text-foreground">
                      <div className="p-3 bg-background/50 border border-border rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                          <span className="font-extrabold block">Frontend Gateway</span>
                          <span className="text-[10px] text-muted-foreground block">Port 3000 • Next.js</span>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>

                      <div className="p-3 bg-background/50 border border-border rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                          <span className="font-extrabold block">Backend Controller</span>
                          <span className="text-[10px] text-muted-foreground block">Port 5000 • Express</span>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>

                      <div className="p-3 bg-background/50 border border-border rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                          <span className="font-extrabold block">AI Fast-API Service</span>
                          <span className="text-[10px] text-muted-foreground block">Port 8000 • Uvicorn</span>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full py-4 border-t border-border/40 text-center text-[11px] text-muted-foreground mt-4 relative z-10 bg-card/15 backdrop-blur-sm font-semibold select-none">
        <p>© 2026 JanSwar AI Constituency Management Systems. Patna Division. Admin Portal v1.0.0.</p>
      </footer>
    </div>
  );
}
