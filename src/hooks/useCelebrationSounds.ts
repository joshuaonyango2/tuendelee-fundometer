import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  applyCelebrationSettings,
  isCelebrationMuted,
  isCelebrationSoundPlaying,
  playCelebrationAudio,
  type Milestone,
} from "@/lib/celebrate";
import { fetchCelebrationSettings } from "@/lib/celebrationSettings";

export const CELEBRATION_BUCKET = "celebration-sounds";

type SoundEntry = { type: "upload" | "youtube"; url: string };

/** Turn a YouTube watch/short link into an autoplaying embed URL. */
export function toAutoplayEmbed(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = parsed.pathname.slice(1);
    else if (host.endsWith("youtube.com")) {
      id = parsed.pathname.startsWith("/embed/")
        ? parsed.pathname.split("/")[2]
        : parsed.searchParams.get("v");
    }
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}?autoplay=1&controls=0&modestbranding=1&rel=0`;
  } catch {
    return null;
  }
}

/**
 * Loads the admin-configured celebration sounds and volume/mute settings.
 * Returns a `play` function that reports whether it handled the sound — when it
 * returns false the caller should fall back to the built-in ululation + clapping.
 */
export function useCelebrationSounds() {
  const [sounds, setSounds] = useState<Partial<Record<Milestone, SoundEntry>>>({});
  const [youtubeEmbed, setYoutubeEmbed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const settings = await fetchCelebrationSettings();
      if (!cancelled) applyCelebrationSettings(settings);

      const { data, error } = await supabase
        .from("celebration_sounds")
        .select("milestone, source_type, audio_path, youtube_url")
        .eq("is_active", true);

      if (error || !data || cancelled) return;

      const next: Partial<Record<Milestone, SoundEntry>> = {};
      for (const row of data) {
        const milestone = row.milestone as Milestone;
        if (row.source_type === "youtube" && row.youtube_url) {
          const embed = toAutoplayEmbed(row.youtube_url);
          if (embed) next[milestone] = { type: "youtube", url: embed };
        } else if (row.audio_path) {
          const { data: signed } = await supabase.storage
            .from(CELEBRATION_BUCKET)
            .createSignedUrl(row.audio_path, 60 * 60 * 6);
          if (signed?.signedUrl) next[milestone] = { type: "upload", url: signed.signedUrl };
        }
      }
      if (!cancelled) setSounds(next);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const play = useCallback(
    (milestone: Milestone) => {
      if (isCelebrationMuted()) return true; // muted by the admin: nothing plays
      const entry = sounds[milestone];
      if (!entry) return false;

      // Never stack celebrations on top of each other.
      if (isCelebrationSoundPlaying() || youtubeEmbed) return true;

      if (entry.type === "youtube") {
        setYoutubeEmbed(entry.url);
        window.setTimeout(() => setYoutubeEmbed(null), 20000);
        return true;
      }

      return playCelebrationAudio(entry.url);
    },
    [sounds, youtubeEmbed]
  );

  return { play, youtubeEmbed };
}
