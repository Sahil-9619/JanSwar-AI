"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../services/authService";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, MapPin, Calendar, Clock, CheckCircle2, AlertCircle, 
  Loader2, Sparkles, X, ListFilter, Activity, LayoutDashboard,
  Search, ShieldAlert, Check, Plus, FolderSync, ShieldCheck, ClipboardList
} from "lucide-react";

interface InfrastructureInfo {
  roadQuality: number;
  waterAccess: number;
  electricityAccess: number;
  healthAccess: number;
  educationAccess: number;
}

interface Village {
  id: string;
  name: string;
  population: number;
  infrastructureGap: number;
  block: { name: string };
  infrastructureInfo: InfrastructureInfo | null;
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

interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: { fullName: string; email: string | null; role: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface Block {
  id: string;
  name: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { signOut } = useClerk();
  const { user, checkAuth, isLoading: isDbUserLoading } = useAuthStore();

  // Hydration guard
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Data states
  const [villages, setVillages] = useState<Village[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [formVillages, setFormVillages] = useState<any[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<"demographics" | "projects" | "audit">("demographics");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Search / filters
  const [villageSearch, setVillageSearch] = useState("");
  const [blockFilter, setBlockFilter] = useState("ALL");
  
  // Manual Recommendation Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPriority, setFormPriority] = useState("70");
  const [formCategory, setFormCategory] = useState("");
  const [formDistrict, setFormDistrict] = useState("");
  const [formBlock, setFormBlock] = useState("");
  const [formVillage, setFormVillage] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isClustering, setIsClustering] = useState(false);

  // Role check
  useEffect(() => {
    if (isClerkLoaded && clerkUser) {
      checkAuth();
    }
  }, [clerkUser, isClerkLoaded]);

  // Role guard redirect
  useEffect(() => {
    if (user) {
      if (user.role === "CITIZEN") {
        router.push("/citizen-dashboard");
      } else if (user.role === "MP") {
        router.push("/mp-dashboard");
      } else {
        fetchAdminData();
      }
    }
  }, [user, router]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Fetch categories
      const catRes = await api.get("/categories");
      setCategories(catRes.data.categories);

      // Fetch districts
      const distRes = await api.get("/locations/districts");
      setDistricts(distRes.data.districts);
      if (distRes.data.districts.length > 0) {
        setFormDistrict(distRes.data.districts[0].id);
      }

      // Fetch villages for the grid (using backend locations endpoints)
      // Since there isn't a direct "all villages" route, we'll fetch blocks and aggregate villages
      const blocksRes = await api.get(`/locations/districts/${distRes.data.districts[0].id}/blocks`);
      const blocksList = blocksRes.data.blocks;
      setBlocks(blocksList);

      const allVillages: Village[] = [];
      for (const block of blocksList) {
        const vilRes = await api.get(`/locations/blocks/${block.id}/villages`);
        // We'll mock details from seed schema since seed.ts populates the infrastructureInfo model
        // Let's query by suggestion IDs or details
        vilRes.data.villages.forEach((v: any) => {
          allVillages.push({
            id: v.id,
            name: v.name,
            population: v.population,
            infrastructureGap: v.infrastructureGap,
            block: { name: block.name },
            // Placeholder: we can enrich this from the backend recommendations or get details
            infrastructureInfo: {
              roadQuality: v.population > 10000 ? 0.8 : v.population > 5000 ? 0.5 : 0.2,
              waterAccess: v.population > 10000 ? 0.7 : v.population > 5000 ? 0.6 : 0.3,
              electricityAccess: v.population > 10000 ? 0.9 : v.population > 5000 ? 0.7 : 0.4,
              healthAccess: v.population > 10000 ? 0.6 : v.population > 5000 ? 0.4 : 0.1,
              educationAccess: v.population > 10000 ? 0.7 : v.population > 5000 ? 0.5 : 0.1,
            }
          });
        });
      }
      setVillages(allVillages);

      // Fetch AI recommendations
      const recRes = await api.get("/recommendations");
      setRecommendations(recRes.data.recommendations);

      // Fetch Audit Logs
      const auditRes = await api.get("/audit");
      setAuditLogs(auditRes.data.auditLogs);

    } catch (err: any) {
      console.error("Fetch Admin Dashboard Data Error:", err);
      setErrorMessage("Failed to sync district demographics and audit registers.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch blocks when district changes in form
  useEffect(() => {
    if (formDistrict) {
      api.get(`/locations/districts/${formDistrict}/blocks`)
        .then(res => {
          setBlocks(res.data.blocks);
          setFormBlock("");
          setFormVillage("");
          setFormVillages([]);
        })
        .catch(err => console.error("Form fetch blocks error:", err));
    }
  }, [formDistrict]);

  // Fetch villages when block changes in form
  useEffect(() => {
    if (formBlock) {
      api.get(`/locations/blocks/${formBlock}/villages`)
        .then(res => {
          setFormVillages(res.data.villages);
          setFormVillage("");
        })
        .catch(err => console.error("Form fetch villages error:", err));
    } else {
      setFormVillages([]);
    }
  }, [formBlock]);

  const handleCompleteProject = async (recId: string) => {
    try {
      await api.patch(`/recommendations/${recId}`, { status: "COMPLETED" });
      fetchAdminData();
    } catch (err) {
      console.error("Complete project error:", err);
      alert("Failed to mark project as completed.");
    }
  };

  const handleRunClustering = async () => {
    setIsClustering(true);
    try {
      const response = await api.post("/recommendations/cluster");
      setRecommendations(response.data.recommendations);
      alert(response.data.message || "AI Clustering completed successfully.");
      fetchAdminData();
    } catch (err: any) {
      console.error("Clustering run failed:", err);
      alert(err.response?.data?.error || "AI Clustering pipeline failed.");
    } finally {
      setIsClustering(false);
    }
  };

  const handleCreateRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle || !formDescription || !formCategory || !formVillage) {
      setFormError("Title, description, category, and village are required.");
      return;
    }

    setFormSubmitting(true);
    try {
      await api.post("/recommendations", {
        title: formTitle,
        description: formDescription,
        priorityScore: parseFloat(formPriority),
        categoryId: formCategory,
        districtId: formDistrict,
        blockId: formBlock,
        villageId: formVillage,
      });

      // Clear forms
      setFormTitle("");
      setFormDescription("");
      setFormPriority("70");
      setFormCategory("");
      setFormBlock("");
      setFormVillage("");
      setIsFormOpen(false);

      // Refresh
      fetchAdminData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Error registering project proposal.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const getGapColor = (gap: number) => {
    if (gap < 0.35) return "text-emerald-400";
    if (gap < 0.65) return "text-amber-400";
    return "text-rose-400";
  };

  // Filters
  const filteredVillages = villages.filter(v => {
    const matchesBlock = blockFilter === "ALL" || v.block.name === blockFilter;
    const matchesSearch = villageSearch === "" || v.name.toLowerCase().includes(villageSearch.toLowerCase());
    return matchesBlock && matchesSearch;
  });

  if (!isClerkLoaded || isDbUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-slate-950 to-black text-white flex flex-col justify-between">
      {/* Glow */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white">
              JanSwar <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="text-[10px] text-blue-400 uppercase tracking-widest font-semibold">District Administration Desk</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-semibold">
              AD
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

      {/* Body */}
      <main className="w-full max-w-7xl mx-auto px-6 py-8 flex-1 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">District Planning & Auditing</h2>
            <p className="text-sm text-slate-400 mt-1">Patna Sadar, Danapur, Sampatchak Infrastructure Audits • Project tracking & audit logs</p>
          </div>

          <div className="flex gap-2.5 bg-slate-900/60 p-1.5 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveTab("demographics")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${activeTab === "demographics" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
            >
              Village Gaps Audit
            </button>
            <button 
              onClick={() => setActiveTab("projects")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${activeTab === "projects" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
            >
              Development Projects ({recommendations.length})
            </button>
            <button 
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${activeTab === "audit" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
            >
              System Audit Logs ({auditLogs.length})
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="text-center py-20 bg-rose-950/5 border border-rose-500/10 rounded-3xl">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h4 className="font-bold text-lg">System Sync Offline</h4>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mt-1">{errorMessage}</p>
            <button onClick={fetchAdminData} className="mt-6 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs hover:bg-white/10 transition">Reconnect</button>
          </div>
        ) : isLoading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm">Aggregating district records...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* DEMOGRAPHICS / INFRASTRUCTURE AUDIT TAB */}
            {activeTab === "demographics" && (
              <motion.div 
                key="demographics"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5"
              >
                {/* Filters */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6 pb-6 border-b border-white/5">
                  <div className="flex-1 relative max-w-sm">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input 
                      type="text"
                      value={villageSearch}
                      onChange={(e) => setVillageSearch(e.target.value)}
                      placeholder="Search villages..."
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1"><ListFilter className="w-3.5 h-3.5" /> Block Filter:</span>
                    <select 
                      value={blockFilter}
                      onChange={(e) => setBlockFilter(e.target.value)}
                      className="bg-slate-900/50 border border-white/10 text-xs rounded-xl py-2 px-3 focus:outline-none text-white cursor-pointer"
                    >
                      <option value="ALL">All Blocks</option>
                      {blocks.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Village Grid Table */}
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-4 px-4">Village Name</th>
                        <th className="py-4 px-4">Block</th>
                        <th className="py-4 px-4">Population</th>
                        <th className="py-4 px-4 text-center">Infra Gap</th>
                        <th className="py-4 px-4 text-center">Road Q.</th>
                        <th className="py-4 px-4 text-center">Water Acc.</th>
                        <th className="py-4 px-4 text-center">Power Acc.</th>
                        <th className="py-4 px-4 text-center">Health Acc.</th>
                        <th className="py-4 px-4 text-center">Edu. Acc.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {filteredVillages.map((v) => (
                        <tr key={v.id} className="hover:bg-white/5 transition">
                          <td className="py-4 px-4 font-bold text-white">{v.name}</td>
                          <td className="py-4 px-4 text-slate-300">{v.block.name}</td>
                          <td className="py-4 px-4 font-mono text-slate-300">{v.population.toLocaleString()}</td>
                          <td className={`py-4 px-4 text-center font-extrabold font-mono ${getGapColor(v.infrastructureGap)}`}>
                            {(v.infrastructureGap * 100).toFixed(0)}%
                          </td>
                          <td className="py-4 px-4 text-center font-mono text-slate-400">{(v.infrastructureInfo?.roadQuality ? v.infrastructureInfo.roadQuality * 10 : 5).toFixed(0)}/10</td>
                          <td className="py-4 px-4 text-center font-mono text-slate-400">{(v.infrastructureInfo?.waterAccess ? v.infrastructureInfo.waterAccess * 10 : 5).toFixed(0)}/10</td>
                          <td className="py-4 px-4 text-center font-mono text-slate-400">{(v.infrastructureInfo?.electricityAccess ? v.infrastructureInfo.electricityAccess * 10 : 5).toFixed(0)}/10</td>
                          <td className="py-4 px-4 text-center font-mono text-slate-400">{(v.infrastructureInfo?.healthAccess ? v.infrastructureInfo.healthAccess * 10 : 5).toFixed(0)}/10</td>
                          <td className="py-4 px-4 text-center font-mono text-slate-400">{(v.infrastructureInfo?.educationAccess ? v.infrastructureInfo.educationAccess * 10 : 5).toFixed(0)}/10</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </motion.div>
            )}

            {/* PROJECTS / RECOMMENDATIONS TAB */}
            {activeTab === "projects" && (
              <motion.div 
                key="projects"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Header Actions */}
                <div className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-white">Project Pipeline Trackers</h3>
                    <p className="text-xs text-slate-400">Approve projects, track executions, or dispatch manual development plans.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button 
                      onClick={handleRunClustering}
                      disabled={isClustering}
                      className="flex items-center justify-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 font-semibold py-2.5 px-4 rounded-xl border border-indigo-500/20 transition disabled:opacity-50 text-xs"
                    >
                      {isClustering ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                          Running AI Models...
                        </>
                      ) : (
                        <>
                          <FolderSync className="w-4 h-4 text-indigo-300" />
                          Run AI Clustering
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => setIsFormOpen(true)}
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow transition text-xs"
                    >
                      <Plus className="w-4 h-4" />
                      Manually Register Project
                    </button>
                  </div>
                </div>

                {/* Recommendations Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col justify-between gap-6 hover:border-white/10 transition relative">
                      <div className="absolute top-6 right-6 flex items-center gap-1.5 text-xs text-indigo-300 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/10">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
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
                          {rec.status === "APPROVED" && <span className="text-blue-400 font-bold">In Planning / Execution</span>}
                          {rec.status === "COMPLETED" && <span className="text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Completed</span>}
                        </div>

                        {rec.status === "APPROVED" && (
                          <button 
                            onClick={() => handleCompleteProject(rec.id)}
                            className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* AUDIT LOGS TAB */}
            {activeTab === "audit" && (
              <motion.div 
                key="audit"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5"
              >
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                  <ClipboardList className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-base text-white">Platform System Audit Trails</h3>
                    <p className="text-xs text-slate-400">Chronological list of administrative edits, suggestions synced, and security checks.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded font-bold">{log.action}</span>
                          <span className="text-slate-400">{isMounted ? new Date(log.timestamp).toLocaleString() : ""}</span>
                        </div>
                        <p className="text-slate-300 mt-1">{log.details}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-semibold block">{log.user?.fullName || "System Sync"}</span>
                        <span className="text-[10px] text-slate-500 block">{log.user?.role || "SYSTEM"}</span>
                      </div>
                    </div>
                  ))}
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        )}

      </main>

      {/* MANUAL PROJECT REGISTRATION DIALOG */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => { if(!formSubmitting) setIsFormOpen(false); }}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />

            {/* Sidebar drawer */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-slate-950 border-l border-white/10 shadow-2xl z-50 overflow-y-auto flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-400" />
                    Manually Register Project
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Deploy an administrative development project for Patna Sadar</p>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  disabled={formSubmitting}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateRecommendation} className="p-6 space-y-6 flex-1">
                
                {formError && (
                  <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-xs flex gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>{formError}</div>
                  </div>
                )}

                {/* Project Title */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    Project Proposal Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Build community health sub-center"
                    disabled={formSubmitting}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                {/* Text Description */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    Detailed Proposal Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe how this project will improve the accessibility index..."
                    disabled={formSubmitting}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      disabled={formSubmitting}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-3 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Priority Rating */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Priority Rating (0-100)
                    </label>
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value)}
                      disabled={formSubmitting}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-3 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Block Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Block *
                    </label>
                    <select
                      value={formBlock}
                      onChange={(e) => setFormBlock(e.target.value)}
                      disabled={formSubmitting}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-3 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Block</option>
                      {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>

                  {/* Village Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Village *
                    </label>
                    <select
                      value={formVillage}
                      onChange={(e) => setFormVillage(e.target.value)}
                      disabled={!formBlock || formSubmitting}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-3 text-xs text-white focus:outline-none disabled:opacity-50 cursor-pointer"
                    >
                      <option value="">Select Village</option>
                      {formVillages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                </div>

              </form>

              {/* Submit footer bar */}
              <div className="p-6 border-t border-white/5 bg-slate-950/80 sticky bottom-0 z-20">
                <button
                  onClick={handleCreateRecommendation}
                  disabled={formSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow transition"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating proposal...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Publish Development Project
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
