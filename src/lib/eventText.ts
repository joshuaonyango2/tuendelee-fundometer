import type { Language } from "@/lib/i18n";

export interface LocalizableEvent {
  title?: string | null;
  description?: string | null;
  title_it?: string | null;
  title_fr?: string | null;
  title_sw?: string | null;
  description_it?: string | null;
  description_fr?: string | null;
  description_sw?: string | null;
}

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

  switch (language) {
    case "it":
      return {
        title: pick(event.title_it, event.title),
        description: pick(event.description_it, event.description),
      };
    case "fr":
      return {
        title: pick(event.title_fr, event.title),
        description: pick(event.description_fr, event.description),
      };
    case "sw":
      return {
        title: pick(event.title_sw, event.title),
        description: pick(event.description_sw, event.description),
      };
    default:
      return {
        title: pick(event.title),
        description: pick(event.description),
      };
  }
}
