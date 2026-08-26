import { supabase } from "@/integrations/supabase/client";

export const CELEBRATION_MUTED_KEY = "celebration_muted";
export const CELEBRATION_VOLUME_KEY = "celebration_volume";

export interface CelebrationSettings {
  muted: boolean;
  /** 0 – 1 playback volume applied to uploaded audio and the default cheer. */
  volume: number;
}

export const DEFAULT_CELEBRATION_SETTINGS: CelebrationSettings = {
  muted: false,
  volume: 0.8,
};

function clampVolume(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_CELEBRATION_SETTINGS.volume;
  return Math.min(1, Math.max(0, value));
}

/** Read the admin-controlled celebration settings from site_content. */
export async function fetchCelebrationSettings(): Promise<CelebrationSettings> {
  const { data, error } = await supabase
    .from("site_content")
    .select("content_key, value")
    .in("content_key", [CELEBRATION_MUTED_KEY, CELEBRATION_VOLUME_KEY])
    .eq("locale", "en");

  if (error || !data) return DEFAULT_CELEBRATION_SETTINGS;

  const map = new Map(data.map((row) => [row.content_key, row.value]));
  return {
    muted: map.get(CELEBRATION_MUTED_KEY) === "true",
    volume: clampVolume(parseFloat(map.get(CELEBRATION_VOLUME_KEY) ?? "")),
  };
}

/** Admin-only write of the celebration settings. */
export async function saveCelebrationSettings(settings: CelebrationSettings) {
  const entries: { content_key: string; value: string }[] = [
    { content_key: CELEBRATION_MUTED_KEY, value: settings.muted ? "true" : "false" },
    { content_key: CELEBRATION_VOLUME_KEY, value: String(clampVolume(settings.volume)) },
  ];

  for (const entry of entries) {
    const { data: existing } = await supabase
      .from("site_content")
      .select("id")
      .eq("content_key", entry.content_key)
      .eq("locale", "en")
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from("site_content")
        .update({ value: entry.value })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("site_content")
        .insert({ content_key: entry.content_key, locale: "en", value: entry.value, is_hidden: true });
      if (error) throw error;
    }
  }
}
