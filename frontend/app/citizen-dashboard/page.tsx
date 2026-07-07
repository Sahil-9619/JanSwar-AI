"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../services/authService";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, Plus, MapPin, Calendar, Clock, CheckCircle2, 
  AlertCircle, Mic, Square, Trash2, Upload, FileText, Image as ImageIcon,
  Loader2, Sparkles, Send, X, HelpCircle, User, ListFilter, Activity
} from "lucide-react";

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
}

export default function CitizenDashboard() {
  const router = useRouter();
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { signOut } = useClerk();
  const { user, checkAuth, isLoading: isDbUserLoading } = useAuthStore();

  // Suggestion list states
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Form states
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  // Selected geography & form variables
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // Files
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Location Geolocation states
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Submit action state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync profile & fetch data when Clerk session is ready
  useEffect(() => {
    if (isClerkLoaded && clerkUser) {
      checkAuth();
      fetchSuggestions();
      fetchMetadata();
    }
  }, [clerkUser, isClerkLoaded]);

  // Client-side role redirection guard
  useEffect(() => {
    if (user) {
      if (user.role === "MP") {
        router.push("/mp-dashboard");
      } else if (user.role === "DISTRICT_ADMIN" || user.role === "SUPER_ADMIN") {
        router.push("/admin-dashboard");
      }
    }
  }, [user, router]);

  const fetchSuggestions = async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const res = await api.get("/suggestions");
      setSuggestions(res.data.suggestions);
    } catch (err: any) {
      setListError(err.response?.data?.error || "Failed to load suggestions.");
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      // Fetch categories
      const catRes = await api.get("/categories");
      setCategories(catRes.data.categories);

      // Fetch districts
      const distRes = await api.get("/locations/districts");
      setDistricts(distRes.data.districts);
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  };

  // Fetch blocks when district changes
  useEffect(() => {
    if (selectedDistrict) {
      api.get(`/locations/districts/${selectedDistrict}/blocks`)
        .then(res => {
          setBlocks(res.data.blocks);
          setVillages([]);
          setSelectedBlock("");
          setSelectedVillage("");
        })
        .catch(err => console.error("Fetch blocks error:", err));
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
          setVillages(res.data.villages);
          setSelectedVillage("");
        })
        .catch(err => console.error("Fetch villages error:", err));
    } else {
      setVillages([]);
    }
  }, [selectedBlock]);

  // Handle Fetching Geolocation coordinates
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        // Fallback to mock Patna coordinates
        setLat(25.5941);
        setLng(85.1376);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Start Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFileUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioFileUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      // Start timer
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone permission denied. Cannot record suggestion.");
    }
  };

  // Stop Audio Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordDuration(0);
  };

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!title) {
      setSubmitError("Suggestion Title is required.");
      return;
    }

    if (!lat || !lng) {
      setSubmitError("Location coordinates are required. Please click 'Detect Coordinates'.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("latitude", lat.toString());
    formData.append("longitude", lng.toString());
    
    if (selectedCategory) formData.append("categoryId", selectedCategory);
    if (selectedDistrict) formData.append("districtId", selectedDistrict);
    if (selectedBlock) formData.append("blockId", selectedBlock);
    if (selectedVillage) formData.append("villageId", selectedVillage);

    // Append Media Files
    if (audioBlob) {
      formData.append("audio", audioBlob, "voice-suggestion.webm");
    }
    if (imageFile) {
      formData.append("image", imageFile);
    }
    if (docFile) {
      formData.append("document", docFile);
    }

    try {
      await api.post("/suggestions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      // Clear forms
      setTitle("");
      setDescription("");
      setSelectedCategory("");
      setSelectedDistrict("");
      setSelectedBlock("");
      setSelectedVillage("");
      setLat(null);
      setLng(null);
      setImageFile(null);
      setDocFile(null);
      deleteRecording();
      setIsSubmitOpen(false);

      // Refresh listing
      fetchSuggestions();
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || "Error submitting suggestion. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: Suggestion["status"]) => {
    switch (status) {
      case "PENDING":
        return <span className="px-3 py-1 rounded-full text-xs font-medium border border-amber-500/20 bg-amber-500/5 text-amber-300">Pending Ingestion</span>;
      case "PROCESSING":
        return <span className="px-3 py-1 rounded-full text-xs font-medium border border-blue-500/20 bg-blue-500/5 text-blue-300 flex items-center gap-1.5 w-max"><Loader2 className="w-3 h-3 animate-spin text-blue-400" /> AI Processing</span>;
      case "ANALYZED":
        return <span className="px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20 bg-emerald-500/5 text-emerald-300">AI Analyzed</span>;
      case "APPROVED":
        return <span className="px-3 py-1 rounded-full text-xs font-medium border border-teal-500/20 bg-teal-500/5 text-teal-300">Approved for planning</span>;
      case "REJECTED":
        return <span className="px-3 py-1 rounded-full text-xs font-medium border border-rose-500/20 bg-rose-500/5 text-rose-300">Archived</span>;
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  if (!isClerkLoaded || isDbUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-slate-950 to-black text-white flex flex-col justify-between">
      
      {/* Background glowing lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="font-bold text-lg text-white">JS</span>
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white">
              JanSwar <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Citizen dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-semibold">
              {user?.fullName.charAt(0) || "C"}
            </div>
            <span className="max-w-[120px] truncate font-medium">{user?.fullName}</span>
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

      {/* Main Body */}
      <main className="w-full max-w-7xl mx-auto px-6 py-10 flex-1 relative z-10">
        
        {/* Top Header Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Your Development Voice</h2>
            <p className="text-sm text-slate-400 mt-1">Submit road, water, health suggestions and track their AI planning progression.</p>
          </div>

          <button 
            onClick={() => setIsSubmitOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-5 rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 transition-all hover:-translate-y-[1px]"
          >
            <Plus className="w-4.5 h-4.5" />
            New Suggestion
          </button>
        </div>

        {/* Status Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Submitted Requests</span>
            <span className="text-3xl font-extrabold">{suggestions.length}</span>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Processing</span>
            <span className="text-3xl font-extrabold text-blue-400">
              {suggestions.filter(s => s.status === "PROCESSING").length}
            </span>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Analyzed</span>
            <span className="text-3xl font-extrabold text-emerald-400">
              {suggestions.filter(s => s.status === "ANALYZED" || s.status === "APPROVED").length}
            </span>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority Scored</span>
            <span className="text-3xl font-extrabold text-indigo-400">
              {suggestions.filter(s => s.priorityScore).length}
            </span>
          </div>

        </div>

        {/* Suggestions List Container */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5 min-h-[350px] relative">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <h3 className="font-bold text-lg">Suggestion Tracking History</h3>
            <ListFilter className="w-4 h-4 text-slate-400" />
          </div>

          {isLoadingList ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : listError ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
              <p className="font-medium text-slate-300">{listError}</p>
              <button onClick={fetchSuggestions} className="mt-4 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-sm hover:bg-white/10 transition">Try Again</button>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center">
              <Activity className="w-12 h-12 text-slate-600 mb-4" />
              <h4 className="font-bold text-slate-300">No suggestions submitted yet</h4>
              <p className="text-slate-500 text-sm max-w-sm mt-1">Submit your first suggestion using voice recording or text. Let's make Patna Sadar smarter.</p>
              <button 
                onClick={() => setIsSubmitOpen(true)}
                className="mt-6 px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl text-sm font-semibold transition"
              >
                Launch Submission Wizard
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((item) => (
                <div key={item.id} className="border border-white/5 bg-slate-900/10 rounded-2xl p-5 hover:border-white/10 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center flex-wrap gap-2.5">
                      <h4 className="font-bold text-base text-white">{item.title}</h4>
                      {item.category && (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/10">
                          {item.category.name}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-400 line-clamp-2">{item.description || item.transcription || "No details provided"}</p>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-600" />
                        <span>Patna District, {item.block?.name || "Sadar"}, {item.village?.name || "Village"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Priority Weight details */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-3 justify-between w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-white/5">
                    {getStatusBadge(item.status)}
                    
                    {item.priorityScore && (
                      <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/10">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        Priority Score: {item.priorityScore.finalScore.toFixed(0)}/100
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* SUBMISSION SIDE PANEL OVERLAY */}
      <AnimatePresence>
        {isSubmitOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => { if(!isSubmitting) setIsSubmitOpen(false); }}
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
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    Submit Suggestion
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Multi-format intelligence input parsing (Speech/Text)</p>
                </div>
                <button 
                  onClick={() => setIsSubmitOpen(false)}
                  disabled={isSubmitting}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitSuggestion} className="p-6 space-y-6 flex-1">
                
                {submitError && (
                  <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-xs flex gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>{submitError}</div>
                  </div>
                )}

                {/* Suggestion Title */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    Suggestion / Issue Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Repair damaged bridge at Village entry"
                    disabled={isSubmitting}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                {/* Text Description */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    Detailed Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about the infrastructure gap. (Optional if submitting Voice recording)"
                    disabled={isSubmitting}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition resize-none"
                  />
                </div>

                {/* Categories & Geography Row */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-3 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* District Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      District
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-3 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="">Select District</option>
                      {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                </div>

                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Block Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Block
                    </label>
                    <select
                      value={selectedBlock}
                      onChange={(e) => setSelectedBlock(e.target.value)}
                      disabled={!selectedDistrict || isSubmitting}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-3 text-xs text-white focus:outline-none disabled:opacity-50 cursor-pointer"
                    >
                      <option value="">Select Block</option>
                      {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>

                  {/* Village Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Village
                    </label>
                    <select
                      value={selectedVillage}
                      onChange={(e) => setSelectedVillage(e.target.value)}
                      disabled={!selectedBlock || isSubmitting}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-3 text-xs text-white focus:outline-none disabled:opacity-50 cursor-pointer"
                    >
                      <option value="">Select Village</option>
                      {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>

                </div>

                {/* GEOLOCATION DETECTOR */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-xs">GPS Location coordinates *</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Required for spatial planning and heatmap mapping</p>
                    {lat && lng && (
                      <p className="text-[11px] font-mono text-emerald-400 mt-1.5">Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating || isSubmitting}
                    className="flex items-center gap-1.5 py-2 px-3.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold transition disabled:opacity-50 self-start sm:self-auto"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5" />
                        Grab Current GPS
                      </>
                    )}
                  </button>
                </div>

                {/* AUDIO RECORDER CONTAINER */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    Voice Suggestion (Multilingual Speech to Text)
                  </label>
                  <div className="border border-white/10 rounded-2xl p-4 bg-slate-900/30 flex flex-col items-center justify-center gap-4">
                    {!audioUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        {isRecording ? (
                          <div className="flex flex-col items-center gap-3">
                            {/* Recording pulse animation */}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                              Recording Voice...
                            </div>
                            <span className="text-2xl font-mono text-white tracking-widest">{formatDuration(recordDuration)}</span>
                            <button
                              type="button"
                              onClick={stopRecording}
                              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white transition-all shadow-lg shadow-rose-500/20"
                            >
                              <Square className="w-5 h-5 fill-white" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-[11px] text-slate-500 text-center">Record suggestion in Hindi, English, Bhojpuri, or Maithili</p>
                            <button
                              type="button"
                              onClick={startRecording}
                              disabled={isSubmitting}
                              className="flex items-center gap-2 py-3 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/15 disabled:opacity-50"
                            >
                              <Mic className="w-4 h-4" />
                              Start Voice Recording
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="w-full space-y-3">
                        <div className="flex items-center justify-between text-xs bg-white/5 border border-white/10 rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <Mic className="w-4 h-4 text-emerald-400" />
                            <span className="font-semibold text-slate-300">Voice Record Ready</span>
                          </div>
                          <button
                            type="button"
                            onClick={deleteRecording}
                            disabled={isSubmitting}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-rose-400 transition disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <audio src={audioUrl} controls className="w-full h-9 rounded-lg" />
                      </div>
                    )}
                  </div>
                </div>

                {/* FILE ATTACHMENTS (Image, Supporting Document) */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Photo upload */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400 block">Attach Photo</span>
                    <label className="border border-dashed border-white/10 bg-slate-900/30 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/20 transition h-20 overflow-hidden relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        disabled={isSubmitting} 
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        className="hidden" 
                      />
                      {imageFile ? (
                        <div className="flex items-center gap-1.5 text-xs text-blue-300 font-semibold px-2">
                          <ImageIcon className="w-4 h-4 text-blue-400" />
                          <span className="truncate max-w-[120px]">{imageFile.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-slate-500">
                          <Upload className="w-4 h-4 mb-1" />
                          <span className="text-[10px]">Photo Upload</span>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Document upload */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400 block">Supporting Docs</span>
                    <label className="border border-dashed border-white/10 bg-slate-900/30 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/20 transition h-20 overflow-hidden relative">
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.txt" 
                        disabled={isSubmitting} 
                        onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                        className="hidden" 
                      />
                      {docFile ? (
                        <div className="flex items-center gap-1.5 text-xs text-blue-300 font-semibold px-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span className="truncate max-w-[120px]">{docFile.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-slate-500">
                          <Upload className="w-4 h-4 mb-1" />
                          <span className="text-[10px]">PDF, Word, Text</span>
                        </div>
                      )}
                    </label>
                  </div>

                </div>

              </form>

              {/* Submit footer bar */}
              <div className="p-6 border-t border-white/5 bg-slate-950/80 sticky bottom-0 z-20">
                <button
                  onClick={handleSubmitSuggestion}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:-translate-y-[1px] disabled:opacity-50 disabled:-translate-y-0 transition"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading Media & AI Ingesting...
                    </>
                  ) : (
                    <>
                      Submit Suggestion to AI Engine
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-white/5 text-center text-xs text-muted-foreground mt-8 relative z-10 bg-slate-950/20">
        <p>© 2026 JanSwar AI Constituency Management Systems. Patna District Division.</p>
      </footer>

    </div>
  );
}
