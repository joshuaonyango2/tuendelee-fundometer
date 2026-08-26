import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Save, Trash2, Eye, EyeOff, Pencil, X } from "lucide-react";
import {
  SITE_CONTENT_KEYS,
  SITE_CONTENT_LOCALES,
  type SiteContentRow,
} from "@/lib/siteContent";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  it: "Italiano",
  fr: "Français",
  sw: "Kiswahili",
};

const emptyForm = {
  id: null as string | null,
  content_key: "",
  locale: "en",
  value: "",
  is_hidden: false,
  sort_order: 0,
};

export function SiteContentEditor() {
  const [rows, setRows] = useState<SiteContentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [localeFilter, setLocaleFilter] = useState<string>("all");

  const loadRows = async () => {
    const { data, error } = await supabase
      .from("site_content")
      .select("*")
      .order("content_key", { ascending: true })
      .order("locale", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("Failed to load site content");
    } else {
      setRows((data ?? []) as SiteContentRow[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void loadRows();
  }, []);

  const filtered = useMemo(
    () => (localeFilter === "all" ? rows : rows.filter((r) => r.locale === localeFilter)),
    [rows, localeFilter]
  );

  const resetForm = () => setForm(emptyForm);

  const save = async () => {
    const key = form.content_key.trim();
    if (!key) {
      toast.error("Enter a content key");
      return;
    }
    if (key.length > 120) {
      toast.error("Content key is too long (max 120 characters)");
      return;
    }
    if (form.value.length > 5000) {
      toast.error("Text is too long (max 5000 characters)");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        content_key: key,
        locale: form.locale,
        value: form.value,
        is_hidden: form.is_hidden,
        sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
      };

      const { error } = form.id
        ? await supabase.from("site_content").update(payload).eq("id", form.id)
        : await supabase.from("site_content").upsert(payload, { onConflict: "content_key,locale" });

      if (error) throw error;

      toast.success("Updated successfully");
      resetForm();
      await loadRows();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save content";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleHidden = async (row: SiteContentRow) => {
    const { error } = await supabase
      .from("site_content")
      .update({ is_hidden: !row.is_hidden })
      .eq("id", row.id);
    if (error) {
      toast.error("Failed to update visibility");
      return;
    }
    toast.success(row.is_hidden ? "Text is now visible" : "Text is now hidden");
    await loadRows();
  };

  const remove = async (row: SiteContentRow) => {
    if (!window.confirm(`Delete "${row.content_key}" (${row.locale})?`)) return;
    const { error } = await supabase.from("site_content").delete().eq("id", row.id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Deleted");
    await loadRows();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{form.id ? "Edit text" : "Add or update text"}</CardTitle>
          <CardDescription>
            Everything donors read can be written here, in each language. Saved text overrides the
            built-in wording; hidden text falls back to the default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="content_key">Content key *</Label>
              <Input
                id="content_key"
                list="site-content-keys"
                value={form.content_key}
                onChange={(e) => setForm({ ...form, content_key: e.target.value })}
                placeholder="youtube_channel_url"
              />
              <datalist id="site-content-keys">
                {SITE_CONTENT_KEYS.map((k) => (
                  <option key={k.key} value={k.key}>
                    {k.label}
                  </option>
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                {SITE_CONTENT_KEYS.find((k) => k.key === form.content_key.trim())?.hint ??
                  "Pick a suggested key or create your own."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locale">Language</Label>
              <Select value={form.locale} onValueChange={(value) => setForm({ ...form, locale: value })}>
                <SelectTrigger id="locale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SITE_CONTENT_LOCALES.map((locale) => (
                    <SelectItem key={locale} value={locale}>
                      {LOCALE_LABELS[locale]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Text shown to donors</Label>
            <Textarea
              id="value"
              rows={5}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder="Write exactly what donors should see…"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Switch
                id="is_hidden"
                checked={form.is_hidden}
                onCheckedChange={(checked) => setForm({ ...form, is_hidden: checked })}
              />
              <Label htmlFor="is_hidden">Hide this text</Label>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="sort_order">Order</Label>
              <Input
                id="sort_order"
                type="number"
                className="w-24"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={save} disabled={isSaving}>
              {form.id ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {isSaving ? "Saving…" : form.id ? "Save changes" : "Save text"}
            </Button>
            {form.id && (
              <Button variant="outline" onClick={resetForm}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>All editable text</CardTitle>
            <CardDescription>{rows.length} entries</CardDescription>
          </div>
          <Select value={localeFilter} onValueChange={setLocaleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All languages</SelectItem>
              {SITE_CONTENT_LOCALES.map((locale) => (
                <SelectItem key={locale} value={locale}>
                  {LOCALE_LABELS[locale]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground">
              Nothing saved yet — add your first piece of text above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Text</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.content_key}</TableCell>
                      <TableCell>{LOCALE_LABELS[row.locale] ?? row.locale}</TableCell>
                      <TableCell className="max-w-md truncate">{row.value}</TableCell>
                      <TableCell>
                        <Badge variant={row.is_hidden ? "outline" : "secondary"}>
                          {row.is_hidden ? "Hidden" : "Live"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setForm({
                                id: row.id,
                                content_key: row.content_key,
                                locale: row.locale,
                                value: row.value,
                                is_hidden: row.is_hidden,
                                sort_order: row.sort_order,
                              })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggleHidden(row)}>
                            {row.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => remove(row)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
