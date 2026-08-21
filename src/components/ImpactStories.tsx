import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { resolveMediaUrl, toEmbedUrl } from "@/lib/impactMedia";

interface ImpactStory {
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
  sort_order: number;
}

interface ResolvedStory extends ImpactStory {
  resolvedMedia: string | null;
  resolvedImage: string | null;
  resolvedAudio: string | null;
}

export function ImpactStories() {
  const { language, t } = useLanguage();
  const [stories, setStories] = useState<ResolvedStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("impact_stories")
        .select(
          "id, title, description, title_it, description_it, title_fr, description_fr, media_type, media_url, image_url, audio_url, sort_order",
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load impact stories:", error.message);
        if (!cancelled) setIsLoading(false);
        return;
      }

      const resolved = await Promise.all(
        (data ?? []).map(async (story) => ({
          ...(story as ImpactStory),
          resolvedMedia:
            story.media_type === "youtube"
              ? toEmbedUrl(story.media_url)
              : await resolveMediaUrl(story.media_url),
          resolvedImage: await resolveMediaUrl(story.image_url),
          resolvedAudio: await resolveMediaUrl(story.audio_url),
        })),
      );

      if (!cancelled) {
        setStories(resolved);
        setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const localized = (story: ResolvedStory) => {
    if (language === "it") {
      return {
        title: story.title_it || story.title,
        description: story.description_it || story.description,
      };
    }
    if (language === "fr") {
      return {
        title: story.title_fr || story.title,
        description: story.description_fr || story.description,
      };
    }
    return { title: story.title, description: story.description };
  };

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 pb-10" aria-busy="true">
        <p className="text-center text-muted-foreground">{t("impact.loading")}</p>
      </section>
    );
  }

  if (stories.length === 0) return null;

  return (
    <section className="container mx-auto px-4 pb-10">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">{t("impact.sectionTitle")}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t("impact.sectionSubtitle")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
        {stories.map((story, index) => {
          const { title, description } = localized(story);
          const featured = index === 0 && stories.length % 2 === 1;

          return (
            <Card
              key={story.id}
              className={`overflow-hidden shadow-lg border-primary/10 ${
                featured ? "md:col-span-2" : ""
              }`}
            >
              <div className="bg-muted">
                {story.media_type === "youtube" && story.resolvedMedia && (
                  <div className="aspect-video">
                    <iframe
                      src={story.resolvedMedia}
                      title={title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                )}

                {story.media_type === "video" && story.resolvedMedia && (
                  <video
                    src={story.resolvedMedia}
                    poster={story.resolvedImage ?? undefined}
                    controls
                    preload="metadata"
                    className="w-full aspect-video bg-black"
                  />
                )}

                {(story.media_type === "image" || story.media_type === "audio") &&
                  story.resolvedImage && (
                    <img
                      src={story.resolvedImage}
                      alt={title}
                      loading="lazy"
                      className="w-full max-h-96 object-cover"
                    />
                  )}
              </div>

              <CardContent className="pt-4 space-y-3">
                <h3 className="text-lg font-bold">{title}</h3>
                {description && (
                  <p className="text-base text-muted-foreground whitespace-pre-line">
                    {description}
                  </p>
                )}

                {story.resolvedAudio && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t("impact.listen")}</p>
                    <audio src={story.resolvedAudio} controls className="w-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
