"use client";

import * as React from "react";
import { useLanguage } from "../context/LanguageContext";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "hi" : "en")}
      className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border text-foreground hover:bg-accent transition font-medium text-sm"
      aria-label="Toggle Language"
    >
      <Languages className="h-5 w-5" />
      <span className="uppercase">{language}</span>
    </button>
  );
}
