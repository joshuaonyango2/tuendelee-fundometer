import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Language, LANGUAGE_CODES, translate, translations } from "@/lib/i18n";
import { subscribeTranslations, translateAsync, translateSync } from "@/lib/autoTranslate";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** Keyed, hand-written translations (auto-translated when a key is missing). */
  t: (key: string) => string;
  /** Automatic translation of any free text (admin wording, instructions). */
  tr: (text: string | null | undefined) => string;
  /** Awaitable automatic translation, for toasts. */
  trAsync: (text: string) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => translate("en", key),
  tr: (text) => text ?? "",
  trAsync: async (text) => text,
});

const STORAGE_KEY = "fundometer-language";

export function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (LANGUAGE_CODES as string[]).includes(stored)) return stored as Language;
  } catch {
    // ignore storage errors
  }
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getStoredLanguage());
  const [, setVersion] = useState(0);

  useEffect(() => subscribeTranslations(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore storage errors
    }
  }, [language]);

  const tr = useCallback((text: string | null | undefined) => translateSync(language, text), [language]);

  const value: LanguageContextValue = {
    language,
    setLanguage: setLanguageState,
    t: (key: string) => {
      const own = translations[language]?.[key];
      if (own !== undefined) return own;
      const english = translate("en", key);
      return english === key ? key : translateSync(language, english);
    },
    tr,
    trAsync: (text: string) => translateAsync(language, text),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
