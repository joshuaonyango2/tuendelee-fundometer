import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toEmbedUrl } from "@/lib/impactMedia";
import { fetchSiteContent, pickContent } from "@/lib/siteContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { Play, Youtube, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelVideo {
  id: string;
  title: string;
  description: string | null;
  url: string;
  embedUrl: string | null;
  thumbnail: string | null;
}

/** Pull the YouTube video id out of a watch, short or embed link. */
function youtubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return parsed.pathname.slice(1) || null;
    if (host.endsWith("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/")[2] || null;
      if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/")[2] || null;
      return parsed.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}

export function YouTubeChannelPicker({ className }: { className?: string }) {
  const { language } = useLanguage();
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channelUrl, setChannelUrl] = useState<string>("");
  const [channelName, setChannelName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [content, storiesResult] = await Promise.all([
        fetchSiteContent(),
        supabase
          .from("impact_stories")
          .select("id, title, description, title_it, description_it, title_fr, description_fr, media_url, media_type, sort_order")
          .eq("is_active", true)
          .eq("media_type", "youtube")
          .order("sort_order", { ascending: true }),
      ]);

      if (!active) return;

      setChannelUrl(pickContent(content, "youtube_channel_url", language, ""));
      setChannelName(
        pickContent(content, "youtube_channel_name", language, "Tuendelee Foundation on YouTube")
      );

      if (storiesResult.error) {
        console.error("Failed to load channel videos", storiesResult.error.message);
      }

      const list: ChannelVideo[] = (storiesResult.data ?? [])
        .filter((story) => !!story.media_url)
        .map((story) => {
          const url = story.media_url as string;
          const vid = youtubeId(url);
          const localizedTitle =
            (language === "it" && story.title_it) ||
            (language === "fr" && story.title_fr) ||
            story.title;
          const localizedDescription =
            (language === "it" && story.description_it) ||
            (language === "fr" && story.description_fr) ||
            story.description;
          return {
            id: story.id,
            title: localizedTitle as string,
            description: localizedDescription as string | null,
            url,
            embedUrl: toEmbedUrl(url),
            thumbnail: vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : null,
          };
        });

      setVideos(list);
      setSelectedId(list[0]?.id ?? null);
      setIsLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [language]);

  const selected = useMemo(
    () => videos.find((v) => v.id === selectedId) ?? videos[0] ?? null,
    [videos, selectedId]
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center text-muted-foreground">Loading videos…</CardContent>
      </Card>
    );
  }

  if (!channelUrl && videos.length === 0) return null;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Youtube className="h-6 w-6 text-destructive" />
              {channelName}
            </CardTitle>
            <CardDescription className="text-base">
              Pick any video from our channel and watch it right here before you pledge.
            </CardDescription>
          </div>
          {channelUrl && (
            <Button variant="outline" asChild>
              <a href={channelUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit our channel
              </a>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {selected?.embedUrl ? (
          <div className="space-y-3">
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted shadow-lg">
              <iframe
                key={selected.id}
                src={`${selected.embedUrl}?autoplay=0&rel=0`}
                title={selected.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{selected.title}</h3>
              {selected.description && (
                <p className="mt-1 text-base text-muted-foreground">{selected.description}</p>
              )}
            </div>
          </div>
        ) : (
          channelUrl && (
            <p className="text-base text-muted-foreground">
              No videos have been added yet — browse the full channel using the button above.
            </p>
          )
        )}

        {videos.length > 1 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {videos.length} videos
              </Badge>
              <span className="text-base font-medium text-muted-foreground">Choose what to watch</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {videos.map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => setSelectedId(video.id)}
                  aria-pressed={video.id === selected?.id}
                  className={cn(
                    "group overflow-hidden rounded-lg border text-left transition-all hover:-translate-y-0.5 hover:shadow-lg",
                    video.id === selected?.id ? "border-primary ring-2 ring-primary/40" : "border-border"
                  )}
                >
                  <div className="relative aspect-video bg-muted">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={`Thumbnail for ${video.title}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Youtube className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-foreground/25 opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="h-8 w-8 text-background" />
                    </span>
                  </div>
                  <p className="line-clamp-2 p-2 text-sm font-semibold text-foreground">{video.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
