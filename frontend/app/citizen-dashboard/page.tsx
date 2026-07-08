"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../services/authService";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, Plus, MapPin, Calendar, Clock, 
  AlertCircle, Mic, Square, Trash2, Upload, FileText, Image as ImageIcon,
  Loader2, Sparkles, Send, X, User, ListFilter, Activity, ChevronRight, Play, CheckCircle2, File
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageToggle } from "../../components/LanguageToggle";
import Link from "next/link";
import Image from "next/image";

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
  const { t, language } = useLanguage();
  const { user, token, logout, isLoading: isAuthLoading, checkAuth } = useAuthStore();

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
  const [districtInput, setDistrictInput] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");
  const [blockInput, setBlockInput] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [villageInput, setVillageInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [pincodeInput, setPincodeInput] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // Files and Previews
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
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

  // Auth verification & data fetching
  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else if (!user) {
      checkAuth();
    } else if (user.role === "CITIZEN") {
      fetchSuggestions();
      fetchMetadata();
    }
  }, [token, user, checkAuth, router]);

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
      const catRes = await api.get("/categories");
      setCategories(catRes.data.categories);

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

  // Handle Fetching Geolocation coordinates and reverse geocoding to prefill details
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        
        try {
          // Fetch reverse geocode details from OpenStreetMap Nominatim API
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, {
            headers: {
              "Accept-Language": language === "hi" ? "hi" : "en"
            }
          });
          if (response.ok) {
            const data = await response.json();
            const address = data.address;
            if (address) {
              const detectedDistrict = address.county || address.city || address.district || address.state_district || "";
              const detectedBlock = address.suburb || address.city_district || address.town || "";
              const detectedVillage = address.village || address.hamlet || address.neighbourhood || address.road || "";
              const detectedPincode = address.postcode || "";
              
              const cleanDistrict = detectedDistrict.replace(/\s*District/gi, "").trim();
              const cleanBlock = detectedBlock.trim();
              const cleanVillage = detectedVillage.trim();
              const cleanPincode = detectedPincode.trim();
              
              if (cleanPincode) setPincodeInput(cleanPincode);
              
              if (cleanDistrict) {
                setDistrictInput(cleanDistrict);
                const matchedDist = districts.find(d => d.name.toLowerCase() === cleanDistrict.toLowerCase());
                if (matchedDist) {
                  setSelectedDistrict(matchedDist.id);
                  
                  // Fetch blocks for this district immediately
                  const blocksRes = await api.get(`/locations/districts/${matchedDist.id}/blocks`);
                  const fetchedBlocks = blocksRes.data.blocks;
                  setBlocks(fetchedBlocks);
                  
                  if (cleanBlock) {
                    setBlockInput(cleanBlock);
                    const matchedBlk = fetchedBlocks.find((b: any) => b.name.toLowerCase() === cleanBlock.toLowerCase() || b.name.toLowerCase().includes(cleanBlock.toLowerCase()));
                    if (matchedBlk) {
                      setSelectedBlock(matchedBlk.id);
                      
                      // Fetch villages for this block immediately
                      const villagesRes = await api.get(`/locations/blocks/${matchedBlk.id}/villages`);
                      const fetchedVillages = villagesRes.data.villages;
                      setVillages(fetchedVillages);
                      
                      if (cleanVillage) {
                        setVillageInput(cleanVillage);
                        const matchedVil = fetchedVillages.find((v: any) => v.name.toLowerCase() === cleanVillage.toLowerCase() || v.name.toLowerCase().includes(cleanVillage.toLowerCase()));
                        if (matchedVil) {
                          setSelectedVillage(matchedVil.id);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        // Fallback to mock Patna Sadar coordinates geocode mapping
        setLat(25.5941);
        setLng(85.1376);
        setDistrictInput("Patna");
        setBlockInput("Patna Sadar");
        setVillageInput("Polson Village");
        setPincodeInput("800001");
        
        const matchedDist = districts.find(d => d.name.toLowerCase() === "patna");
        if (matchedDist) {
          setSelectedDistrict(matchedDist.id);
          api.get(`/locations/districts/${matchedDist.id}/blocks`).then(res => {
            setBlocks(res.data.blocks);
            const matchedBlk = res.data.blocks.find((b: any) => b.name.toLowerCase() === "patna sadar");
            if (matchedBlk) {
              setSelectedBlock(matchedBlk.id);
              api.get(`/locations/blocks/${matchedBlk.id}/villages`).then(res2 => {
                setVillages(res2.data.villages);
                const matchedVil = res2.data.villages.find((v: any) => v.name.toLowerCase() === "polson village");
                if (matchedVil) {
                  setSelectedVillage(matchedVil.id);
                }
              });
            }
          });
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle Image upload and preview URL creation
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    if (file) {
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setImagePreviewUrl(null);
    }
  };

  // Handle writeable district input change
  const handleDistrictInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDistrictInput(value);
    const matched = districts.find(d => d.name.toLowerCase() === value.toLowerCase());
    if (matched) {
      setSelectedDistrict(matched.id);
    } else {
      setSelectedDistrict("");
      setSelectedBlock("");
      setBlockInput("");
      setSelectedVillage("");
      setVillageInput("");
    }
  };

  // Handle writeable block input change
  const handleBlockInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBlockInput(value);
    const matched = blocks.find(b => b.name.toLowerCase() === value.toLowerCase());
    if (matched) {
      setSelectedBlock(matched.id);
    } else {
      setSelectedBlock("");
      setSelectedVillage("");
      setVillageInput("");
    }
  };

  // Handle writeable village input change
  const handleVillageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVillageInput(value);
    const matched = villages.find(v => v.name.toLowerCase() === value.toLowerCase());
    if (matched) {
      setSelectedVillage(matched.id);
    } else {
      setSelectedVillage("");
    }
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
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
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
    
    let finalDescription = description;
    const customLocs = [];
    if (!selectedDistrict && districtInput) customLocs.push(`District: ${districtInput}`);
    if (!selectedBlock && blockInput) customLocs.push(`Block: ${blockInput}`);
    if (!selectedVillage && villageInput) customLocs.push(`Village: ${villageInput}`);
    if (pincodeInput) customLocs.push(`Pincode: ${pincodeInput}`);
    
    if (customLocs.length > 0) {
      finalDescription = `${description}\n\n[Custom Location Details]\n${customLocs.join("\n")}`;
    }
    formData.append("description", finalDescription);
    
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
      setDistrictInput("");
      setSelectedBlock("");
      setBlockInput("");
      setSelectedVillage("");
      setVillageInput("");
      setPincodeInput("");
      setLat(null);
      setLng(null);
      setImageFile(null);
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
      }
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
        return <span className="px-3 py-1 rounded-full text-xs font-semibold border border-amber-500/20 bg-amber-500/10 text-amber-500 dark:text-amber-300">Pending Ingestion</span>;
      case "PROCESSING":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold border border-blue-500/20 bg-blue-500/10 text-blue-500 dark:text-blue-300 flex items-center gap-1.5 w-max"><Loader2 className="w-3 h-3 animate-spin text-blue-500" /> AI Processing</span>;
      case "ANALYZED":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 dark:text-emerald-300">AI Analyzed</span>;
      case "APPROVED":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold border border-teal-500/20 bg-teal-500/10 text-teal-500 dark:text-teal-300">Approved</span>;
      case "REJECTED":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold border border-rose-500/20 bg-rose-500/10 text-rose-500 dark:text-rose-300">Archived</span>;
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between overflow-x-hidden relative pt-24">
      {/* Ambient background glows */}
      <div className="absolute top-[10%] right-[5%] w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[35vw] h-[35vw] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Sticky Premium Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-12 h-12 rounded-xl border border-primary/20 bg-white/5 p-1 shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center">
                <Image
                  src="/JS_logo.png"
                  alt="JanSwar Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <span className="font-black text-xl tracking-tight text-foreground flex items-center gap-1">
                  JanSwar{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                    AI
                  </span>
                </span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                  {language === "hi" ? "नागरिक पोर्टल" : "Citizen Portal"}
                </p>
              </div>
            </Link>
          </div>

          {/* Center Navigation Info */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-500" />
            <span>
              {language === "hi" ? "सांसद डायरेक्ट कनेक्ट" : "Direct Connect with Your MP"}
            </span>
          </div>

          {/* Right Action Widgets */}
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <ThemeToggle />
            
            <div className="hidden sm:flex items-center gap-2.5 bg-card/60 border border-border/60 rounded-full px-3 py-1.5 text-xs text-foreground font-bold shadow-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
                {user?.fullName.charAt(0) || "C"}
              </div>
              <span className="max-w-[100px] truncate">{user?.fullName}</span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-card border border-border hover:border-rose-500/30 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition shadow-sm"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="w-full max-w-7xl mx-auto px-6 py-10 flex-1 relative z-10">
        
        {/* Top Header Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground leading-tight">
              {language === "hi" ? "आपका विकास मंच" : "Your Development Voice"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 font-medium max-w-2xl">
              {language === "hi"
                ? "सड़क, पानी, स्वास्थ्य या बिजली से जुड़े मुद्दों को दर्ज करें और वास्तविक समय में एआई विश्लेषण और प्रशासन की प्रतिक्रिया को ट्रैक करें।"
                : "Submit local infrastructure issues like roads, water, or health and track real-time AI prioritizations and MP updates."}
            </p>
          </div>

          <button 
            onClick={() => setIsSubmitOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-sm py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] self-stretch md:self-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            <span>{language === "hi" ? "नया सुझाव / शिकायत" : "New Suggestion"}</span>
          </button>
        </div>

        {/* Status Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-card/50 border border-border/60 rounded-3xl p-5 shadow-md flex flex-col gap-2 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              {language === "hi" ? "कुल सबमिशन" : "Submitted"}
            </span>
            <span className="text-3xl font-black text-foreground">{suggestions.length}</span>
          </div>

          <div className="bg-card/50 border border-border/60 rounded-3xl p-5 shadow-md flex flex-col gap-2 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              {language === "hi" ? "प्रसंस्करण में" : "Processing"}
            </span>
            <span className="text-3xl font-black text-blue-500">
              {suggestions.filter(s => s.status === "PROCESSING").length}
            </span>
          </div>

          <div className="bg-card/50 border border-border/60 rounded-3xl p-5 shadow-md flex flex-col gap-2 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              {language === "hi" ? "एआई विश्लेषित" : "AI Analyzed"}
            </span>
            <span className="text-3xl font-black text-emerald-500">
              {suggestions.filter(s => s.status === "ANALYZED" || s.status === "APPROVED").length}
            </span>
          </div>

          <div className="bg-card/50 border border-border/60 rounded-3xl p-5 shadow-md flex flex-col gap-2 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              {language === "hi" ? "प्राथमिकता प्राप्त" : "Priority Scored"}
            </span>
            <span className="text-3xl font-black text-indigo-500">
              {suggestions.filter(s => s.priorityScore).length}
            </span>
          </div>

        </div>

        {/* Suggestions List Container */}
        <div className="bg-card/50 border border-border/60 rounded-[2.5rem] p-6 md:p-8 shadow-xl min-h-[350px] relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
            <h3 className="font-black text-lg text-foreground">
              {language === "hi" ? "शिकायत ट्रैकिंग इतिहास" : "Grievance Tracking History"}
            </h3>
            <ListFilter className="w-4 h-4 text-muted-foreground" />
          </div>

          {isLoadingList ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : listError ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-pulse" />
              <p className="font-bold text-foreground">{listError}</p>
              <button 
                onClick={fetchSuggestions} 
                className="mt-4 px-6 py-2.5 bg-card border border-border rounded-xl text-xs font-bold hover:bg-accent transition"
              >
                {language === "hi" ? "पुनः प्रयास करें" : "Try Again"}
              </button>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center">
              <Activity className="w-12 h-12 text-muted-foreground/60 mb-4" />
              <h4 className="font-black text-foreground">
                {language === "hi" ? "अभी तक कोई शिकायत दर्ज नहीं की गई है" : "No suggestions submitted yet"}
              </h4>
              <p className="text-muted-foreground text-xs font-semibold max-w-sm mt-2 leading-relaxed">
                {language === "hi" 
                  ? "अपनी पहली शिकायत आवाज या विवरण लिखकर दर्ज करें। विकास कार्यों में भाग लें।"
                  : "Submit your first suggestion using voice recording or text. Help make planning transparent."}
              </p>
              <button 
                onClick={() => setIsSubmitOpen(true)}
                className="mt-6 px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-extrabold transition"
              >
                {language === "hi" ? "शिकायत विज़ार्ड प्रारंभ करें" : "Launch Submission Wizard"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((item) => (
                <div 
                  key={item.id} 
                  className="border border-border/60 bg-background/30 rounded-2xl p-5 hover:border-primary/20 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center flex-wrap gap-2.5">
                      <h4 className="font-extrabold text-base text-foreground">{item.title}</h4>
                      {item.category && (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary border border-primary/25">
                          {item.category.name}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground font-semibold line-clamp-2 leading-relaxed">
                      {item.description || item.transcription || "No details provided"}
                    </p>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Patna District, {item.block?.name || "Sadar"}, {item.village?.name || "Village"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Priority Weight details */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-3 justify-between w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-border/40">
                    {getStatusBadge(item.status)}
                    
                    {item.priorityScore && (
                      <div className="flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-300 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/25">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
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
              className="fixed inset-0 bg-black/60 z-40 cursor-pointer backdrop-blur-sm"
            />

            {/* Sidebar drawer */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-card border-l border-border shadow-2xl z-50 overflow-y-auto flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-card/90 sticky top-0 z-20 backdrop-blur-md">
                <div>
                  <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {language === "hi" ? "शिकायत / सुझाव जमा करें" : "Submit Suggestion"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 font-semibold">
                    {language === "hi" ? "वाणी या पाठ इनपुट विश्लेषण (एआई पावर्ड)" : "AI-Powered speech/text input parsing"}
                  </p>
                </div>
                <button 
                  onClick={() => setIsSubmitOpen(false)}
                  disabled={isSubmitting}
                  className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitSuggestion} className="p-6 space-y-6 flex-1 bg-card">
                
                {submitError && (
                  <div className="p-4 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-500 text-xs font-semibold flex gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>{submitError}</div>
                  </div>
                )}

                {/* Suggestion Title */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    {language === "hi" ? "सुझाव / शिकायत का शीर्षक *" : "Suggestion / Issue Title *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={language === "hi" ? "उदा. मुख्य सड़क पर गड्ढों की मरम्मत" : "e.g. Repair damaged bridge at Village entry"}
                    disabled={isSubmitting}
                    className="w-full bg-background/50 border border-border rounded-2xl py-3.5 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  />
                </div>

                {/* Text Description */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    {language === "hi" ? "विस्तृत विवरण" : "Detailed Description"}
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={language === "hi" ? "शिकायत का विस्तृत विवरण लिखें (आवाज इनपुट देने पर वैकल्पिक)" : "Provide details about the infrastructure gap. (Optional if submitting Voice recording)"}
                    disabled={isSubmitting}
                    className="w-full bg-background/50 border border-border rounded-2xl py-3.5 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
                  />
                </div>

                {/* Hidden Category and District Text Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    {language === "hi" ? "जिला *" : "District *"}
                  </label>
                  <input
                    type="text"
                    list="districts-list"
                    value={districtInput}
                    onChange={handleDistrictInputChange}
                    placeholder={language === "hi" ? "अपना जिला यहाँ लिखें (उदा. Patna)" : "Type your district (e.g. Patna)"}
                    disabled={isSubmitting}
                    className="w-full bg-background/50 border border-border rounded-2xl py-3.5 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  />
                  <datalist id="districts-list">
                    {districts.map(d => (
                      <option key={d.id} value={d.name} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Block Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      {language === "hi" ? "ब्लॉक" : "Block"}
                    </label>
                    <input
                      type="text"
                      list="blocks-list"
                      value={blockInput}
                      onChange={handleBlockInputChange}
                      placeholder={language === "hi" ? "अपना ब्लॉक लिखें" : "Type block"}
                      disabled={isSubmitting}
                      className="w-full bg-background/50 border border-border rounded-2xl py-3.5 px-4 text-xs text-foreground focus:outline-none disabled:opacity-50 transition"
                    />
                    <datalist id="blocks-list">
                      {blocks.map(b => (
                        <option key={b.id} value={b.name} />
                      ))}
                    </datalist>
                  </div>

                  {/* Village Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      {language === "hi" ? "गाँव" : "Village"}
                    </label>
                    <input
                      type="text"
                      list="villages-list"
                      value={villageInput}
                      onChange={handleVillageInputChange}
                      placeholder={language === "hi" ? "अपना गाँव लिखें" : "Type village"}
                      disabled={isSubmitting}
                      className="w-full bg-background/50 border border-border rounded-2xl py-3.5 px-4 text-xs text-foreground focus:outline-none disabled:opacity-50 transition"
                    />
                    <datalist id="villages-list">
                      {villages.map(v => (
                        <option key={v.id} value={v.name} />
                      ))}
                    </datalist>
                  </div>

                </div>

                {/* Pincode Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    {language === "hi" ? "पिनकोड" : "Pincode"}
                  </label>
                  <input
                    type="text"
                    value={pincodeInput}
                    onChange={(e) => setPincodeInput(e.target.value)}
                    placeholder={language === "hi" ? "अपना पिनकोड लिखें (उदा. 800001)" : "Type pincode (e.g. 800001)"}
                    disabled={isSubmitting}
                    className="w-full bg-background/50 border border-border rounded-2xl py-3.5 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  />
                </div>

                {/* GEOLOCATION DETECTOR */}
                <div className="p-4 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-xs">{language === "hi" ? "जीपीएस स्थान समन्वय *" : "GPS Location Coordinates *"}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1.5 font-semibold">
                      {language === "hi" ? "स्थान मानचित्रण के लिए आवश्यक" : "Required for district map integration"}
                    </p>
                    {lat && lng && (
                      <p className="text-[11px] font-mono text-emerald-500 font-bold mt-1.5">Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating || isSubmitting}
                    className="flex items-center gap-1.5 py-2 px-3.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-500/20 rounded-xl text-xs font-bold transition disabled:opacity-50 self-start sm:self-auto shadow-sm"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{language === "hi" ? "खोज रहा है..." : "Locating..."}</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{language === "hi" ? "जीपीएस से प्राप्त करें" : "Detect Coordinates"}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AUDIO RECORDER CONTAINER */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    {language === "hi" ? "आवाज रिकॉर्डिंग (बहुभाषी एआई विश्लेषण)" : "Voice Suggestion (Multilingual Speech to Text)"}
                  </label>
                  <div className="border border-border rounded-2xl p-4 bg-background/40 flex flex-col items-center justify-center gap-4">
                    {!audioUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        {isRecording ? (
                          <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                              {language === "hi" ? "आवाज रिकॉर्ड हो रही है..." : "Recording Voice..."}
                            </div>
                            <span className="text-2xl font-mono text-foreground tracking-widest font-black">{formatDuration(recordDuration)}</span>
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
                            <p className="text-[10px] text-muted-foreground font-semibold text-center leading-relaxed">
                              {language === "hi" 
                                ? "हिंदी, अंग्रेजी, भोजपुरी या मैथिली बोली में रिकॉर्ड करें" 
                                : "Record suggestion in Hindi, English, Bhojpuri, or Maithili"}
                            </p>
                            <button
                              type="button"
                              onClick={startRecording}
                              disabled={isSubmitting}
                              className="flex items-center gap-2 py-3 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50"
                            >
                              <Mic className="w-4 h-4" />
                              <span>{language === "hi" ? "आवाज रिकॉर्ड करना शुरू करें" : "Start Voice Recording"}</span>
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      /* Audible voice preview widget */
                      <div className="w-full space-y-3">
                        <div className="flex items-center justify-between text-xs bg-card border border-border rounded-xl p-3 shadow-sm">
                          <div className="flex items-center gap-2 font-bold text-foreground">
                            <Mic className="w-4 h-4 text-emerald-500" />
                            <span>{language === "hi" ? "आवाज रिकॉर्डिंग तैयार है (ऑडिबल)" : "Voice Recording Ready (Audible)"}</span>
                          </div>
                          <button
                            type="button"
                            onClick={deleteRecording}
                            disabled={isSubmitting}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 border border-transparent hover:border-rose-500/20 transition disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Audible HTML5 audio player */}
                        <div className="w-full bg-background border border-border p-2 rounded-xl shadow-inner">
                          <audio src={audioUrl} controls className="w-full h-10 opacity-90" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* FILE ATTACHMENTS (Image, Supporting Document) */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Photo upload with visual preview box */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-muted-foreground block">
                      {language === "hi" ? "फोटो संलग्न करें" : "Attach Photo"}
                    </span>
                    
                    {imagePreviewUrl ? (
                      /* Visual Image Preview Box with cancel button */
                      <div className="relative w-full h-24 rounded-2xl overflow-hidden border border-border bg-background shadow-md group">
                        <Image 
                          src={imagePreviewUrl} 
                          alt="Photo Preview" 
                          fill 
                          className="object-cover" 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                            setImagePreviewUrl(null);
                          }}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-black/90 text-white rounded-full transition shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="border border-dashed border-border bg-background/50 hover:bg-muted rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition h-24 overflow-hidden">
                        <input 
                          type="file" 
                          accept="image/*" 
                          disabled={isSubmitting} 
                          onChange={handleImageChange}
                          className="hidden" 
                        />
                        <div className="flex flex-col items-center text-muted-foreground">
                          <Upload className="w-4 h-4 mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {language === "hi" ? "फोटो डालें" : "Photo Upload"}
                          </span>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Document upload */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-muted-foreground block">
                      {language === "hi" ? "दस्तावेज" : "Supporting Docs"}
                    </span>
                    <label className="border border-dashed border-border bg-background/50 hover:bg-muted rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition h-24 overflow-hidden relative">
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.txt" 
                        disabled={isSubmitting} 
                        onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                        className="hidden" 
                      />
                      {docFile ? (
                        <div className="flex flex-col items-center justify-center gap-1.5 text-[10px] text-primary font-bold px-2 w-full text-center">
                          <FileText className="w-5 h-5 text-primary" />
                          <span className="truncate max-w-full block">{docFile.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground">
                          <Upload className="w-4 h-4 mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {language === "hi" ? "फ़ाइल अपलोड" : "PDF, Word, Text"}
                          </span>
                        </div>
                      )}
                    </label>
                  </div>

                </div>

              </form>

              {/* Submit footer bar */}
              <div className="p-6 border-t border-border bg-card/95 sticky bottom-0 z-20 backdrop-blur-md">
                <button
                  onClick={handleSubmitSuggestion}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/10 disabled:opacity-50 transition"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ingesting Media into AI Model...</span>
                    </>
                  ) : (
                    <>
                      <span>{language === "hi" ? "शिकायत एआई इंजन में जमा करें" : "Submit Suggestion to AI"}</span>
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
      <footer className="w-full py-6 border-t border-border/40 text-center text-xs text-muted-foreground mt-8 relative z-10 bg-card/25 backdrop-blur-sm font-semibold">
        <p>© 2026 JanSwar AI Constituency Management Systems. Patna District Division.</p>
      </footer>

    </div>
  );
}
