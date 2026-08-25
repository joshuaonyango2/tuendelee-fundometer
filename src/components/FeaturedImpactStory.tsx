import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { resolveMediaUrl, toEmbedUrl } from "@/lib/impactMedia";

interface Story {
  id: string;
  title: string;
  description: string | null;
  title_it: string | null;
  description_it: string | null;
  title_fr: string | null;
  description_fr: string | null;
  media_type: string;
  media_url: string | null;
  image_url: string | null;
  audio_url: string | null;
}

interface Resolved extends Story {
  resolvedMedia: string | null;
  resolvedImage: string | null;
  resolvedAudio: string | null;
}

interface FeaturedImpactStoryProps {
  onDonateClick?: () => void;
}

export function FeaturedImpactStory({ onDonateClick }: FeaturedImpactStoryProps) {
  const { language, t } = useLanguage();
  const [story, setStory] = useState<Resolved | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("impact_stories")
        .select(
          "id, title, description, title_it, description_it, title_fr, description_fr, media_type, media_url, image_url, audio_url",
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      const resolved: Resolved = {
        ...(data as Story),
        resolvedMedia:
          data.media_type === "youtube"
            ? toEmbedUrl(data.media_url)
            : await resolveMediaUrl(data.media_url),
        resolvedImage: await resolveMediaUrl(data.image_url),
        resolvedAudio: await resolveMediaUrl(data.audio_url),
      };

      if (!cancelled) {
        setStory(resolved);
        setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const localized = () => {
    if (!story) return { title: "", description: null as string | null };
    if (language === "it")
      return {
        title: story.title_it || story.title,
        description: story.description_it || story.description,
      };
    if (language === "fr")
      return {
        title: story.title_fr || story.title,
        description: story.description_fr || story.description,
      };
    return { title: story.title, description: story.description };
  };

  if (isLoading || !story) return null;

  const { title, description } = localized();
  const hasVideo = story.media_type === "video" && story.resolvedMedia;
  const hasYoutube = story.media_type === "youtube" && story.resolvedMedia;
  const poster = story.resolvedImage ?? undefined;

  const start = () => {
    setIsPlaying(true);
    // let the element mount before playing
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => undefined);
    });
  };

  return (
    <div className="mb-16">
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold mb-3">{t("impact.sectionTitle")}</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">{t("impact.sectionSubtitle")}</p>
      </div>

      <Card className="overflow-hidden shadow-xl border-primary/20 max-w-4xl mx-auto">
        <div className="relative bg-black">
          {hasYoutube ? (
            isPlaying ? (
              <div className="aspect-video">
                <iframe
                  src={`${story.resolvedMedia}${story.resolvedMedia?.includes("?") ? "&" : "?"}autoplay=1&loop=1&playlist=${story.resolvedMedia?.split("/embed/")[1]?.split("?")[0] ?? ""}`}
                  title={title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={start}
                aria-label={`${t("impact.sectionTitle")}: ${title}`}
                className="group relative block w-full aspect-video"
              >
                {poster ? (
                  <img src={poster} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/40 to-success/40" />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
                  <PlayCircle className="w-20 h-20 text-primary-foreground drop-shadow-lg" />
                </span>
              </button>
            )
          ) : hasVideo ? (
            isPlaying ? (
              <video
                ref={videoRef}
                src={story.resolvedMedia ?? undefined}
                poster={poster}
                controls
                autoPlay
                loop
                playsInline
                className="w-full aspect-video bg-black"
              />
            ) : (
              <button
                type="button"
                onClick={start}
                aria-label={`${t("impact.sectionTitle")}: ${title}`}
                className="group relative block w-full aspect-video"
              >
                {poster ? (
                  <img src={poster} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/40 to-success/40" />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
                  <PlayCircle className="w-20 h-20 text-primary-foreground drop-shadow-lg" />
                </span>
              </button>
            )
          ) : (
            story.resolvedImage && (
              <img
                src={story.resolvedImage}
                alt={title}
                className="w-full max-h-[28rem] object-cover"
              />
            )
          )}
        </div>

        <CardContent className="pt-5 space-y-4">
          <h4 className="text-xl font-bold">{title}</h4>
          {description && (
            <p className="text-base text-muted-foreground whitespace-pre-line">{description}</p>
          )}

          {story.resolvedAudio && (
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("impact.listen")}</p>
              <audio src={story.resolvedAudio} controls loop className="w-full" />
            </div>
          )}

          {onDonateClick && (
            <Button size="lg" className="w-full sm:w-auto" onClick={onDonateClick}>
              <Heart className="w-4 h-4 mr-2" />
              {t("home.ctaButton")}

            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
