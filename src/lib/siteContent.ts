import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteContentRow {
  id: string;
  content_key: string;
  locale: string;
  value: string;
  is_hidden: boolean;
  sort_order: number;
  updated_at: string;
}

/** Keys the app itself reads. Admins may add their own keys on top of these. */
export const SITE_CONTENT_KEYS: { key: string; label: string; hint: string }[] = [
  {
    key: "youtube_channel_url",
    label: "YouTube channel URL",
    hint: "e.g. https://www.youtube.com/@tuendeleefoundation — powers the channel picker on Impact Stories.",
  },
  {
    key: "youtube_channel_name",
    label: "YouTube channel name",
    hint: "Shown above the video picker.",
  },
  {
    key: "impact_section_title",
    label: "Impact section title",
    hint: "Heading above the impact story on the home page.",
  },
  {
    key: "impact_section_subtitle",
    label: "Impact section subtitle",
    hint: "Short line under the impact heading.",
  },
  {
    key: "payment_instructions_note",
    label: "Extra payment instructions",
    hint: "Shown to donors on the payment confirmation screen.",
  },
  {
    key: "support_email",
    label: "Support email",
    hint: "Shown in the help dialogs and follow-up messages.",
  },
  {
    key: "support_phones",
    label: "Support phone numbers",
    hint: "Comma separated, shown in the help dialogs.",
  },
];

export const SITE_CONTENT_LOCALES = ["en", "it", "fr", "sw"] as const;
export type SiteContentLocale = (typeof SITE_CONTENT_LOCALES)[number];

/** Fetch every visible row and index it as key -> locale -> value. */
export async function fetchSiteContent(): Promise<Record<string, Record<string, string>>> {
  const { data, error } = await supabase
    .from("site_content")
    .select("content_key, locale, value, is_hidden")
    .eq("is_hidden", false);

  if (error) {
    console.error("Failed to load site content", error.message);
    return {};
  }

  const map: Record<string, Record<string, string>> = {};
  for (const row of data ?? []) {
    map[row.content_key] = map[row.content_key] ?? {};
    map[row.content_key][row.locale] = row.value;
  }
  return map;
}

/** Admin-authored text for one key, falling back to English and then a default. */
export function pickContent(
  content: Record<string, Record<string, string>>,
  key: string,
  locale: string,
  fallback = ""
): string {
  const byLocale = content[key];
  if (!byLocale) return fallback;
  return byLocale[locale]?.trim() || byLocale.en?.trim() || fallback;
}

/** Convenience hook: admin-authored text for the current locale. */
export function useSiteContent(locale: string) {
  const [content, setContent] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchSiteContent().then((map) => {
      if (!active) return;
      setContent(map);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const text = (key: string, fallback = "") => pickContent(content, key, locale, fallback);

  return { content, text, isLoading };
}
