"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield,
  Sparkles,
  LayoutDashboard,
  ChevronRight,
  Brain,
  Users,
  Zap,
  Globe,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Database,
  Mail,
  Mic,
  Volume2,
  Search,
  MapPin,
  HelpCircle,
  Activity,
  ArrowUpRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageToggle } from "../components/LanguageToggle";
import { useLanguage } from "../context/LanguageContext";
import dynamic from "next/dynamic";

const ParticleBackground = dynamic(
  () =>
    import("../components/ParticleBackground").then(
      (mod) => mod.ParticleBackground,
    ),
  { ssr: false },
);

export default function LandingPage() {
  const router = useRouter();
  const { user, token, checkAuth } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const { t, language } = useLanguage();

  // Sandbox state & presets
  const [sandboxCategory, setSandboxCategory] = useState("road");
  const [sandboxText, setSandboxText] = useState("");
  const [sandboxIsRecording, setSandboxIsRecording] = useState(false);
  const [sandboxIsAnalyzing, setSandboxIsAnalyzing] = useState(false);
  const [sandboxStep, setSandboxStep] = useState(0); // 0: idle, 1: transcribing, 2: scoring, 3: completed
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const sandboxPresets: Record<
    string,
    {
      enText: string;
      hiText: string;
      block: string;
      score: number;
      severity: "Critical" | "High" | "Medium";
      hiSeverity: string;
      recommendation: string;
      hiRecommendation: string;
    }
  > = {
    water: {
      enText:
        "The main water pipeline near Mauranwan market is leaking, wasting water and reducing pressure for 500+ households.",
      hiText:
        "मौरावां बाजार के पास मुख्य पानी की पाइपलाइन लीक हो रही है, जिससे पानी बर्बाद हो रहा है और 500+ घरों में पानी का दबाव कम हो रहा है।",
      block: "Mauranwan",
      score: 84,
      severity: "High",
      hiSeverity: "उच्च (High)",
      recommendation:
        "Deploy emergency technical crew to replace 15m segment of corroded pipe.",
      hiRecommendation:
        "जंग लगी पाइप के 15 मीटर हिस्से को बदलने के लिए आपातकालीन तकनीकी टीम तैनात करें।",
    },
    road: {
      enText:
        "Deep potholes on the main highway road connecting Purwa to city, causing vehicle accidents during rains.",
      hiText:
        "पुरवा को शहर से जोड़ने वाली मुख्य राजमार्ग सड़क पर गहरे गड्ढे हैं, जिससे बारिश में वाहन दुर्घटनाएं हो रही हैं।",
      block: "Purwa",
      score: 92,
      severity: "Critical",
      hiSeverity: "गंभीर (Critical)",
      recommendation:
        "Fast-track pothole repair funds; schedule road resurfacing before monsoon.",
      hiRecommendation:
        "गड्ढों की मरम्मत के लिए फंड तेजी से स्वीकृत करें; मानसून से पहले सड़क की मरम्मत तय करें।",
    },
    electricity: {
      enText:
        "Transformers in Pipri village blow out repeatedly, leaving 200 farmers without tubewell power for irrigation.",
      hiText:
        "पिपरी गांव में ट्रांसफार्मर बार-बार खराब हो जाते हैं, जिससे सिंचाई के लिए 200 किसानों को ट्यूबवेल बिजली नहीं मिल पाती है।",
      block: "Pipri",
      score: 71,
      severity: "Medium",
      hiSeverity: "मध्यम (Medium)",
      recommendation:
        "Upgrade local transformer capacity from 100kVA to 250kVA.",
      hiRecommendation:
        "स्थानीय ट्रांसफार्मर की क्षमता 100kVA से बढ़ाकर 250kVA करें।",
    },
    sanitation: {
      enText:
        "Solid waste accumulates near the public girls' high school, creating foul smell and health hazards.",
      hiText:
        "सरकारी बालिका उच्च विद्यालय के पास ठोस कचरा जमा हो रहा है, जिससे दुर्गंध आ रही है और बीमारी का खतरा बना है।",
      block: "Sumerpur",
      score: 78,
      severity: "High",
      hiSeverity: "उच्च (High)",
      recommendation:
        "Establish permanent dump bins and integrate into municipal truck route.",
      hiRecommendation:
        "स्थायी कचरा डस्टबिन स्थापित करें और इसे नगरपालिका ट्रक रूट में शामिल करें।",
    },
  };

  useEffect(() => {
    setIsMounted(true);
    if (token && !user) {
      checkAuth();
    }
  }, [token, user, checkAuth]);

  useEffect(() => {
    if (isMounted) {
      const preset = sandboxPresets[sandboxCategory];
      if (preset) {
        setSandboxText(language === "hi" ? preset.hiText : preset.enText);
      }
    }
  }, [sandboxCategory, language, isMounted]);

  const handleSandboxSubmit = () => {
    setSandboxIsAnalyzing(true);
    setSandboxStep(1);

    // Step 1: Transcribing (1.2s)
    setTimeout(() => {
      setSandboxStep(2);

      // Step 2: Scoring (1.2s)
      setTimeout(() => {
        setSandboxStep(3);
        setSandboxIsAnalyzing(false);
      }, 1200);
    }, 1200);
  };

  const handleSandboxReset = () => {
    setSandboxStep(0);
    setSandboxIsAnalyzing(false);
    const preset = sandboxPresets[sandboxCategory];
    if (preset) {
      setSandboxText(language === "hi" ? preset.hiText : preset.enText);
    }
  };

  const handleSandboxRecord = () => {
    setSandboxIsRecording(true);
    setSandboxStep(0);
    setSandboxText("");
    // Simulate recording for 2.5s
    setTimeout(() => {
      setSandboxIsRecording(false);
      const preset = sandboxPresets[sandboxCategory];
      if (preset) {
        setSandboxText(language === "hi" ? preset.hiText : preset.enText);
      }
    }, 2500);
  };

  const handleDashboardRedirect = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role === "CITIZEN") {
      router.push("/citizen-dashboard");
    } else if (user.role === "DISTRICT_ADMIN" || user.role === "SUPER_ADMIN") {
      router.push("/admin-dashboard");
    } else {
      router.push("/mp-dashboard");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 overflow-x-hidden relative">
      {/* 3D Particle Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60 dark:opacity-80">
        <ParticleBackground />
      </div>

      {/* Ambient background glow points */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] w-[35vw] h-[35vw] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Fixed Premium Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-primary/30 shadow-lg shadow-primary/10 transition-transform group-hover:scale-105 bg-white/5">
                <Image
                  src="/JS_logo.png"
                  alt="JanSwar Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-foreground flex items-center gap-1">
                JanSwar{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
                  AI
                </span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#workflow"
              className="hover:text-foreground transition-colors"
            >
              How It Works
            </a>
            <a
              href="#metrics"
              className="hover:text-foreground transition-colors"
            >
              Stats
            </a>
            <a
              href="#community"
              className="hover:text-foreground transition-colors"
            >
              Community
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <LanguageToggle />
            <ThemeToggle />
            {user ? (
              <button
                onClick={handleDashboardRedirect}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-bold hover:opacity-90 transition-all shadow-md hover:scale-105 active:scale-95"
              >
                Dashboard
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:block text-sm font-bold text-muted-foreground hover:text-foreground transition"
                >
                  {t("nav.login")}
                </Link>
                <button
                  onClick={handleDashboardRedirect}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:scale-105 active:scale-95"
                >
                  {t("landing.getStarted")}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 pt-32 pb-16 flex flex-col items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full mb-12">
          {/* Left Hero Text Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-8 flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.08] mb-8">
              {t("landing.heroTitleCitizen")}
              <br />
              <span className="bg-gradient-to-r from-orange-500 via-red-500 to-indigo-600 bg-clip-text text-transparent dark:from-orange-400 dark:via-red-400 dark:to-indigo-400">
                {language === "hi"
                  ? "आपकी आवाज़, क्षेत्र का विकास"
                  : "Your Voice, Our Priority"}
              </span>
            </h1>

            <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl mb-6 leading-relaxed font-medium">
              {t("landing.heroDescCitizen")}
            </p>
          </motion.div>

          {/* Right Floating Logo Column */}
          <div className="lg:col-span-4 hidden lg:flex justify-center items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <motion.div
                animate={{
                  y: [0, -18, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative w-56 h-56 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-indigo-500/5 to-white/5 border border-primary/20 shadow-2xl p-6 flex items-center justify-center backdrop-blur-md hover:scale-105 transition-transform"
              >
                <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] blur-2xl animate-pulse" />
                <div className="relative w-full h-full overflow-hidden rounded-[2rem] border-2 border-primary/30 shadow-inner bg-card">
                  <Image
                    src="/JS_logo.png"
                    alt="JanSwar Logo"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-5xl">
            {/* Action 1: Submit */}
            <div
              onClick={handleDashboardRedirect}
              className="group cursor-pointer glass-panel rounded-[2rem] p-6 text-left border border-border/40 hover:border-primary/40 bg-card/45 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center mb-6 shadow-md shadow-orange-500/10 group-hover:scale-110 transition-transform">
                  <Mic className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-foreground mb-2 group-hover:text-primary transition-colors flex items-center gap-1.5">
                  {t("landing.fileComplaint")}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed font-medium">
                  {language === "hi"
                    ? "हिंदी, अंग्रेजी या स्थानीय बोली में आवाज या पाठ द्वारा शिकायत/सुझाव दर्ज करें।"
                    : "Submit issues in English, Hindi, or regional dialects via voice or text."}
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-primary gap-1">
                <span>{language === "hi" ? "शुरू करें" : "Get Started"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Action 2: Track */}
            <div
              onClick={handleDashboardRedirect}
              className="group cursor-pointer glass-panel rounded-[2rem] p-6 text-left border border-border/40 hover:border-primary/40 bg-card/45 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center mb-6 shadow-md shadow-blue-600/10 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-foreground mb-2 group-hover:text-primary transition-colors flex items-center gap-1.5">
                  {t("landing.trackStatus")}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed font-medium">
                  {language === "hi"
                    ? "अपने दर्ज किए गए मुद्दों की वर्तमान स्थिति, एआई स्कोर और सांसद की कार्रवाई देखें।"
                    : "Check live progress, AI priority index, and administrative response for your reports."}
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-primary gap-1">
                <span>{language === "hi" ? "ट्रैक करें" : "Track Here"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Action 3: Stats */}
            <a
              href="#metrics"
              className="group cursor-pointer glass-panel rounded-[2rem] p-6 text-left border border-border/40 hover:border-primary/40 bg-card/45 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center mb-6 shadow-md shadow-emerald-500/10 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-foreground mb-2 group-hover:text-primary transition-colors flex items-center gap-1.5">
                  {language === "hi"
                    ? "निर्वाचन क्षेत्र की प्रगति"
                    : "District Progress"}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed font-medium">
                  {language === "hi"
                    ? "विकास कार्यों, सुलझाए गए मुद्दों और सक्रिय बुनियादी ढांचा परियोजनाओं के लाइव आंकड़े देखें।"
                    : "View public resolution rates, completed works, and active developmental statistics."}
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-primary gap-1">
                <span>
                  {language === "hi" ? "आँकड़े देखें" : "View Analytics"}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </a>
          </div>
      </section>

      {/* Interactive grievance sandbox */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="glass-panel rounded-[3rem] p-8 md:p-12 border border-border/40 bg-card/35 backdrop-blur-md relative overflow-hidden shadow-2xl shadow-indigo-500/5">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold mb-4">
              <Brain className="w-3.5 h-3.5" />
              <span>
                {language === "hi"
                  ? "एआई शिकायत विश्लेषक डेमो"
                  : "AI Priority Scoring Sandbox"}
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground mb-3">
              {language === "hi"
                ? "स्वयं प्रयास करें: देखें जनस्वर एआई कैसे काम करता है"
                : "Try It Yourself: See How JanSwar AI Works"}
            </h2>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto font-medium">
              {language === "hi"
                ? "एक श्रेणी चुनें, वॉयस रिकॉर्डिंग या टेक्स्ट सबमिशन का परीक्षण करें, और वास्तविक समय में एआई प्रायोरिटी स्कोरिंग विश्लेषण देखें।"
                : "Select a category, simulate a voice or text submission, and watch the AI process and prioritize it in real-time."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left side - input simulation (7 cols) */}
            <div className="md:col-span-7 space-y-6">
              {/* Category tabs */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
                  {language === "hi"
                    ? "१. समस्या की श्रेणी चुनें"
                    : "1. Choose Issue Category"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    {
                      id: "road",
                      labelEn: "Roads",
                      labelHi: "सड़कें",
                      emoji: "🛣️",
                    },
                    {
                      id: "water",
                      labelEn: "Water supply",
                      labelHi: "पेयजल",
                      emoji: "🚰",
                    },
                    {
                      id: "electricity",
                      labelEn: "Electricity",
                      labelHi: "बिजली",
                      emoji: "⚡",
                    },
                    {
                      id: "sanitation",
                      labelEn: "Sanitation",
                      labelHi: "सफाई",
                      emoji: "🧹",
                    },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        if (!sandboxIsAnalyzing && !sandboxIsRecording) {
                          setSandboxCategory(cat.id);
                          setSandboxStep(0);
                        }
                      }}
                      className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                        sandboxCategory === cat.id
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                          : "bg-background/50 border-border/60 text-foreground hover:bg-muted"
                      } ${sandboxIsAnalyzing || sandboxIsRecording ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span>{cat.emoji}</span>
                      <span>
                        {language === "hi" ? cat.labelHi : cat.labelEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Simulation Box */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  {language === "hi"
                    ? "२. शिकायत सबमिट करें (आवाज या टेक्स्ट)"
                    : "2. Submit Grievance (Voice or Text)"}
                </label>
                <div className="bg-background/80 border border-border/80 rounded-[2rem] p-6 relative min-h-[180px] flex flex-col justify-between shadow-inner">
                  {sandboxIsRecording ? (
                    /* Animated CSS Soundwave */
                    <div className="flex flex-col items-center justify-center flex-1 space-y-4">
                      <div className="flex items-center gap-1.5 h-16">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 bg-gradient-to-t from-orange-500 to-red-500 rounded-full animate-bounce"
                            style={{
                              height: `${10 + Math.random() * 45}px`,
                              animationDelay: `${i * 0.1}s`,
                              animationDuration: "0.6s",
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-red-500 animate-pulse flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                        {language === "hi"
                          ? "वॉयस रिकॉर्ड हो रहा है..."
                          : "Recording voice (Hindi/Regional)..."}
                      </span>
                    </div>
                  ) : (
                    /* Text display */
                    <div className="flex-1 flex flex-col">
                      <textarea
                        value={sandboxText}
                        onChange={(e) => {
                          if (!sandboxIsAnalyzing)
                            setSandboxText(e.target.value);
                        }}
                        disabled={sandboxIsAnalyzing}
                        placeholder={
                          language === "hi"
                            ? "शिकायत का विवरण लिखें..."
                            : "Describe the issue..."
                        }
                        className="w-full bg-transparent border-none text-foreground placeholder-muted-foreground text-sm font-semibold leading-relaxed focus:outline-none resize-none flex-1 min-h-[100px]"
                      />
                    </div>
                  )}

                  {/* Submit and Voice Controls */}
                  <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-4">
                    <button
                      onClick={handleSandboxRecord}
                      disabled={sandboxIsAnalyzing || sandboxIsRecording}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-all ${
                        sandboxIsAnalyzing || sandboxIsRecording
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                      <span>
                        {language === "hi"
                          ? "आवाज़ रिकॉर्ड करें"
                          : "Record Audio"}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      {sandboxStep > 0 && (
                        <button
                          onClick={handleSandboxReset}
                          className="px-4 py-2.5 rounded-full bg-muted border border-border/60 text-xs font-bold hover:bg-card transition"
                        >
                          {language === "hi" ? "रीसेट" : "Reset"}
                        </button>
                      )}
                      <button
                        onClick={handleSandboxSubmit}
                        disabled={
                          sandboxIsAnalyzing ||
                          sandboxIsRecording ||
                          !sandboxText.trim()
                        }
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white text-xs font-bold hover:opacity-90 shadow-md shadow-primary/20 transition-all ${
                          sandboxIsAnalyzing ||
                          sandboxIsRecording ||
                          !sandboxText.trim()
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-[1.02]"
                        }`}
                      >
                        <span>
                          {language === "hi"
                            ? "शिकायत विश्लेषित करें"
                            : "Analyze Issue"}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - AI feedback simulation (5 cols) */}
            <div className="md:col-span-5 h-full">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
                {language === "hi"
                  ? "३. एआई वास्तविक समय परिणाम"
                  : "3. Real-Time AI Output"}
              </label>

              <div className="bg-gradient-to-b from-card/80 to-card border border-border/80 rounded-[2rem] p-6 min-h-[360px] flex flex-col justify-between relative shadow-lg">
                {sandboxStep === 0 && (
                  /* Idle State */
                  <div className="flex flex-col items-center justify-center flex-1 text-center py-10">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mb-4 animate-bounce">
                      <Brain className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-black mb-1">
                      {language === "hi"
                        ? "विश्लेषण के लिए तैयार"
                        : "Ready for Analysis"}
                    </h4>
                    <p className="text-muted-foreground text-xs font-semibold max-w-[200px] leading-relaxed">
                      {language === "hi"
                        ? "शिकायत दर्ज करें और एआई स्वचालित रिपोर्ट देखने के लिए 'विश्लेषित करें' पर क्लिक करें।"
                        : "Submit your complaint and click 'Analyze Issue' to see the pipeline report."}
                    </p>
                  </div>
                )}

                {sandboxStep === 1 && (
                  /* Transcribing State */
                  <div className="flex flex-col items-center justify-center flex-1 py-10 space-y-4">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                      <Cpu className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-sm font-black mb-1">
                        {language === "hi"
                          ? "ऑडियो का अनुवाद और वर्गीकरण..."
                          : "Transcribing & Translating..."}
                      </h4>
                      <p className="text-muted-foreground text-xs font-semibold leading-relaxed">
                        {language === "hi"
                          ? "क्षेत्रीय बोली से अनुवाद तथा पाठ का वर्गीकरण किया जा रहा है..."
                          : "Gemini is transcribing dialect audio and mapping request text..."}
                      </p>
                    </div>
                  </div>
                )}

                {sandboxStep === 2 && (
                  /* Scoring State */
                  <div className="flex flex-col items-center justify-center flex-1 py-10 space-y-4">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                      <Database className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-sm font-black mb-1">
                        {language === "hi"
                          ? "प्राथमिकता स्कोर का परिकलन..."
                          : "Calculating Priority Score..."}
                      </h4>
                      <p className="text-muted-foreground text-xs font-semibold leading-relaxed">
                        {language === "hi"
                          ? "सरकारी आंकड़ों और जनसंख्या के साथ समस्या की गंभीरता को जोड़ा जा रहा है..."
                          : "Correlating severity metrics with block demographics & infrastructure index..."}
                      </p>
                    </div>
                  </div>
                )}

                {sandboxStep === 3 && (
                  /* Complete Results State */
                  <div className="space-y-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Priority Score Header */}
                      <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                        <div>
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                            {language === "hi"
                              ? "एआई प्राथमिकता सूचकांक"
                              : "AI PRIORITY SCORE"}
                          </span>
                          <span className="text-2xl font-black text-foreground">
                            {sandboxPresets[sandboxCategory]?.score}
                            <span className="text-xs text-muted-foreground font-bold">
                              {" "}
                              / 100
                            </span>
                          </span>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            sandboxPresets[sandboxCategory]?.severity ===
                            "Critical"
                              ? "bg-red-500/10 text-red-500 border border-red-500/20"
                              : sandboxPresets[sandboxCategory]?.severity ===
                                  "High"
                                ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          }`}
                        >
                          {language === "hi"
                            ? sandboxPresets[sandboxCategory]?.hiSeverity
                            : sandboxPresets[sandboxCategory]?.severity}
                        </div>
                      </div>

                      {/* Extracted Entities */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-background/40 p-3 rounded-2xl border border-border/60">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                            {language === "hi"
                              ? "संबंधित ब्लॉक (वार्ड)"
                              : "MAPPED BLOCK"}
                          </span>
                          <span className="text-xs font-black text-foreground flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                            {sandboxPresets[sandboxCategory]?.block}
                          </span>
                        </div>
                        <div className="bg-background/40 p-3 rounded-2xl border border-border/60">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                            {language === "hi"
                              ? "प्रायोरिटी दर्जा"
                              : "STATUS ROUTING"}
                          </span>
                          <span className="text-xs font-black text-foreground flex items-center gap-1">
                            <Activity className="w-3.5 h-3.5 text-emerald-500" />
                            {language === "hi"
                              ? "सक्रिय (Active)"
                              : "Immediate Review"}
                          </span>
                        </div>
                      </div>

                      {/* AI Generated Recommendation */}
                      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4">
                        <span className="text-[9px] font-bold text-indigo-500 uppercase block mb-1.5 flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          {language === "hi"
                            ? "सांसद (MP) के लिए एआई संस्तुति"
                            : "AI MP Recommendation"}
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed font-semibold italic">
                          "
                          {language === "hi"
                            ? sandboxPresets[sandboxCategory]?.hiRecommendation
                            : sandboxPresets[sandboxCategory]?.recommendation}
                          "
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs flex-shrink-0">
                        ✓
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground leading-snug">
                        {language === "hi"
                          ? "इस शिकायत को दर्ज करने के लिए लॉगिन/रजिस्टर करें। सांसद डैशबोर्ड पर यह प्राथमिकता सूची में जुड़ जाएगी।"
                          : "Login or sign up to file this grievance. It will be added to the MP command center automatically."}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section
        id="features"
        className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 py-24"
      >
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black text-foreground mb-4">
            Constituency Intelligence Engine
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg font-semibold">
            Four dynamic components powering the community planning ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 - Large 2 Columns */}
          <div className="md:col-span-2 glass-panel rounded-[2rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/15 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-foreground mb-3">
                Multilingual Voice Integration
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg font-medium">
                Citizens submit development requests through direct voice
                recordings in English, Hindi, and regional dialects. Gemini AI
                transcribes and structures incoming data in real-time, removing
                linguistic barriers to governance.
              </p>
            </div>
            <div className="mt-8 flex gap-2">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-500/10 text-blue-500">
                Audio Processing
              </span>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-500">
                Gemini 1.5 Pro
              </span>
            </div>
          </div>

          {/* Card 2 - 1 Column */}
          <div className="glass-panel rounded-[2rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-indigo-500/15 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-3">
                Priority Modeling
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                Our algorithm processes requests alongside village data
                (population, existing road/water gaps) to generate a Priority
                Score.
              </p>
            </div>
            <div className="mt-8 flex gap-2">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-500">
                Infrastructure Analytics
              </span>
            </div>
          </div>

          {/* Card 3 - 1 Column */}
          <div className="glass-panel rounded-[2rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-emerald-500/15 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-3">
                Interactive Heatmaps
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                Representations are aggregated onto district maps. Decision
                makers can spot high-density infrastructure gaps in a single
                glance.
              </p>
            </div>
            <div className="mt-8 flex gap-2">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-500">
                GIS Mapping
              </span>
            </div>
          </div>

          {/* Card 4 - Large 2 Columns */}
          <div className="md:col-span-2 glass-panel rounded-[2rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/15 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-foreground mb-3">
                Role-Based Dashboard System
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg font-medium">
                Separated portals ensure targeted tools. Citizens review and
                track their submitted requests, while Members of Parliament
                (MPs) monitor broader statistics, manage category filters, and
                directly approve local developments.
              </p>
            </div>
            <div className="mt-8 flex gap-2">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-500/10 text-purple-500">
                Representative Console
              </span>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-pink-500/10 text-pink-500">
                Citizen Portal
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section
        id="workflow"
        className="relative z-10 w-full py-24 bg-muted/20 border-y border-border/30"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black text-foreground mb-4">
              {language === "hi"
                ? "शिकायत से समाधान तक का सफर"
                : "Pipeline to Local Action"}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg font-semibold">
              {language === "hi"
                ? "आपकी आवाज कैसे एआई विश्लेषण से होते हुए प्रशासनिक निर्णय और विकास में बदलती है।"
                : "How voice suggestions convert to administrative priority and real decisions."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-[2.5rem] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-orange-500 via-blue-500 to-purple-500 opacity-20" />

            {/* Step 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/5">
                <Mic className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {language === "hi" ? "१. आवाज़ दर्ज करें" : "1. Voice Record"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed font-semibold">
                {language === "hi"
                  ? "नागरिक अपनी शिकायत या सुझाव अपनी भाषा में रिकॉर्ड करते हैं।"
                  : "Citizen records issue in regional dialect or types description."}
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/5">
                <Cpu className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {language === "hi" ? "२. एआई अनुवाद" : "2. AI Processing"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed font-semibold">
                {language === "hi"
                  ? "जनस्वर एआई रिकॉर्डिंग का विश्लेषण कर अनुवाद और वर्गीकरण करता है।"
                  : "Gemini transcribes audio, translates to English, and categorizes metadata."}
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/5">
                <Brain className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {language === "hi"
                  ? "३. प्राथमिकता स्कोर"
                  : "3. Priority Scoring"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed font-semibold">
                {language === "hi"
                  ? "क्षेत्रीय आंकड़ों के आधार पर समस्या को ०-१०० का गंभीरता अंक मिलता है।"
                  : "Algorithm maps demographic data and logs a priority score (0-100)."}
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/5">
                <CheckCircle2 className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {language === "hi" ? "४. सांसद स्तर समीक्षा" : "4. MP Action"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed font-semibold">
                {language === "hi"
                  ? "सांसद सीधे डैशबोर्ड पर समीक्षा कर बजट आवंटित व समस्या का निवारण करते हैं।"
                  : "MP reviews prioritized reports and allocates development funds."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics & Interactive Stats Section */}
      <section
        id="metrics"
        className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 py-24"
      >
        <div className="glass-panel rounded-[3rem] p-10 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6 leading-tight">
                {language === "hi"
                  ? "डेटा आधारित जिला विकास"
                  : "Data-Backed District Development"}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8 font-medium">
                {language === "hi"
                  ? "सीधे जमीनी स्तर से स्थानीय सामुदायिक प्रतिक्रिया एकत्र करके, जिला प्रशासन और सांसद विकास निधि को बिल्कुल वहीं आवंटित कर सकते हैं जहाँ विकास की कमी सबसे अधिक है।"
                  : "By gathering localized community feedback directly from the source, district administrators can allocate municipal and MP development funds exactly where the infrastructure gap is highest."}
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs">
                    ✓
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {language === "hi"
                      ? "निर्णय लेने का समय 70% तक कम"
                      : "Reduced decision cycle by 70%"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs">
                    ✓
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {language === "hi"
                      ? "सड़क, जल और बिजली परियोजनाओं के लिए लक्षित निधि"
                      : "Targeted funds for road, water, and power fixes"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs">
                    ✓
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {language === "hi"
                      ? "पारदर्शिता के लिए बिना लॉगिन रिपोर्ट देखने की सुविधा"
                      : "No-login public viewing for absolute transparency"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-card border border-border/60 rounded-2xl p-6 text-center shadow-sm">
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-2">
                  98.4%
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {language === "hi"
                    ? "एआई अनुवाद सटीकता"
                    : "AI Translation Accuracy"}
                </p>
              </div>
              <div className="bg-card border border-border/60 rounded-2xl p-6 text-center shadow-sm">
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-500 mb-2">
                  4.8x
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {language === "hi"
                    ? "तीव्र समस्या निवारण दर"
                    : "Faster Resolution Speed"}
                </p>
              </div>
              <div className="bg-card border border-border/60 rounded-2xl p-6 text-center shadow-sm">
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-500 mb-2">
                  1,200+
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {language === "hi"
                    ? "हल किए गए बुनियादी ढांचे के अंतराल"
                    : "Resolved Infrastructure Gaps"}
                </p>
              </div>
              <div className="bg-card border border-border/60 rounded-2xl p-6 text-center shadow-sm">
                <div className="text-3xl sm:text-4xl font-extrabold text-purple-500 mb-2">
                  30+
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {language === "hi"
                    ? "संबद्ध ब्लॉक और गांव"
                    : "Connected Blocks & Villages"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Constituency Impact & Grievance Feed */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold mb-4">
            <Activity className="w-3.5 h-3.5" />
            <span>
              {language === "hi"
                ? "त्वरित समाधान बोर्ड"
                : "Live Grievance Impact Board"}
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-foreground mb-4">
            {language === "hi"
              ? "हाल की प्रशासनिक कार्रवाइयां"
              : "Transparency in Action"}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg font-semibold">
            {language === "hi"
              ? "देखें कि कैसे आपकी शिकायतें प्राथमिकता स्तर पर हल की जा रही हैं।"
              : "Track recent municipal resolutions and MP development fund deployments in your area."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Grievance Item 1 */}
          <div className="glass-panel rounded-[2rem] p-8 border border-border/40 bg-card/45 backdrop-blur-md hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-bold text-muted-foreground">
                  #G-1082
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {language === "hi" ? "पूर्ण (Resolved)" : "Resolved"}
                </span>
              </div>

              <h4 className="text-lg font-black text-foreground mb-3">
                {language === "hi"
                  ? "हसनगंज में जलापूर्ति बाधित"
                  : "Drinking Water Pipeline Leakage"}
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed mb-6 font-medium">
                {language === "hi"
                  ? "हसनगंज ब्लॉक में पीने के पानी की मुख्य पाइपलाइन फट गई थी जिससे ४ वार्डों में पानी नहीं आ रहा था।"
                  : "Main pipeline burst near Hasanगंज primary health center, impacting 4 wards."}
              </p>
            </div>

            <div className="border-t border-border/40 pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">
                  {language === "hi" ? "प्रायोरिटी स्कोर" : "AI Priority Score"}
                </span>
                <span className="font-extrabold text-foreground">89/100</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">
                  {language === "hi" ? "कार्रवाई" : "MP Action"}
                </span>
                <span className="font-extrabold text-emerald-500">
                  {language === "hi"
                    ? "₹1.8 लाख आवंटित"
                    : "₹1.8L Fund Released"}
                </span>
              </div>
            </div>
          </div>

          {/* Grievance Item 2 */}
          <div className="glass-panel rounded-[2rem] p-8 border border-border/40 bg-card/45 backdrop-blur-md hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-bold text-muted-foreground">
                  #G-1079
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {language === "hi"
                    ? "प्रगति पर (In Progress)"
                    : "In Progress"}
                </span>
              </div>

              <h4 className="text-lg font-black text-foreground mb-3">
                {language === "hi"
                  ? "सदर रोड गड्ढों की मरम्मत"
                  : "Road Resurfacing"}
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed mb-6 font-medium">
                {language === "hi"
                  ? "सदर ब्लॉक से अस्पताल रोड तक भारी गड्ढों के कारण हादसे हो रहे थे, तत्काल गिट्टी बिछाने का काम जारी है।"
                  : "Major potholes on Sadar linking road. Secondary levelling complete; tarring started."}
              </p>
            </div>

            <div className="border-t border-border/40 pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">
                  {language === "hi" ? "प्रायोरिटी स्कोर" : "AI Priority Score"}
                </span>
                <span className="font-extrabold text-foreground">82/100</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">
                  {language === "hi" ? "कार्रवाई" : "MP Action"}
                </span>
                <span className="font-extrabold text-blue-500">
                  {language === "hi"
                    ? "मरम्मत टीम स्वीकृत"
                    : "Work Crew Deployed"}
                </span>
              </div>
            </div>
          </div>

          {/* Grievance Item 3 */}
          <div className="glass-panel rounded-[2rem] p-8 border border-border/40 bg-card/45 backdrop-blur-md hover:border-purple-500/30 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-bold text-muted-foreground">
                  #G-1065
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {language === "hi" ? "पूर्ण (Resolved)" : "Resolved"}
                </span>
              </div>

              <h4 className="text-lg font-black text-foreground mb-3">
                {language === "hi"
                  ? "पिहारी गांव ट्रांसफार्मर अपग्रेड"
                  : "New Transformer Setup"}
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed mb-6 font-medium">
                {language === "hi"
                  ? "बिजली के कम वोल्टेज के कारण नलकूप नहीं चल पा रहे थे। 100kVA के ट्रांसफार्मर को 250kVA में बदला गया।"
                  : "Transformer upgrade at Pihari agriculture fields to resolve low voltage issues."}
              </p>
            </div>

            <div className="border-t border-border/40 pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">
                  {language === "hi" ? "प्रायोरिटी स्कोर" : "AI Priority Score"}
                </span>
                <span className="font-extrabold text-foreground">76/100</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">
                  {language === "hi" ? "कार्रवाई" : "MP Action"}
                </span>
                <span className="font-extrabold text-purple-500">
                  {language === "hi"
                    ? "ट्रांसफार्मर अपग्रेड"
                    : "Transformer Upgraded"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 w-full max-w-4xl mx-auto px-6 lg:px-10 pb-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>
              {language === "hi"
                ? "अक्सर पूछे जाने वाले प्रश्न"
                : "Frequently Asked Questions"}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-3">
            {language === "hi"
              ? "नागरिकों के मन में उठने वाले सवाल"
              : "Answers to Your Questions"}
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            {language === "hi"
              ? "जनस्वर एआई पोर्टल और शिकायत निवारण प्रक्रिया के बारे में अधिक जानें।"
              : "Learn more about the JanSwar AI portal, safety, and grievance processing."}
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              qEn: "How do I file a complaint or suggestion?",
              qHi: "मैं शिकायत या सुझाव कैसे दर्ज करूं?",
              aEn: "Simply log in using your email to receive an OTP. Once in your dashboard, select your issue category, either speak your concern in your regional dialect or type it in, select your block/village, and click submit. It goes directly to your MP's review list.",
              aHi: "बस ईमेल का उपयोग करके लॉग इन करें और ओटीपी प्राप्त करें। डैशबोर्ड में, अपनी समस्या की श्रेणी चुनें, अपनी भाषा में बोलकर या लिखकर विवरण भरें, अपना ब्लॉक/गांव चुनें और सबमिट करें। यह सीधे सांसद की समीक्षा सूची में चला जाता है।",
            },
            {
              qEn: "How does the AI process my voice notes?",
              qHi: "एआई मेरी वॉयस रिकॉर्डिंग को कैसे प्रोसेस करता है?",
              aEn: "JanSwar AI employs advanced speech-to-text models to transcribe voice recordings in Hindi, English, and other regional dialects. It then automatically translates the text, extracts key entities, and categorizes the issue, removing language barriers completely.",
              aHi: "जनस्वर एआई हिंदी, अंग्रेजी और क्षेत्रीय बोलियों में आवाज रिकॉर्डिंग को बदलने के लिए उन्नत स्पीच-टू-टेक्स्ट मॉडल का उपयोग करता है। यह स्वचालित रूप से अनुवाद करता है, महत्वपूर्ण बिंदुओं को पहचानता है और श्रेणी तय करता है।",
            },
            {
              qEn: "What is the AI Priority Score?",
              qHi: "एआई प्राथमिकता (Priority) स्कोर क्या है?",
              aEn: "The Priority Score is calculated using an intelligent algorithm that maps the severity of the submitted grievance against census/demographic databases (e.g., block population, availability of clean water, current road conditions). This ensures urgent community matters are highlighted first.",
              aHi: "प्राथमिकता स्कोर एक उन्नत एल्गोरिदम द्वारा निकाला जाता है जो समस्या की गंभीरता को स्थानीय जनसांख्यिकी डेटा (जैसे जनसंख्या, पानी की कमी, सड़क की खराब स्थिति) के साथ मिलाता है। इससे गंभीर मुद्दों को सबसे पहले ध्यान मिलता है।",
            },
            {
              qEn: "Can I track the progress of my complaint?",
              qHi: "क्या मैं अपनी शिकायत की प्रगति को ट्रैक कर सकता हूँ?",
              aEn: "Yes! Your citizen dashboard lists all grievances you have submitted along with their status ('Submitted', 'In Progress', 'Resolved'). You will see comments from the MP's office and fund allocations in real-time.",
              aHi: "हाँ! आपका नागरिक डैशबोर्ड आपके द्वारा दर्ज की गई सभी शिकायतों को उनकी स्थिति ('दर्ज', 'प्रगति पर', 'समाधान') के साथ दिखाता है। आप सांसद कार्यालय से टिप्पणी और आवंटित फंड को वास्तविक समय में देख सकते हैं।",
            },
          ].map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="bg-card/40 border border-border/60 rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/30"
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-black text-sm sm:text-base text-foreground focus:outline-none"
                >
                  <span>{language === "hi" ? faq.qHi : faq.qEn}</span>
                  <span
                    className={`text-xl font-bold transition-transform duration-300 ${isOpen ? "rotate-45 text-primary" : "text-muted-foreground"}`}
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 text-xs sm:text-sm text-muted-foreground font-semibold leading-relaxed border-t border-border/20 pt-4 bg-background/20 animate-fadeIn">
                    {language === "hi" ? faq.aHi : faq.aEn}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Call to Action Section */}
      <section
        id="community"
        className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 pb-24"
      >
        <div className="relative overflow-hidden rounded-[3rem] border border-border bg-gradient-to-br from-card/90 via-primary/5 to-indigo-500/5 p-10 md:p-16 text-center shadow-2xl backdrop-blur-md">
          {/* Ambient glow backgrounds inside card */}
          <div className="absolute top-[-20%] left-[-20%] w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[40vw] h-[40vw] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
            {/* Sparkle badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>{language === "hi" ? "शिकायत निवारण एवं नियोजन" : "Grievance Redressal & Planning"}</span>
            </div>

            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight text-foreground leading-[1.1]">
              {language === "hi" ? (
                <>
                  क्या आप शिकायत या <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">सुझाव</span> दर्ज करने के लिए तैयार हैं?
                </>
              ) : (
                <>
                  Ready to Voice Your <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">Suggestions</span>?
                </>
              )}
            </h2>
            
            <p className="text-muted-foreground text-base md:text-lg mb-10 max-w-2xl leading-relaxed font-medium">
              {language === "hi"
                ? "लॉग इन करके स्थानीय मुद्दों को रिकॉर्ड करें, गाँव के विकास सूचकांक को ट्रैक करें और जिला विकास योजना में सीधे भाग लें।"
                : "Log in to record local issues, track your village gap indices, and engage directly with administrative planning."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
              <button
                onClick={handleDashboardRedirect}
                className="w-full sm:w-auto px-10 py-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>
                  {language === "hi"
                    ? "लॉग इन / साइन अप करें"
                    : "Log In / Sign Up"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-muted border border-border/80 text-muted-foreground hover:text-foreground font-bold text-base hover:bg-muted/80 active:scale-95 transition-all text-center"
              >
                {language === "hi" ? "सुविधाएं जानें" : "Explore Features"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Multi-Column Footer */}
      <footer className="relative z-10 w-full border-t border-border bg-card/65 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <div className="flex flex-col items-start gap-4 mb-5">
              <div className="relative w-20 h-20 overflow-hidden rounded-2xl border border-primary/20 bg-white/5 shadow-lg flex items-center justify-center">
                <Image
                  src="/JS_logo.png"
                  alt="JanSwar Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-foreground">
                JanSwar{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
                  AI
                </span>
              </span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed mb-6 font-semibold">
              An AI-assisted constituency prioritization framework mapping local
              district issues directly to administrative action.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm text-foreground mb-4 uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-muted-foreground">
              <li>
                <Link
                  href="/login"
                  className="hover:text-foreground transition-colors"
                >
                  Citizen Login
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-foreground transition-colors"
                >
                  MP Console
                </Link>
              </li>
              <li>
                <a
                  href="#features"
                  className="hover:text-foreground transition-colors"
                >
                  Feature Highlights
                </a>
              </li>
              <li>
                <a
                  href="#workflow"
                  className="hover:text-foreground transition-colors"
                >
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-sm text-foreground mb-4 uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Constituency Maps
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  AI Priority Index
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Developer API
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  FAQ & Support
                </a>
              </li>
            </ul>
          </div>

          {/* Subscription Mock */}
          <div>
            <h4 className="font-bold text-sm text-foreground mb-4 uppercase tracking-wider">
              Stay Informed
            </h4>
            <p className="text-muted-foreground text-xs leading-relaxed mb-4 font-semibold">
              Get updates about district priority reports and new feature
              releases.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter email"
                className="w-full bg-input border border-border/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button className="bg-foreground text-background px-3 py-2 rounded-xl text-xs font-bold hover:opacity-90">
                Go
              </button>
            </form>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="border-t border-border/40 py-8 bg-muted/40">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground font-semibold gap-4">
            <p>
              © {new Date().getFullYear()} JanSwar AI. All rights reserved.
              Created for Smart District Planning.
            </p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
