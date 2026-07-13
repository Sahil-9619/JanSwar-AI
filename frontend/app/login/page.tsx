"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, Role } from "../../store/authStore";
import {
  Loader2,
  Mail,
  KeyRound,
  User as UserIcon,
  Shield,
  Eye,
  EyeOff,
  Lock,
  MapPin,
  Building,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageToggle } from "../../components/LanguageToggle";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { login, signup, verifySignup, requestPasswordReset, verifyPasswordReset, isLoading, error, clearError, user } =
    useAuthStore();

  // Mode state: LOGIN vs SIGNUP vs FORGOT_PASSWORD
  const [mode, setMode] = useState<"LOGIN" | "SIGNUP" | "FORGOT_PASSWORD">("LOGIN");
  const [step, setStep] = useState<"FORM" | "OTP_VERIFY" | "RESET_VERIFY">("FORM");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Local Validation Errors
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "MP") {
        router.push("/mp-dashboard");
      } else if (
        user.role === "DISTRICT_ADMIN" ||
        user.role === "SUPER_ADMIN"
      ) {
        router.push("/admin-dashboard");
      } else {
        router.push("/citizen-dashboard");
      }
    }
  }, [user, router]);

  const handleToggleMode = (selectedMode: "LOGIN" | "SIGNUP" | "FORGOT_PASSWORD") => {
    setMode(selectedMode);
    setStep("FORM");
    setLocalError(null);
    clearError();
    setPassword("");
    setConfirmPassword("");
    setOtp("");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    if (!email || !password) return;

    try {
      await login(email, password);
    } catch (err) {
      // Handled in store
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password || !fullName || !city || !state) return;

    if (password !== confirmPassword) {
      setLocalError(
        language === "hi"
          ? "दोनों पासवर्ड मेल नहीं खाते हैं"
          : "Passwords do not match",
      );
      return;
    }

    try {
      await signup({
        fullName,
        email,
        pass: password,
        city,
        state,
        role: "CITIZEN",
      });
      setStep("OTP_VERIFY");
    } catch (err) {
      // Handled in store
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    if (!otp) return;

    try {
      await verifySignup(email, otp);
    } catch (err) {
      // Handled in store
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    if (!email) return;

    try {
      await requestPasswordReset(email);
      setStep("RESET_VERIFY");
    } catch (err) {
      // Handled in store
    }
  };

  const handleVerifyResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    if (!otp || !newPassword) return;

    if (newPassword !== confirmPassword) {
      setLocalError(
        language === "hi"
          ? "दोनों पासवर्ड मेल नहीं खाते हैं"
          : "Passwords do not match"
      );
      return;
    }

    try {
      await verifyPasswordReset(email, otp, newPassword);
      alert(language === "hi" ? "पासवर्ड सफलतापूर्वक रीसेट किया गया!" : "Password reset successfully!");
      setMode("LOGIN");
      setStep("FORM");
    } catch (err) {
      // Handled in store
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top right toggles */}
      <div className="absolute top-4 right-4 flex gap-2 z-50">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      {/* Home Link */}
      <div className="absolute top-4 left-4 z-50">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-14 h-14 flex items-center justify-center rounded-xl border border-primary/20 bg-white p-0 shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
            <Image
              src="/JS_logo.png"
              alt="JanSwar Logo"
              fill
              className="object-contain scale-160"
              priority
            />
          </div>
          <span className="font-black text-2xl tracking-tight text-foreground flex items-center gap-1">
            JanSwar{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              AI
            </span>
          </span>
        </Link>
      </div>

      <div className="w-full max-w-6xl mt-16 mb-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center relative z-10">
        {/* Banner Column */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.div
              animate={{
                y: [0, -12, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative w-40 h-40 md:w-48 md:h-48 rounded-[2rem] bg-gradient-to-br from-primary/10 via-indigo-500/5 to-white/5 border border-primary/20 shadow-2xl p-5 flex items-center justify-center backdrop-blur-md mb-6"
            >
              <div className="absolute inset-0 bg-primary/5 rounded-[2rem] blur-xl animate-pulse" />
              <div className="relative w-full h-full overflow-hidden rounded-[1.5rem] border border-primary/35 bg-card">
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

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground mb-4">
            JanSwar{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
              AI
            </span>
          </h1>

          <p className="text-muted-foreground text-sm md:text-base font-semibold max-w-md mb-6 leading-relaxed">
            {language === "hi"
              ? "सीधे अपने सांसद से जुड़ें - आवाज या पाठ द्वारा शिकायत दर्ज करें, गाँव के विकास सूचकांक को ट्रैक करें और जिला विकास योजना में भाग लें।"
              : "Direct connection with your representative - submit grievances via voice or text, track village developmental index, and engage directly in planning."}
          </p>

          <div className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-500" />
            <span>
              {language === "hi"
                ? "आपकी आवाज़, क्षेत्र का विकास"
                : "Your Voice, Our Priority"}
            </span>
          </div>
        </div>

        {/* Form Switcher & Container Column */}
        <div className="lg:col-span-7 flex flex-col items-center w-full max-w-lg mx-auto">
          {/* Tab Toggle Switcher */}
          <div className="flex justify-center mb-6 w-full">
            <div className="bg-card border border-border/60 p-1.5 rounded-full flex items-center shadow-md relative w-full max-w-[280px]">
              <button
                type="button"
                onClick={() => handleToggleMode("LOGIN")}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all relative ${mode === "LOGIN"
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <span className="relative z-10">
                  {language === "hi" ? "लॉग इन" : "Login"}
                </span>
                {mode === "LOGIN" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleToggleMode("SIGNUP")}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all relative ${mode === "SIGNUP"
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <span className="relative z-10">
                  {language === "hi" ? "साइन अप" : "Sign Up"}
                </span>
                {mode === "SIGNUP" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            </div>
          </div>

          {/* Form Container */}
          <div className="glass-panel rounded-[2.5rem] border border-border/40 p-8 shadow-2xl bg-card/45 backdrop-blur-xl relative overflow-hidden w-full">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Heading */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black text-foreground mb-2 flex items-center justify-center gap-2">
                {step === "OTP_VERIFY" ? (
                  <>
                    <KeyRound className="w-5 h-5 text-indigo-500 animate-pulse" />
                    <span>
                      {language === "hi"
                        ? "ईमेल सत्यापित करें"
                        : "Verify Your Email"}
                    </span>
                  </>
                ) : mode === "FORGOT_PASSWORD" ? (
                  <>
                    <KeyRound className="w-5 h-5 text-indigo-500" />
                    <span>
                      {language === "hi" ? "पासवर्ड भूल गए" : "Forgot Password"}
                    </span>
                  </>
                ) : mode === "LOGIN" ? (
                  <>
                    <Lock className="w-5 h-5 text-primary" />
                    <span>{t("login.welcome")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    <span>
                      {language === "hi"
                        ? "नया खाता बनाएं"
                        : "Create Citizen Account"}
                    </span>
                  </>
                )}
              </h1>
              <p className="text-muted-foreground text-xs font-semibold">
                {step === "OTP_VERIFY"
                  ? language === "hi"
                    ? `हमने ${email} पर एक सत्यापन कोड भेजा है।`
                    : `We sent an OTP to ${email}.`
                  : mode === "FORGOT_PASSWORD"
                    ? language === "hi"
                      ? "अपना ईमेल दर्ज करें और हम आपको एक रीसेट लिंक भेजेंगे"
                      : "Enter your email and we'll send you a reset code"
                    : mode === "LOGIN"
                      ? t("login.desc")
                      : language === "hi"
                        ? "सांसद से जुड़ने के लिए आवश्यक जानकारी भरें"
                        : "Fill details to connect directly with your representative"}
              </p>
            </div>

            {/* Error Message Box */}
            {(error || localError) && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-2xl text-xs font-semibold mb-6 flex items-center justify-between animate-fadeIn">
                <span>{localError || error}</span>
                <button
                  onClick={() => {
                    setLocalError(null);
                    clearError();
                  }}
                  className="hover:opacity-85 text-sm p-1"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Sliding Steps Animation */}
            <AnimatePresence mode="wait">
              {step === "FORM" ? (
                <motion.div
                  key="form-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {mode === "LOGIN" ? (
                    /* ================= LOGIN FORM ================= */
                    <form onSubmit={handleLoginSubmit} className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          {t("login.emailLabel")}
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/80" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-background/50 border border-border/80 rounded-2xl py-3 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                            placeholder={t("login.emailPlaceholder")}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {language === "hi" ? "पासवर्ड" : "Password"}
                          </label>
                          <button
                            type="button"
                            onClick={() => handleToggleMode("FORGOT_PASSWORD")}
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            {language === "hi" ? "पासवर्ड भूल गए?" : "Forgot Password?"}
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/80" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background/50 border border-border/80 rounded-2xl py-3 pl-12 pr-12 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                            placeholder={
                              language === "hi"
                                ? "पासवर्ड दर्ज करें"
                                : "Enter password"
                            }
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-3.5 hover:text-foreground text-muted-foreground/80 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !email || !password}
                        className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-white rounded-2xl py-3.5 font-bold text-sm flex justify-center items-center gap-2 transition shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] mt-6"
                      >
                        {isLoading && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        <span>
                          {language === "hi" ? "लॉग इन करें" : "Log In"}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  ) : mode === "FORGOT_PASSWORD" ? (
                    /* ================= FORGOT PASSWORD FORM ================= */
                    <form className="space-y-5" onSubmit={handleForgotPasswordSubmit}>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          {t("login.emailLabel")}
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/80" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-background/50 border border-border/80 rounded-2xl py-3 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                            placeholder={t("login.emailPlaceholder")}
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading || !email}
                        className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-white rounded-2xl py-3.5 font-bold text-sm flex justify-center items-center gap-2 transition shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] mt-6"
                      >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>
                          {language === "hi" ? "रीसेट लिंक भेजें" : "Send Reset code"}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <div className="text-center mt-4">
                        <button
                          type="button"
                          onClick={() => handleToggleMode("LOGIN")}
                          className="text-xs font-bold text-muted-foreground hover:text-foreground hover:underline"
                        >
                          {language === "hi" ? "लॉग इन पर वापस जाएँ" : "Back to Login"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* ================= SIGNUP FORM ================= */
                    <form onSubmit={handleSignupSubmit} className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          {language === "hi" ? "पूरा नाम" : "Full Name"}
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/80" />
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-background/50 border border-border/80 rounded-2xl py-3 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                            placeholder={
                              language === "hi"
                                ? "उदा. राजेश कुमार"
                                : "e.g. Rajesh Kumar"
                            }
                            required
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          {t("login.emailLabel")}
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/80" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-background/50 border border-border/80 rounded-2xl py-3 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                            placeholder={t("login.emailPlaceholder")}
                            required
                          />
                        </div>
                      </div>

                      {/* Password Fields Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Password */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            {language === "hi" ? "पासवर्ड" : "Password"}
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/80" />
                            <input
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full bg-background/50 border border-border/80 rounded-2xl py-3 pl-12 pr-12 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                              placeholder="Password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-3.5 hover:text-foreground text-muted-foreground/80 transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            {language === "hi"
                              ? "पासवर्ड पुष्टि करें"
                              : "Confirm Password"}
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/80" />
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              className="w-full bg-background/50 border border-border/80 rounded-2xl py-3 pl-12 pr-12 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                              placeholder="Confirm"
                              required
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute right-4 top-3.5 hover:text-foreground text-muted-foreground/80 transition-colors"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Geography Row */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* City */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            {language === "hi" ? "शहर" : "City"}
                          </label>
                          <div className="relative">
                            <Building className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground/80" />
                            <input
                              type="text"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              className="w-full bg-background/50 border border-border/80 rounded-2xl py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                              placeholder={
                                language === "hi" ? "शहर" : "e.g. Purwa"
                              }
                              required
                            />
                          </div>
                        </div>

                        {/* State */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            {language === "hi" ? "राज्य" : "State"}
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground/80" />
                            <input
                              type="text"
                              value={state}
                              onChange={(e) => setState(e.target.value)}
                              className="w-full bg-background/50 border border-border/80 rounded-2xl py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                              placeholder={
                                language === "hi" ? "राज्य" : "e.g. Bihar"
                              }
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Register button */}
                      <button
                        type="submit"
                        disabled={
                          isLoading ||
                          !email ||
                          !password ||
                          !fullName ||
                          !city ||
                          !state
                        }
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 disabled:opacity-50 text-white rounded-2xl py-3.5 font-bold text-sm flex justify-center items-center gap-2 transition shadow-lg shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99] mt-6"
                      >
                        {isLoading && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        <span>
                          {language === "hi" ? "रजिस्टर करें" : "Sign Up"}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </motion.div>
              ) : step === "OTP_VERIFY" ? (
                /* ================= OTP VERIFICATION ================= */
                <motion.div
                  key="otp-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 text-center">
                        {t("login.otpLabel")}
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/80" />
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full bg-background/50 border border-border/80 rounded-2xl py-3.5 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-center text-lg tracking-[0.5em] font-extrabold focus:border-transparent transition-all"
                          placeholder={t("login.otpPlaceholder")}
                          maxLength={6}
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-4 text-center font-medium leading-relaxed">
                        {t("login.otpSent").replace("{email}", email)}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !otp}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl py-3.5 font-bold text-sm flex justify-center items-center gap-2 transition shadow-lg shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {isLoading && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      <span>
                        {language === "hi"
                          ? "ओटीपी सत्यापित करें"
                          : "Verify Code"}
                      </span>
                    </button>

                    <div className="text-center mt-4 flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); /* TODO: Implement resend OTP */ }}
                        className="text-xs font-bold text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {language === "hi" ? "ओटीपी दोबारा भेजें" : "Resend OTP"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep("FORM")}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        {language === "hi"
                          ? "वापस विवरण बदलें"
                          : "Change Register Details"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                /* ================= RESET PASSWORD VERIFICATION ================= */
                <motion.div
                  key="reset-verify-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleVerifyResetSubmit} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 text-center">
                        {t("login.otpLabel")}
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/80" />
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full bg-background/50 border border-border/80 rounded-2xl py-3.5 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-center text-lg tracking-[0.5em] font-extrabold focus:border-transparent transition-all"
                          placeholder={t("login.otpPlaceholder")}
                          maxLength={6}
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-4 text-center font-medium leading-relaxed">
                        {language === "hi"
                          ? `हमने ${email} पर एक रीसेट कोड भेजा है।`
                          : `We sent a reset code to ${email}.`}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          {language === "hi" ? "नया पासवर्ड" : "New Password"}
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/80" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-background/50 border border-border/80 rounded-2xl py-3 pl-12 pr-12 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                            placeholder={language === "hi" ? "नया पासवर्ड दर्ज करें" : "Enter new password"}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-3.5 hover:text-foreground text-muted-foreground/80 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          {language === "hi" ? "पासवर्ड पुष्टि करें" : "Confirm Password"}
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/80" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-background/50 border border-border/80 rounded-2xl py-3 pl-12 pr-12 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                            placeholder={language === "hi" ? "पुष्टि करें" : "Confirm"}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-3.5 hover:text-foreground text-muted-foreground/80 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !otp || !newPassword || !confirmPassword}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl py-3.5 font-bold text-sm flex justify-center items-center gap-2 transition shadow-lg shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>
                        {language === "hi" ? "पासवर्ड रीसेट करें" : "Reset Password"}
                      </span>
                    </button>

                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => setStep("FORM")}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        {language === "hi" ? "वापस जाएँ" : "Go Back"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
