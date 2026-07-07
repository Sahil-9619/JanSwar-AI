"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Activity, Database, Server, Cpu, CheckCircle2, AlertCircle, RefreshCw, MessageSquare, PlusCircle, LayoutDashboard, Shield } from "lucide-react";

interface ServiceStatus {
  name: string;
  status: "loading" | "healthy" | "unhealthy";
  url: string;
  details?: string;
}

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isClerkConfigured = clerkKey.startsWith("pk_") && !clerkKey.includes("placeholder");

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<ServiceStatus>({
    name: "Express Backend Gateway",
    status: "loading",
    url: "/api/health",
  });
  
  const [dbStatus, setDbStatus] = useState<ServiceStatus>({
    name: "PostgreSQL Database",
    status: "loading",
    url: "/api/health",
  });

  const [aiStatus, setAiStatus] = useState<ServiceStatus>({
    name: "FastAPI AI Service",
    status: "loading",
    url: "http://localhost:8000/health",
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = async () => {
    setIsRefreshing(true);
    
    // Check Backend & Database
    try {
      const response = await fetch("http://localhost:5000/api/health");
      const data = await response.json();
      
      if (response.ok && data.status === "healthy") {
        setBackendStatus(prev => ({ ...prev, status: "healthy", details: `Connected at ${new Date(data.timestamp).toLocaleTimeString()}` }));
        setDbStatus(prev => ({ ...prev, status: "healthy", details: "Prisma client online" }));
      } else {
        setBackendStatus(prev => ({ ...prev, status: "unhealthy", details: data.error || "Failed API response" }));
        setDbStatus(prev => ({ ...prev, status: "unhealthy", details: data.database === "disconnected" ? "DB Connection failed" : "Unknown database error" }));
      }
    } catch (err: any) {
      setBackendStatus(prev => ({ ...prev, status: "unhealthy", details: "Network Error: Cannot reach server" }));
      setDbStatus(prev => ({ ...prev, status: "unhealthy", details: "Network Error: Cannot reach database gateway" }));
    }

    // Check AI Service
    try {
      const response = await fetch("http://localhost:8000/health");
      const data = await response.json();
      
      if (response.ok && data.status === "healthy") {
        setAiStatus(prev => ({ ...prev, status: "healthy", details: `Model: sentence-transformers & spaCy ready` }));
      } else {
        setAiStatus(prev => ({ ...prev, status: "unhealthy", details: "Service returned error status" }));
      }
    } catch (err: any) {
      setAiStatus(prev => ({ ...prev, status: "unhealthy", details: "Network Error: Cannot reach AI microservice" }));
    }

    setIsRefreshing(false);
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusIcon = (status: "loading" | "healthy" | "unhealthy") => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-pulse" />;
      case "unhealthy":
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />;
    }
  };

  const getStatusClass = (status: "loading" | "healthy" | "unhealthy") => {
    switch (status) {
      case "healthy":
        return "border-emerald-500/20 bg-emerald-500/5 text-emerald-300";
      case "unhealthy":
        return "border-rose-500/20 bg-rose-500/5 text-rose-300";
      default:
        return "border-blue-500/20 bg-blue-500/5 text-blue-300";
    }
  };

  return (
    <div className="flex-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-black relative flex flex-col justify-between">
      
      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header / Nav */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="font-bold text-lg text-white">JS</span>
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
              JanSwar <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Constituency Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isClerkConfigured ? (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium hover:text-white transition">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition">
                    Sign up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium hover:text-white transition">
                Sign in
              </Link>
              <Link href="/register" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition">
                Sign up
              </Link>
            </>
          )}
          <button
            onClick={checkHealth}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Connection
          </button>
        </div>
      </header>

      {/* Hero Body */}
      <main className="w-full max-w-7xl mx-auto px-6 py-12 relative z-10 flex-1 grid lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Side: Brand Concept */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            <Shield className="w-3.5 h-3.5" />
            Phase 1 Foundation Setup Complete
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Turning Every Citizen's <br />
            <span className="gradient-text">Voice into Smarter</span> <br />
            Development Decisions.
          </h2>
          
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl">
            A multilingual AI-powered constituency intelligence platform. Empowering citizens to request development projects with speech and text, and clustering requests automatically for MPs and district planning.
          </p>

          {/* Quick links representation */}
          <div className="flex flex-wrap gap-4 mt-4">
            <Link href="/citizen-dashboard" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 cursor-pointer transition">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Citizen Portal
            </Link>
            <Link href="/mp-dashboard" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 cursor-pointer transition">
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              MP Dashboard
            </Link>
            <Link href="/admin-dashboard" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 cursor-pointer transition">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Admin Control
            </Link>
          </div>
        </div>

        {/* Right Side: Network Status Dashboard */}
        <div className="lg:col-span-5 w-full">
          <div className="glass-panel rounded-3xl p-6 border border-white/5 shadow-2xl relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg text-white">System Connectivity</h3>
                <p className="text-xs text-muted-foreground">Verification status of multi-container networking</p>
              </div>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>

            <div className="flex flex-col gap-4">
              
              {/* Database */}
              <div className={`border rounded-2xl p-4 flex items-center justify-between transition-all duration-300 ${getStatusClass(dbStatus.status)}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900/50 flex items-center justify-center border border-white/10">
                    <Database className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{dbStatus.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{dbStatus.details || "Pending check..."}</p>
                  </div>
                </div>
                {getStatusIcon(dbStatus.status)}
              </div>

              {/* Express Backend */}
              <div className={`border rounded-2xl p-4 flex items-center justify-between transition-all duration-300 ${getStatusClass(backendStatus.status)}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900/50 flex items-center justify-center border border-white/10">
                    <Server className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{backendStatus.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{backendStatus.details || "Pending check..."}</p>
                  </div>
                </div>
                {getStatusIcon(backendStatus.status)}
              </div>

              {/* FastAPI AI Service */}
              <div className={`border rounded-2xl p-4 flex items-center justify-between transition-all duration-300 ${getStatusClass(aiStatus.status)}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900/50 flex items-center justify-center border border-white/10">
                    <Cpu className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{aiStatus.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{aiStatus.details || "Pending check..."}</p>
                  </div>
                </div>
                {getStatusIcon(aiStatus.status)}
              </div>

            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Docker Network:</span>
                <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded">janswar-network</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">ORM Engine:</span>
                <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded">Prisma + Postgresql</span>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© 2026 JanSwar AI. All Rights Reserved. Built for Smarter District & MP Constituency Planning.</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer">Security Protocol</span>
            <span className="hover:text-white cursor-pointer">AI Confidence Model</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
