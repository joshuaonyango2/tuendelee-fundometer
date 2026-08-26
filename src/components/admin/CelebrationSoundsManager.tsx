import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "@/components/ui/slider";
import { CELEBRATION_BUCKET, toAutoplayEmbed } from "@/hooks/useCelebrationSounds";
import {
  applyCelebrationSettings,
  MILESTONES,
  playCelebrationAudio,
  playDefaultCelebration,
  stopCelebrationSound,
  type Milestone,
} from "@/lib/celebrate";
import {
  DEFAULT_CELEBRATION_SETTINGS,
  fetchCelebrationSettings,
  saveCelebrationSettings,
  type CelebrationSettings,
} from "@/lib/celebrationSettings";
import { toast } from "sonner";
import { Music, Play, Save, Square, Trash2, Upload, Volume2, VolumeX, Youtube } from "lucide-react";

interface SoundRow {
  id: string;
  milestone: number;
  source_type: string;
  audio_path: string | null;
  youtube_url: string | null;
  label: string | null;
  is_active: boolean;
}

const MILESTONE_TITLES: Record<Milestone, string> = {
  25: "Quarter of the goal (25%)",
  50: "Halfway (50%)",
  75: "Three quarters (75%)",
  100: "Goal reached (100%)",
};

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4", "audio/aac"];

