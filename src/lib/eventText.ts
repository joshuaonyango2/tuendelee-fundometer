import type { Language } from "@/lib/i18n";

export interface LocalizableEvent {
  title?: string | null;
  description?: string | null;
  title_it?: string | null;
  title_fr?: string | null;
  title_sw?: string | null;
  title_es?: string | null;
  title_de?: string | null;
  description_it?: string | null;
  description_fr?: string | null;
  description_sw?: string | null;
  description_es?: string | null;
  description_de?: string | null;
}

/** Columns holding the admin-authored text, per language. */
export const EVENT_TEXT_COLUMNS =
  "title, description, title_it, title_fr, title_sw, title_es, title_de, description_it, description_fr, description_sw, description_es, description_de";

const pick = (value?: string | null, fallback?: string | null) => {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : (fallback ?? "");
};

/**
 * Returns the admin-authored title/description for the chosen language,
 * falling back to the original English text when no translation was provided.
 */
export function localizedEventText(event: LocalizableEvent | null | undefined, language: Language) {
  if (!event) return { title: "", description: "" };

  const map: Partial<Record<Language, { title?: string | null; description?: string | null }>> = {
    it: { title: event.title_it, description: event.description_it },
    fr: { title: event.title_fr, description: event.description_fr },
    sw: { title: event.title_sw, description: event.description_sw },
    es: { title: event.title_es, description: event.description_es },
    de: { title: event.title_de, description: event.description_de },
  };

  const localized = map[language];
  return {
    title: pick(localized?.title, event.title),
    description: pick(localized?.description, event.description),
  };
}
