import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { defaultEventText } from "@/lib/eventCustomTexts";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Loads the admin's custom text overrides for an event.
 * - `text(key)` returns the override, or the built-in default wording.
 * - `custom(key)` returns the override only (undefined when not customised) —
 *   useful when the component should fall back to a translation instead.
 */
export function useEventTexts(eventId: string | undefined) {
  const { tr } = useLanguage();
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("event_custom_texts")
        .select("text_key, value")
        .eq("event_id", eventId);

      if (!cancelled && !error && data) {
        setOverrides(Object.fromEntries(data.map((row) => [row.text_key, row.value])));
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const text = useCallback(
    (key: string) => tr(overrides[key] ?? defaultEventText(key)),
    [overrides, tr]
  );

  const custom = useCallback(
    (key: string) => (overrides[key] ? tr(overrides[key]) : undefined),
    [overrides, tr]
  );

  return { text, custom, overrides };
}
