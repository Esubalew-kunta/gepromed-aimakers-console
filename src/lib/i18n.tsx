"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/**
 * Real, app-controlled French/English toggle for the console — same pattern
 * as gepromed-web's lib/i18n.tsx. Deliberately NOT relying on the browser's
 * Google Translate: Translate injects <font> tags into the DOM that React
 * doesn't track, which caused real removeChild/insertBefore crashes on
 * dynamic pages (see the expense review table). This dictionary swap never
 * touches the DOM outside React, so it can't cause that class of bug.
 */

export type Lang = "fr" | "en";

const KEY = "gepromed-console.lang";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; toggle: () => void };
const LanguageContext = createContext<Ctx>({
  lang: "fr",
  setLang: () => {},
  toggle: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY) as Lang | null;
    if (saved === "fr" || saved === "en") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(KEY, l);
    document.documentElement.lang = l;
  }, []);

  const toggle = useCallback(
    () => setLang(lang === "fr" ? "en" : "fr"),
    [lang, setLang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

// UI string dictionary. `t(key)` returns the string in the active language.
// Start with the sidebar nav (highest-visibility, every page) + shared chrome;
// extend page-by-page as each is converted from hardcoded English.
const DICT = {
  "nav.dashboard": { fr: "Tableau de bord", en: "Dashboard" },
  "nav.trainees": { fr: "Gestion des Trainees", en: "Trainees management" },
  "nav.courses": { fr: "Gestion des formations", en: "Course management" },
  "nav.engineering": { fr: "Ingénierie", en: "Engineering" },
  "nav.contracts": { fr: "Modèles de contrats", en: "Contract templates" },
  "nav.skills": { fr: "Catalogue de compétences", en: "Skills catalog" },
  "nav.automations": { fr: "Automatisations", en: "Automations" },
  "nav.expenses": { fr: "Notes de frais", en: "Expense reports" },
  "nav.integrations": { fr: "Intégrations", en: "Integrations" },
  "nav.roadmap": { fr: "Feuille de route", en: "Roadmap" },
  "nav.inputs": { fr: "Accès & paramètres", en: "Inputs & access" },
  "nav.training": { fr: "Espace formation", en: "Training hub" },
  "nav.feedback": { fr: "Retours", en: "Feedback" },

  "chrome.menu": { fr: "Menu", en: "Menu" },
  "chrome.signOut": { fr: "Se déconnecter", en: "Sign out" },
  "chrome.by": { fr: "par AI Makers", en: "by AI Makers" },
  "chrome.demoMode": {
    fr: "Mode démo · IA, automatisations et intégrations simulées hors ligne, aucune API externe appelée.",
    en: "Demo mode · All AI, automations & integrations are simulated offline, no external APIs are called.",
  },
} as const;

export type DictKey = keyof typeof DICT;

export function useT() {
  const { lang } = useLang();
  return useCallback((key: DictKey) => DICT[key][lang], [lang]);
}
