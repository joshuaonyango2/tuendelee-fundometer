import { supabase } from "@/integrations/supabase/client";

export const IMPACT_BUCKET = "impact-media";

/**
 * Stored values are either a full external link (YouTube/Vimeo/any URL)
 * or a path inside the private impact-media bucket. Paths are resolved to
 * temporary signed URLs so visitors can view them.
 */
export async function resolveMediaUrl(value?: string | null): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;

  const { data, error } = await supabase.storage
    .from(IMPACT_BUCKET)
    .createSignedUrl(value, 60 * 60);

  if (error) {
    console.error("Failed to sign impact media URL", error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}

/** Convert a YouTube or Vimeo watch link into an embeddable URL. */
export function toEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    }
    if (host.endsWith("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) return url;
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (host.endsWith("vimeo.com")) {
      if (host.startsWith("player.")) return url;
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }
    return url;
  } catch {
    return null;
  }
}
