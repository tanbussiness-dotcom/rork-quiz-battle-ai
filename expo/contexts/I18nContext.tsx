import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useMemo, useState, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "@/lib/firebase";
import { translations, Language as LocalLanguage, TranslationKey } from "@/constants/translations";
import { useAuth } from "@/contexts/AuthContext";

export type LanguageCode = LocalLanguage; // reuse existing codes: 'en' | 'vi'

export type I18nStrings = Record<string, string>;

const STORAGE_KEY = "i18n_selected_language_v1";
const STORAGE_STRINGS_PREFIX = "i18n_strings_";

function codeToLanguageName(code: LanguageCode): string {
  switch (code) {
    case "vi":
      return "Vietnamese";
    default:
      return "English";
  }
}

interface I18nContextType {
  language: LanguageCode;
  strings: I18nStrings;
  t: (key: TranslationKey) => string;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  refresh: () => Promise<void>;
}

async function fetchRemoteStrings(lang: LanguageCode): Promise<I18nStrings | null> {
  try {
    const ref = doc(db, "languages", lang);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as { strings?: I18nStrings };
      return data.strings ?? null;
    }
    return null;
  } catch (e) {
    console.log("fetchRemoteStrings error", e);
    return null;
  }
}

async function cacheStrings(lang: LanguageCode, strings: I18nStrings) {
  try {
    await AsyncStorage.setItem(`${STORAGE_STRINGS_PREFIX}${lang}`, JSON.stringify(strings));
  } catch (e) {
    console.log("cacheStrings error", e);
  }
}

async function getCachedStrings(lang: LanguageCode): Promise<I18nStrings | null> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_STRINGS_PREFIX}${lang}`);
    return raw ? (JSON.parse(raw) as I18nStrings) : null;
  } catch (e) {
    console.log("getCachedStrings error", e);
    return null;
  }
}

export const [I18nProvider, useI18n] = createContextHook<I18nContextType>(() => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [strings, setStrings] = useState<I18nStrings>({});
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        let preferred: LanguageCode | null = null;
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) preferred = stored as LanguageCode;

        if (user && !preferred) {
          try {
            const userSnap = await getDoc(doc(db, "users", user.uid));
            if (userSnap.exists()) {
              const data = userSnap.data() as any;
              preferred = (data.language as LanguageCode) ?? (data.preferences?.language as LanguageCode) ?? null;
            }
          } catch (e) {
            console.log("read user language error", e);
          }
        }

        const lang: LanguageCode = preferred ?? "en";
        setLanguageState(lang);

        let remote = await fetchRemoteStrings(lang);
        if (!remote) {
          const cached = await getCachedStrings(lang);
          remote = cached ?? null;
        }

        const fallback = translations[lang] as unknown as I18nStrings;
        setStrings(remote ? { ...fallback, ...remote } : fallback);
        setLoaded(true);
      } catch (e) {
        console.log("i18n init error", e);
        setStrings(translations.en as unknown as I18nStrings);
        setLoaded(true);
      }
    };
    init();
  }, [user?.uid]);

  const persistLanguage = useCallback(async (lang: LanguageCode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
      if (user) {
        try {
          await setDoc(
            doc(db, "users", user.uid),
            { language: lang, preferences: { language: lang } },
            { merge: true }
          );
        } catch (e) {
          console.log("persist user language error", e);
        }
      }
    } catch (e) {
      console.log("persistLanguage error", e);
    }
  }, [user]);

  const loadStrings = useCallback(async (lang: LanguageCode) => {
    const remote = await fetchRemoteStrings(lang);
    const fallback = translations[lang] as unknown as I18nStrings;
    if (remote) {
      await cacheStrings(lang, remote);
      setStrings({ ...fallback, ...remote });
    } else {
      const cached = await getCachedStrings(lang);
      setStrings(cached ? { ...fallback, ...cached } : fallback);
    }
  }, []);

  const setLanguage = useCallback(async (lang: LanguageCode) => {
    setLanguageState(lang);
    await persistLanguage(lang);
    await loadStrings(lang);
  }, [persistLanguage, loadStrings]);

  const refresh = useCallback(async () => {
    await loadStrings(language);
  }, [language, loadStrings]);

  const t = useCallback((key: TranslationKey) => {
    return (strings[key] ?? (translations[language] as any)[key] ?? key) as string;
  }, [strings, language]);

  return useMemo(() => ({
    language,
    strings,
    t,
    setLanguage,
    refresh,
  }), [language, strings, t, setLanguage, refresh]);
});
