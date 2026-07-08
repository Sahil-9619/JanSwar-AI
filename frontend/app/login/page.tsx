"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, Role } from "../../store/authStore";
import { Loader2, Mail, KeyRound, User as UserIcon, Shield } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageToggle } from "../../components/LanguageToggle";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<Role>("CITIZEN");
  const [step, setStep] = useState<"REQUEST" | "VERIFY">("REQUEST");
  
  const { requestOtp, verifyOtp, isLoading, error, clearError, user } = useAuthStore();
  const router = useRouter();
  const { t } = useLanguage();

  // Redirect if already logged in
  if (user) {
    if (user.role === "MP") router.push("/mp-dashboard");
    else router.push("/citizen-dashboard");
  }

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await requestOtp(email, role);
      setStep("VERIFY");
    } catch (err) {
      // Error is handled in store
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    try {
      await verifyOtp(email, otp);
    } catch (err) {
      // Error is handled in store
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Top right toggles */}
      <div className="absolute top-4 right-4 flex gap-2 z-50">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      
      {/* Home link */}
      <div className="absolute top-4 left-4 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <Image src="/JS_logo.png" alt="JanSwar Logo" fill className="object-contain" priority />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-foreground">
            JanSwar <span className="gradient-text">AI</span>
          </span>
        </Link>
      </div>

      <div className="max-w-md w-full glass-panel rounded-3xl p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">{t("login.welcome")}</h1>
          <p className="text-muted-foreground text-sm">{t("login.desc")}</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-lg text-sm mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="hover:text-rose-600">&times;</button>
          </div>
        )}

        {step === "REQUEST" ? (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t("login.emailLabel")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-input/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder={t("login.emailPlaceholder")}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t("login.roleLabel")}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("CITIZEN")}
                  className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition ${role === "CITIZEN" ? "bg-primary/10 border-primary text-primary font-semibold" : "bg-card border-border text-muted-foreground hover:bg-accent"}`}
                >
                  <UserIcon className="w-4 h-4" />
                  {t("login.citizen")}
                </button>
                <button
                  type="button"
                  onClick={() => setRole("MP")}
                  className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition ${role === "MP" ? "bg-primary/10 border-primary text-primary font-semibold" : "bg-card border-border text-muted-foreground hover:bg-accent"}`}
                >
                  <Shield className="w-4 h-4" />
                  {t("login.mp")}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-xl py-3 font-medium flex justify-center items-center gap-2 transition shadow-lg shadow-primary/20"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("login.sendOtp")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t("login.otpLabel")}</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-input/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-center text-lg tracking-widest font-semibold"
                  placeholder={t("login.otpPlaceholder")}
                  maxLength={6}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                {t("login.otpSent").replace("{email}", email)}
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !otp}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl py-3 font-medium flex justify-center items-center gap-2 transition shadow-lg shadow-emerald-600/20"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("login.verifyOtp")}
            </button>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setStep("REQUEST")}
                className="text-sm font-medium text-primary hover:underline"
              >
                {t("login.changeEmail")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
