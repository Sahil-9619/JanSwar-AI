"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Shield, Sparkles, LayoutDashboard, ChevronRight, Brain, Users, Zap, Globe, 
  MessageSquare, ArrowRight, CheckCircle2, TrendingUp, Cpu, Database, Mail
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageToggle } from "../components/LanguageToggle";
import { useLanguage } from "../context/LanguageContext";
import dynamic from "next/dynamic";

const ParticleBackground = dynamic(
  () => import("../components/ParticleBackground").then((mod) => mod.ParticleBackground),
  { ssr: false }
);

export default function LandingPage() {
  const router = useRouter();
  const { user, token, checkAuth } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setIsMounted(true);
    if (token && !user) {
      checkAuth();
    }
  }, [token, user, checkAuth]);

  const handleDashboardRedirect = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role === "CITIZEN") router.push("/citizen-dashboard");
    else router.push("/mp-dashboard");
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

      {/* Sticky Premium Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
                <Image src="/JS_logo.png" alt="JanSwar Logo" fill className="object-contain" priority />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-foreground flex items-center gap-1">
                  JanSwar <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">AI</span>
                </span>
                <span className="block text-[9px] text-muted-foreground font-semibold uppercase tracking-wider -mt-1">Civic Intelligence</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#metrics" className="hover:text-foreground transition-colors">Stats</a>
            <a href="#community" className="hover:text-foreground transition-colors">Community</a>
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
                <Link href="/login" className="hidden sm:block text-sm font-bold text-muted-foreground hover:text-foreground transition">
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
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-28 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-8 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span className="uppercase tracking-widest">{t("landing.heroTitle")}</span>
          </div>
          
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.08] mb-8">
            Democratizing District Planning <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-blue-500">
              Driven by Community Voice
            </span>
          </h2>
          
          <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mb-12 leading-relaxed font-medium">
            JanSwar AI is a civic platform connecting citizens and administration. Share localization suggestions, track AI-modeled priority scores, and empower representatives with analytical feedback.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button 
              onClick={handleDashboardRedirect} 
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-lg transition-all shadow-[0_4px_20px_rgba(59,130,246,0.4)] hover:shadow-[0_4px_30px_rgba(59,130,246,0.6)] hover:scale-105 flex items-center justify-center gap-2"
            >
              {t("landing.getStarted")}
              <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="#features" 
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-card hover:bg-accent border border-border text-foreground font-bold text-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              Explore Features
            </a>
          </div>
        </motion.div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black text-foreground mb-4">Constituency Intelligence Engine</h2>
          <p className="text-muted-foreground text-base sm:text-lg font-semibold">Four dynamic components powering the community planning ecosystem.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 - Large 2 Columns */}
          <div className="md:col-span-2 glass-panel rounded-[2rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/15 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-foreground mb-3">Multilingual Voice Integration</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg font-medium">
                Citizens submit development requests through direct voice recordings in English, Hindi, and regional dialects. Gemini AI transcribes and structures incoming data in real-time, removing linguistic barriers to governance.
              </p>
            </div>
            <div className="mt-8 flex gap-2">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-500/10 text-blue-500">Audio Processing</span>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-500">Gemini 1.5 Pro</span>
            </div>
          </div>

          {/* Card 2 - 1 Column */}
          <div className="glass-panel rounded-[2rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-indigo-500/15 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-3">Priority Modeling</h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                Our algorithm processes requests alongside village data (population, existing road/water gaps) to generate a Priority Score.
              </p>
            </div>
            <div className="mt-8 flex gap-2">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-500">Infrastructure Analytics</span>
            </div>
          </div>

          {/* Card 3 - 1 Column */}
          <div className="glass-panel rounded-[2rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-emerald-500/15 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-3">Interactive Heatmaps</h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                Representations are aggregated onto district maps. Decision makers can spot high-density infrastructure gaps in a single glance.
              </p>
            </div>
            <div className="mt-8 flex gap-2">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-500">GIS Mapping</span>
            </div>
          </div>

          {/* Card 4 - Large 2 Columns */}
          <div className="md:col-span-2 glass-panel rounded-[2rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/15 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-foreground mb-3">Role-Based Dashboard System</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg font-medium">
                Separated portals ensure targeted tools. Citizens review and track their submitted requests, while Members of Parliament (MPs) monitor broader statistics, manage category filters, and directly approve local developments.
              </p>
            </div>
            <div className="mt-8 flex gap-2">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-500/10 text-purple-500">Representative Console</span>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-pink-500/10 text-pink-500">Citizen Portal</span>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="relative z-10 w-full py-24 bg-muted/20 border-y border-border/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black text-foreground mb-4">Pipeline to Local Action</h2>
            <p className="text-muted-foreground text-base sm:text-lg font-semibold">How voice suggestions convert to administrative priority and decisions.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-[2.5rem] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 opacity-20" />
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-6 relative z-10 group-hover:scale-105 transition-transform shadow-lg shadow-blue-500/5">
                <Cpu className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Voice Record</h3>
              <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">Citizen records issue and detects GPS coordinates on the dashboard.</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-6 relative z-10 group-hover:scale-105 transition-transform shadow-lg shadow-indigo-500/5">
                <Database className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. AI Processing</h3>
              <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">Gemini translates regional dialect and extracts categories and descriptions.</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 relative z-10 group-hover:scale-105 transition-transform shadow-lg shadow-emerald-500/5">
                <Zap className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. scoring</h3>
              <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">Algorithm matches block statistics and assigns a priority score (0-100).</p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-6 relative z-10 group-hover:scale-105 transition-transform shadow-lg shadow-purple-500/5">
                <CheckCircle2 className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">4. MP Review</h3>
              <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">MP reviews prioritized data and marks actions as Approved or Archived.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics & Interactive Stats Section */}
      <section id="metrics" className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="glass-panel rounded-[3rem] p-10 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6 leading-tight">Data-Backed district Development</h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8 font-medium">
                By gathering localized community feedback directly from the source, district administrators can allocate municipal and MP development funds exactly where the gap is highest.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs">✓</div>
                  <span className="text-sm font-semibold text-muted-foreground">Reduced decision cycle by 70%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs">✓</div>
                  <span className="text-sm font-semibold text-muted-foreground">Targeted funds for road and pipeline fixes</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs">✓</div>
                  <span className="text-sm font-semibold text-muted-foreground">No-login public viewing for transparency</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-card border border-border/60 rounded-2xl p-6 text-center shadow-sm">
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-2">98.4%</div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Translation Accuracy</p>
              </div>
              <div className="bg-card border border-border/60 rounded-2xl p-6 text-center shadow-sm">
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-500 mb-2">4.8x</div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Faster Pipeline Speed</p>
              </div>
              <div className="bg-card border border-border/60 rounded-2xl p-6 text-center shadow-sm">
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-500 mb-2">1,200+</div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolved Gaps</p>
              </div>
              <div className="bg-card border border-border/60 rounded-2xl p-6 text-center shadow-sm">
                <div className="text-3xl sm:text-4xl font-extrabold text-purple-500 mb-2">30+</div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Connected Blocks</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section id="community" className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden shadow-[0_20px_50px_rgba(59,130,246,0.3)]">
          <div className="absolute inset-0 bg-white/5 opacity-10 pointer-events-none" />
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Ready to voice your suggestions?</h2>
            <p className="text-blue-100 text-lg md:text-xl mb-10 leading-relaxed font-semibold">
              Log in to record local issues, track your village gap indices, and engage directly with administrative planning.
            </p>
            <button 
              onClick={handleDashboardRedirect} 
              className="px-10 py-4.5 rounded-full bg-white text-blue-700 font-extrabold text-lg hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-900/20"
            >
              Get Started with OTP Login
            </button>
          </div>
        </div>
      </section>

      {/* Premium Multi-Column Footer */}
      <footer className="relative z-10 w-full border-t border-border bg-card/65 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <Image src="/JS_logo.png" alt="JanSwar Logo" fill className="object-contain" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-foreground">
                JanSwar <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">AI</span>
              </span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed mb-6 font-semibold">
              An AI-assisted constituency prioritization framework mapping local district issues directly to administrative action.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm text-foreground mb-4 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2.5 text-xs font-semibold text-muted-foreground">
              <li><Link href="/login" className="hover:text-foreground transition-colors">Citizen Login</Link></li>
              <li><Link href="/login" className="hover:text-foreground transition-colors">MP Console</Link></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">Feature Highlights</a></li>
              <li><a href="#workflow" className="hover:text-foreground transition-colors">How It Works</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-sm text-foreground mb-4 uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2.5 text-xs font-semibold text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Constituency Maps</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">AI Priority Index</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Developer API</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">FAQ & Support</a></li>
            </ul>
          </div>

          {/* Subscription Mock */}
          <div>
            <h4 className="font-bold text-sm text-foreground mb-4 uppercase tracking-wider">Stay Informed</h4>
            <p className="text-muted-foreground text-xs leading-relaxed mb-4 font-semibold">
              Get updates about district priority reports and new feature releases.
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
            <p>© {new Date().getFullYear()} JanSwar AI. All rights reserved. Created for Smart District Planning.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
