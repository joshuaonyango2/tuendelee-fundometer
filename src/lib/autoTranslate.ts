import { supabase } from "@/integrations/supabase/client";
import type { Language } from "./i18n";

/**
 * Automatic translation for free-form text (admin-written wording, instructions,
 * help content). Results are cached in memory + localStorage and on the server.
 */
const STORE_KEY = "fundometer-tr-cache-v1";
type Cache = Record<string, Record<string, string>>; // lang -> source -> translated

let cache: Cache = {};
try {
  cache = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
} catch {
  cache = {};
}

const listeners = new Set<() => void>();
const pending: Record<string, Set<string>> = {};
const inflight: Record<string, Set<string>> = {};
let timer: ReturnType<typeof setTimeout> | null = null;

function persist() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(cache));
  } catch {
    // storage full — ignore
  }
}

export function subscribeTranslations(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

async function flush() {
  timer = null;
  for (const lang of Object.keys(pending)) {
    const texts = [...pending[lang]];
    delete pending[lang];
    inflight[lang] ??= new Set();
    texts.forEach((t) => inflight[lang].add(t));
    for (let i = 0; i < texts.length; i += 100) {
      const chunk = texts.slice(i, i + 100);
      try {
        const { data, error } = await supabase.functions.invoke("translate", {
          body: { texts: chunk, target: lang },
        });
        const out: string[] | undefined = (data as any)?.translations;
        if (!error && Array.isArray(out)) {
          cache[lang] ??= {};
          chunk.forEach((src, k) => (cache[lang][src] = out[k] ?? src));
          persist();
        }
      } catch (e) {
        console.warn("auto-translate failed", e);
      } finally {
        chunk.forEach((t) => inflight[lang].delete(t));
      }
    }
  }
  listeners.forEach((l) => l());
}

function request(lang: string, text: string) {
  if (inflight[lang]?.has(text)) return;
  pending[lang] ??= new Set();
  pending[lang].add(text);
  if (!timer) timer = setTimeout(flush, 40);
}

/** Returns the cached translation, or the original while it is being fetched. */
export function translateSync(lang: Language, text: string | null | undefined): string {
  if (!text) return text ?? "";
  if (lang === "en" || !text.trim()) return text;
  const hit = cache[lang]?.[text];
  if (hit !== undefined) return hit;
  request(lang, text);
  return text;
}

/** Awaits a translation (for toasts and other one-off messages). */
export async function translateAsync(lang: Language, text: string): Promise<string> {
  if (lang === "en" || !text.trim()) return text;
  const hit = cache[lang]?.[text];
  if (hit !== undefined) return hit;
  try {
    const { data } = await supabase.functions.invoke("translate", { body: { texts: [text], target: lang } });
    const out = (data as any)?.translations?.[0];
    if (typeof out === "string") {
      cache[lang] ??= {};
      cache[lang][text] = out;
      persist();
      return out;
    }
  } catch {
    // fall back to original
  }
  return text;
}
