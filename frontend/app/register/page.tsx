"use client";

import { SignUp } from "@clerk/nextjs";
import { motion } from "framer-motion";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-black relative px-4 py-12">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md flex flex-col items-center"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <span className="font-bold text-xl text-white">JS</span>
          </div>
          <h1 className="font-extrabold text-2xl tracking-tight text-white">
            Create your account
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5 uppercase tracking-widest font-semibold">Join the JanSwar AI planning grid</p>
        </div>

        <div className="glass-panel rounded-3xl p-4 border border-white/5 shadow-2xl relative flex justify-center w-full">
          <SignUp 
            signInUrl="/login"
            forceRedirectUrl="/citizen-dashboard"
            appearance={{
              variables: {
                colorPrimary: "#3b82f6",
                colorBackground: "#090d16",
                colorInputBackground: "#111827",
                colorInputText: "#ffffff",
                colorText: "#ffffff",
                colorTextSecondary: "#9ca3af",
                colorBorder: "#1f2937",
              },
              elements: {
                card: "bg-transparent border-none shadow-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border border-white/10 bg-slate-900/50 hover:bg-slate-800/50 text-white transition",
                formButtonPrimary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg border-none shadow-blue-500/10 hover:shadow-blue-500/20 transition-all",
                footerActionLink: "text-blue-400 hover:text-blue-300",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-blue-400 hover:text-blue-300",
              }
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
