import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PencilLine, RotateCcw, Save } from "lucide-react";
import { EVENT_TEXT_GROUPS } from "@/lib/eventCustomTexts";

interface EventTextsEditorProps {
  eventId: string;
  onSaved?: () => void;
}

export function EventTextsEditor({ eventId, onSaved }: EventTextsEditorProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("event_custom_texts")
        .select("text_key, value")
        .eq("event_id", eventId);

      if (error) {
        console.error(error);
        toast.error("Failed to load custom texts");
      } else {
        setValues(Object.fromEntries((data ?? []).map((row) => [row.text_key, row.value])));
      }
      setIsLoading(false);
    };
    void load();
  }, [eventId]);

  const setValue = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const upserts = Object.entries(values)
        .filter(([, v]) => v.trim().length > 0)
        .map(([text_key, value]) => ({ event_id: eventId, text_key, value: value.trim() }));

      if (upserts.length > 0) {
        const { error } = await supabase
          .from("event_custom_texts")
          .upsert(upserts, { onConflict: "event_id,text_key" });
        if (error) throw error;
      }

      // Empty boxes remove the override so the original wording returns
      const cleared = Object.entries(values)
        .filter(([, v]) => v.trim().length === 0)
        .map(([k]) => k);
      if (cleared.length > 0) {
        const { error } = await supabase
          .from("event_custom_texts")
          .delete()
          .eq("event_id", eventId)
          .in("text_key", cleared);
        if (error) throw error;
      }

      toast.success("Updated successfully — the new wording is live right away");
      onSaved?.();
    } catch (error: any) {
      console.error("Error saving custom texts:", error);
      toast.error(error?.message || "Failed to save custom texts");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAll = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("event_custom_texts")
        .delete()
        .eq("event_id", eventId);
      if (error) throw error;
      setValues({});
      toast.success("All texts restored to the original wording");
      onSaved?.();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to reset texts");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading custom texts...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PencilLine className="w-5 h-5 text-primary" />
          Edit Any Text on This Event
        </CardTitle>
        <CardDescription>
          Change the wording of any heading or explanation on this event — including the donor event
          room and every admin tab. Leave a box empty to keep the original wording shown in grey.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {EVENT_TEXT_GROUPS.map((group) => (
          <div key={group.group} className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">{group.group}</h3>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {group.fields.map((field) => (
                <div key={field.key} className={`space-y-2 ${field.multiline ? "md:col-span-2" : ""}`}>
                  <Label htmlFor={`et-${field.key}`}>{field.label}</Label>
                  {field.multiline ? (
                    <Textarea
                      id={`et-${field.key}`}
                      rows={field.key === "verify.rules" ? 5 : 3}
                      value={values[field.key] ?? ""}
                      placeholder={field.defaultValue}
                      onChange={(e) => setValue(field.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      id={`et-${field.key}`}
                      value={values[field.key] ?? ""}
                      placeholder={field.defaultValue}
                      onChange={(e) => setValue(field.key, e.target.value)}
                    />
                  )}
                  {field.hint && (
                    <p className="text-xs text-muted-foreground">{field.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Custom Texts"}
          </Button>
          <Button variant="outline" onClick={handleResetAll} disabled={isSaving}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restore Original Wording
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
