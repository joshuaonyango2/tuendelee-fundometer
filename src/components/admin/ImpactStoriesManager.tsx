import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { IMPACT_BUCKET } from "@/lib/impactMedia";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Save, X, Pencil } from "lucide-react";
import { z } from "zod";

type MediaType = "youtube" | "video" | "audio" | "image";

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
  is_active: boolean;
  sort_order: number;
}

const storySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(150, "Title must be under 150 characters"),
  description: z.string().trim().max(2000, "Description must be under 2000 characters"),
  media_url: z.string().trim().max(500, "Link is too long"),
});

const emptyForm = {
  title: "",
  description: "",
  title_it: "",
  description_it: "",
  title_fr: "",
  description_fr: "",
  media_type: "youtube" as MediaType,
  media_url: "",
  image_url: "",
  audio_url: "",
  is_active: true,
  sort_order: 0,
};

export function ImpactStoriesManager() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const loadStories = async () => {
    const { data, error } = await supabase
      .from("impact_stories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(`Could not load impact stories: ${error.message}`);
    } else {
      setStories((data ?? []) as Story[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadStories();
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (story: Story) => {
    setForm({
      title: story.title,
      description: story.description ?? "",
      title_it: story.title_it ?? "",
      description_it: story.description_it ?? "",
      title_fr: story.title_fr ?? "",
      description_fr: story.description_fr ?? "",
      media_type: (story.media_type as MediaType) ?? "youtube",
      media_url: story.media_url ?? "",
      image_url: story.image_url ?? "",
      audio_url: story.audio_url ?? "",
      is_active: story.is_active,
      sort_order: story.sort_order,
    });
    setEditingId(story.id);
    setShowForm(true);
  };

  const handleUpload = async (
    field: "media_url" | "image_url" | "audio_url",
    file: File,
  ) => {
    const maxBytes = 200 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("File is too large. Maximum size is 200 MB.");
      return;
    }

    setUploading(field);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${crypto.randomUUID()}-${safeName}`;

    const { error } = await supabase.storage
      .from(IMPACT_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    setUploading(null);

    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return;
    }

    setForm((prev) => ({ ...prev, [field]: path }));
    toast.success("File uploaded");
  };

  const handleSave = async () => {
    const parsed = storySchema.safeParse({
      title: form.title,
      description: form.description,
      media_url: form.media_url,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    if (form.media_type === "youtube" && !/^https?:\/\//i.test(form.media_url.trim())) {
      toast.error("Please paste a valid video link starting with https://");
      return;
    }
    if (
      (form.media_type === "video" || form.media_type === "audio") &&
      !form.media_url.trim()
    ) {
      toast.error("Please upload the file for this story");
      return;
    }
    if (form.media_type === "image" && !form.image_url.trim()) {
      toast.error("Please upload a photo for this story");
      return;
    }

    setIsSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      title_it: form.title_it.trim() || null,
      description_it: form.description_it.trim() || null,
      title_fr: form.title_fr.trim() || null,
      description_fr: form.description_fr.trim() || null,
      media_type: form.media_type,
      media_url: form.media_url.trim() || null,
      image_url: form.image_url.trim() || null,
      audio_url: form.audio_url.trim() || null,
      is_active: form.is_active,
      sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
    };

    const { error } = editingId
      ? await supabase.from("impact_stories").update(payload).eq("id", editingId)
      : await supabase.from("impact_stories").insert(payload);

    setIsSaving(false);

    if (error) {
      toast.error(`Could not save story: ${error.message}`);
      return;
    }

    toast.success(editingId ? "Updated successfully" : "Impact story published");
    resetForm();
    loadStories();
  };

  const handleDelete = async (story: Story) => {
    if (!window.confirm(`Delete "${story.title}"? This cannot be undone.`)) return;

    const { error } = await supabase.from("impact_stories").delete().eq("id", story.id);
    if (error) {
      toast.error(`Could not delete story: ${error.message}`);
      return;
    }
    toast.success("Story deleted");
    loadStories();
  };

  const toggleActive = async (story: Story) => {
    const { error } = await supabase
      .from("impact_stories")
      .update({ is_active: !story.is_active })
      .eq("id", story.id);

    if (error) {
      toast.error(`Could not update story: ${error.message}`);
      return;
    }
    loadStories();
  };

  const uploadField = (
    field: "media_url" | "image_url" | "audio_url",
    label: string,
    accept: string,
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="file"
        accept={accept}
        disabled={uploading === field}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(field, file);
        }}
      />
      {uploading === field && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Upload className="w-4 h-4 animate-pulse" /> Uploading...
        </p>
      )}
      {form[field] && (
        <p className="text-sm text-success break-all">Attached: {form[field]}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Impact Stories</CardTitle>
            <CardDescription>
              Add a video, YouTube link, photo or photo-with-audio story. Active stories
              appear on the Fundometer home page, above the pledge button.
            </CardDescription>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              New Story
            </Button>
          )}
        </CardHeader>

        {showForm && (
          <CardContent className="space-y-4 border-t pt-6">
            <div className="space-y-2">
              <Label htmlFor="story-title">Title (English) *</Label>
              <Input
                id="story-title"
                value={form.title}
                maxLength={150}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Grace's scholarship journey"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="story-description">Story (English)</Label>
              <Textarea
                id="story-description"
                value={form.description}
                maxLength={2000}
                rows={4}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tell the story in English. Donors can read it in Italian or French if you add the translations below."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="story-title-it">Title (Italian, optional)</Label>
                <Input
                  id="story-title-it"
                  value={form.title_it}
                  maxLength={150}
                  onChange={(e) => setForm({ ...form, title_it: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="story-title-fr">Title (French, optional)</Label>
                <Input
                  id="story-title-fr"
                  value={form.title_fr}
                  maxLength={150}
                  onChange={(e) => setForm({ ...form, title_fr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="story-desc-it">Story / subtitles (Italian, optional)</Label>
                <Textarea
                  id="story-desc-it"
                  value={form.description_it}
                  maxLength={2000}
                  rows={3}
                  onChange={(e) => setForm({ ...form, description_it: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="story-desc-fr">Story / subtitles (French, optional)</Label>
                <Textarea
                  id="story-desc-fr"
                  value={form.description_fr}
                  maxLength={2000}
                  rows={3}
                  onChange={(e) => setForm({ ...form, description_fr: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Media type</Label>
              <Select
                value={form.media_type}
                onValueChange={(value) =>
                  setForm({ ...form, media_type: value as MediaType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="youtube">YouTube / Vimeo link</SelectItem>
                  <SelectItem value="video">Uploaded video file</SelectItem>
                  <SelectItem value="audio">Photo with audio narration</SelectItem>
                  <SelectItem value="image">Photo only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.media_type === "youtube" && (
              <div className="space-y-2">
                <Label htmlFor="story-link">Video link *</Label>
                <Input
                  id="story-link"
                  value={form.media_url}
                  onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            )}

            {form.media_type === "video" && (
              <>
                {uploadField("media_url", "Video file *", "video/*")}
                {uploadField("image_url", "Cover photo (optional)", "image/*")}
              </>
            )}

            {form.media_type === "audio" && (
              <>
                {uploadField("image_url", "Photo *", "image/*")}
                {uploadField("audio_url", "Audio narration *", "audio/*")}
              </>
            )}

            {form.media_type === "image" && uploadField("image_url", "Photo *", "image/*")}

            {form.media_type !== "audio" && form.media_type !== "image" && (
              uploadField("audio_url", "Audio narration (optional)", "audio/*")
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="story-order">Display order</Label>
                <Input
                  id="story-order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>
              <div className="flex items-center gap-3 pt-8">
                <Switch
                  id="story-active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
                <Label htmlFor="story-active">Show on home page</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving || !!uploading} className="gap-2">
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : editingId ? "Update Story" : "Publish Story"}
              </Button>
              <Button variant="outline" onClick={resetForm} className="gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Published stories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-muted-foreground">Loading stories...</p>
          ) : stories.length === 0 ? (
            <p className="text-muted-foreground">
              No impact stories yet. Add one so donors see it as soon as they open the app.
            </p>
          ) : (
            stories.map((story) => (
              <div
                key={story.id}
                className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{story.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {story.media_type} · order {story.sort_order}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={story.is_active ? "default" : "secondary"}>
                    {story.is_active ? "Visible" : "Hidden"}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(story)}>
                    {story.is_active ? "Hide" : "Show"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => startEdit(story)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(story)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
