"use client";

import { useState, useEffect, createContext, useContext } from "react";

export type Lang = "th" | "en";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Helper to return Thai or English string based on current lang */
  t: (th: string, en: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: "th",
  setLang: () => {},
  t: (th) => th,
});

/**
 * Custom hook to access language context.
 * Returns current language, setter, and translation helper.
 */
export function useLanguage() {
  return useContext(LanguageContext);
}

/**
 * Provider component for language context.
 * Persists language choice in localStorage under key "rae-lang".
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("th");

  useEffect(() => {
    const stored = localStorage.getItem("rae-lang") as Lang | null;
    if (stored === "th" || stored === "en") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("rae-lang", l);
  };

  const t = (th: string, en: string) => (lang === "th" ? th : en);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