export function CelebrationSoundsManager() {
  const [rows, setRows] = useState<Record<number, SoundRow>>({});
  const [drafts, setDrafts] = useState<Record<number, { source_type: string; youtube_url: string; label: string; is_active: boolean }>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<CelebrationSettings>(DEFAULT_CELEBRATION_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("celebration_sounds")
      .select("id, milestone, source_type, audio_path, youtube_url, label, is_active");

    if (error) {
      toast.error("Could not load celebration sounds");
      setLoading(false);
      return;
    }

    const map: Record<number, SoundRow> = {};
    const draft: typeof drafts = {};
    for (const row of data ?? []) {
      map[row.milestone] = row as SoundRow;
      draft[row.milestone] = {
        source_type: row.source_type,
        youtube_url: row.youtube_url ?? "",
        label: row.label ?? "",
        is_active: row.is_active,
      };
    }
    for (const m of MILESTONES) {
      if (!draft[m]) draft[m] = { source_type: "upload", youtube_url: "", label: "", is_active: true };
    }
    setRows(map);
    setDrafts(draft);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    void fetchCelebrationSettings().then((s) => {
      setSettings(s);
      applyCelebrationSettings(s);
    });
    return () => stopCelebrationSound();
  }, []);

  const updateSettings = (patch: Partial<CelebrationSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      applyCelebrationSettings(next);
      return next;
    });
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await saveCelebrationSettings(settings);
      applyCelebrationSettings(settings);
      toast.success("Updated successfully");
    } catch {
      toast.error("Could not save the celebration settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const upsert = async (milestone: Milestone, patch: Record<string, unknown>) => {
    const draft = drafts[milestone];
    const payload = {
      milestone,
      source_type: draft.source_type,
      youtube_url: draft.source_type === "youtube" ? draft.youtube_url.trim() || null : null,
      label: draft.label.trim() || null,
      is_active: draft.is_active,
      ...patch,
    };

    const { error } = await supabase
      .from("celebration_sounds")
      .upsert(payload, { onConflict: "milestone" });

    if (error) throw error;
  };

  const handleSave = async (milestone: Milestone) => {
    const draft = drafts[milestone];
    if (draft.source_type === "youtube") {
      if (!draft.youtube_url.trim()) {
        toast.error("Paste a YouTube link first");
        return;
      }
      if (!toAutoplayEmbed(draft.youtube_url.trim())) {
        toast.error("That does not look like a valid YouTube link");
        return;
      }
    } else if (!rows[milestone]?.audio_path) {
      toast.error("Upload an audio file first");
      return;
    }

    setBusy(milestone);
    try {
      await upsert(milestone, {});
      toast.success("Updated successfully");
      await load();
    } catch {
      toast.error("Could not save this sound");
    } finally {
      setBusy(null);
    }
  };

  const handleUpload = async (milestone: Milestone, file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error("Audio must be 10MB or smaller");
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      toast.error("Use an MP3, WAV, OGG or M4A audio file");
      return;
    }

    setBusy(milestone);
    try {
      const ext = file.name.split(".").pop() ?? "mp3";
      const path = `milestone-${milestone}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(CELEBRATION_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      setDrafts((d) => ({ ...d, [milestone]: { ...d[milestone], source_type: "upload" } }));
      await upsert(milestone, { source_type: "upload", audio_path: path, youtube_url: null });
      toast.success("Updated successfully");
      await load();
    } catch {
      toast.error("Upload failed, please try again");
    } finally {
      setBusy(null);
    }
  };

  const handlePreview = async (milestone: Milestone) => {
    stopCelebrationSound();
    if (settings.muted) {
      toast.info("Celebration sounds are muted — unmute above to hear the preview");
      return;
    }
    const row = rows[milestone];
    if (!row || (row.source_type === "upload" && !row.audio_path)) {
      playDefaultCelebration(milestone);
      return;
    }
    if (row.source_type === "youtube" && row.youtube_url) {
      window.open(row.youtube_url, "_blank", "noopener,noreferrer");
      return;
    }
    const { data } = await supabase.storage
      .from(CELEBRATION_BUCKET)
      .createSignedUrl(row.audio_path as string, 300);
    if (data?.signedUrl) playCelebrationAudio(data.signedUrl);
    else toast.error("Could not load that audio file");
  };

  const handleRemove = async (milestone: Milestone) => {
    const row = rows[milestone];
    if (!row) return;
    setBusy(milestone);
    try {
      if (row.audio_path) {
        await supabase.storage.from(CELEBRATION_BUCKET).remove([row.audio_path]);
      }
      const { error } = await supabase.from("celebration_sounds").delete().eq("id", row.id);
      if (error) throw error;
      toast.success("Removed — the default ululation and clapping will play");
      await load();
    } catch {
      toast.error("Could not remove this sound");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Celebration Sounds
        </CardTitle>
        <CardDescription>
          Choose the sound that plays when the thermometer hits each level. Upload your own audio or
          paste a YouTube link. If a level has no sound, the default ululation mixed with clapping plays.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Admin-only playback controls */}
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-bold flex items-center gap-2">
                {settings.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                Playback controls
              </h4>
              <p className="text-sm text-muted-foreground">
                Only you (the admin) control this. Donors cannot mute or change the volume.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="celebration-mute" className="text-sm">
                {settings.muted ? "Muted" : "Sound on"}
              </Label>
              <Switch
                id="celebration-mute"
                checked={!settings.muted}
                onCheckedChange={(on) => updateSettings({ muted: !on })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="celebration-volume">
              Celebration volume — {Math.round(settings.volume * 100)}%
            </Label>
            <Slider
              id="celebration-volume"
              value={[Math.round(settings.volume * 100)]}
              min={0}
              max={100}
              step={5}
              disabled={settings.muted}
              onValueChange={([v]) => updateSettings({ volume: v / 100 })}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              <Save className="mr-2 h-4 w-4" /> Save settings
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                stopCelebrationSound();
                if (settings.muted) {
                  toast.info("Celebration sounds are muted — unmute to hear the preview");
                  return;
                }
                playDefaultCelebration(100);
              }}
            >
              <Play className="mr-2 h-4 w-4" /> Preview default ululation &amp; clapping
            </Button>
            <Button variant="ghost" onClick={() => stopCelebrationSound()}>
              <Square className="mr-2 h-4 w-4" /> Stop
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading celebration sounds…</p>
        ) : (
          MILESTONES.map((milestone) => {
            const row = rows[milestone];
            const draft = drafts[milestone];
            const isBusy = busy === milestone;

            return (
              <div key={milestone} className="rounded-xl border border-border bg-card p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold">{MILESTONE_TITLES[milestone]}</h4>
                    {row ? (
                      <Badge variant={row.is_active ? "default" : "secondary"}>
                        {row.source_type === "youtube" ? "YouTube" : "Uploaded audio"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Default clapping</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${milestone}`} className="text-sm">
                      Active
                    </Label>
                    <Switch
                      id={`active-${milestone}`}
                      checked={draft.is_active}
                      onCheckedChange={(checked) =>
                        setDrafts((d) => ({ ...d, [milestone]: { ...d[milestone], is_active: checked } }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Sound source</Label>
                    <Select
                      value={draft.source_type}
                      onValueChange={(value) =>
                        setDrafts((d) => ({ ...d, [milestone]: { ...d[milestone], source_type: value } }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upload">Uploaded audio file</SelectItem>
                        <SelectItem value="youtube">YouTube link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`label-${milestone}`}>Name (optional)</Label>
                    <Input
                      id={`label-${milestone}`}
                      value={draft.label}
                      placeholder="e.g. Ululation & drums"
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [milestone]: { ...d[milestone], label: e.target.value } }))
                      }
                    />
                  </div>
                </div>

                {draft.source_type === "youtube" ? (
                  <div className="space-y-2">
                    <Label htmlFor={`yt-${milestone}`} className="flex items-center gap-2">
                      <Youtube className="h-4 w-4" /> YouTube link
                    </Label>
                    <Input
                      id={`yt-${milestone}`}
                      value={draft.youtube_url}
                      placeholder="https://www.youtube.com/watch?v=..."
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [milestone]: { ...d[milestone], youtube_url: e.target.value } }))
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor={`file-${milestone}`} className="flex items-center gap-2">
                      <Upload className="h-4 w-4" /> Audio file (MP3, WAV, OGG, M4A — max 10MB)
                    </Label>
                    <Input
                      id={`file-${milestone}`}
                      type="file"
                      accept="audio/*"
                      disabled={isBusy}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUpload(milestone, file);
                        e.target.value = "";
                      }}
                    />
                    {row?.audio_path && (
                      <p className="text-sm text-muted-foreground break-all">Current file: {row.audio_path}</p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => handleSave(milestone)} disabled={isBusy}>
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>
                  <Button variant="outline" onClick={() => handlePreview(milestone)} disabled={isBusy}>
                    <Play className="mr-2 h-4 w-4" /> Preview sound
                  </Button>
                  <Button variant="ghost" onClick={() => stopCelebrationSound()}>
                    <Square className="mr-2 h-4 w-4" /> Stop
                  </Button>
                  {row && (
                    <Button variant="destructive" onClick={() => handleRemove(milestone)} disabled={isBusy}>
                      <Trash2 className="mr-2 h-4 w-4" /> Use default
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
