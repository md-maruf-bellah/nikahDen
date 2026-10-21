"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { bn } from "@/locales/bn";
import { en } from "@/locales/en";
import { ar } from "@/locales/ar";

const DICTIONARIES = { bn, en, ar };
const STORAGE_KEY = "nikahdeen_lang";

const LanguageContext = createContext({
  language: "bn",
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
  isRTL: false,
  dir: "ltr",
});

/**
 * Helper to safely traverse nested dictionary object by key path (e.g. "nav.home")
 */
function resolvePath(obj, path) {
  if (!obj || typeof obj !== "object" || !path) return undefined;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("bn");
  const [mounted, setMounted] = useState(false);

  // Load persisted language from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === "bn" || stored === "en" || stored === "ar")) {
        setLanguageState(stored);
      }
    } catch {
      // localStorage may fail in restricted/private contexts
    }
    setMounted(true);
  }, []);

  // Update HTML tag lang and dir attributes whenever language changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
      if (language === "ar") {
        document.documentElement.classList.add("lang-ar");
      } else {
        document.documentElement.classList.remove("lang-ar");
      }
    }
  }, [language]);

  const setLanguage = useCallback((newLang) => {
    if (newLang !== "bn" && newLang !== "en" && newLang !== "ar") return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const t = useCallback(
    (path, fallback = "", params = null) => {
      const dict = DICTIONARIES[language] || DICTIONARIES.bn;
      let text = resolvePath(dict, path);

      // Fallback to Bengali if key is missing in active language
      if (text === undefined && language !== "bn") {
        text = resolvePath(DICTIONARIES.bn, path);
      }

      if (text === undefined) {
        text = fallback || path;
      }

      // Variable interpolation: e.g. "Welcome {name}" -> params: { name: "Maruf" }
      if (params && typeof params === "object") {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }

      return text;
    },
    [language]
  );

  const isRTL = language === "ar";
  const dir = isRTL ? "rtl" : "ltr";

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isRTL,
      dir,
      mounted,
    }),
    [language, setLanguage, t, isRTL, dir, mounted]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: "bn",
      setLanguage: () => {},
      t: (key, fallback) => fallback || key,
      isRTL: false,
      dir: "ltr",
      mounted: false,
    };
  }
  return context;
}
