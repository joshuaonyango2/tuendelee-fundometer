import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, ExternalLink, Save, Video } from "lucide-react";

interface EventMeetingLinkEditorProps {
  eventId: string;
  initialLink: string;
  initialPasscode: string;
  onSaved?: () => void;
}

export function EventMeetingLinkEditor({
  eventId,
  initialLink,
  initialPasscode,
  onSaved,
}: EventMeetingLinkEditorProps) {
  const [link, setLink] = useState(initialLink);
  const [passcode, setPasscode] = useState(initialPasscode);
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    const trimmed = link.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      toast.error("Enter a full link starting with https://");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("fundraising_events")
        .update({
          meeting_link: trimmed || null,
          meeting_passcode: passcode.trim() || null,
        })
        .eq("id", eventId);

      if (error) throw error;
      toast.success("Updated successfully — donors will now see this meeting link");
      onSaved?.();
    } catch (error: any) {
      toast.error("Failed to save meeting link: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Video className="h-4 w-4 text-primary" />
        <p className="font-semibold">Meeting link donors will use</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3">
        <div className="space-y-1">
          <Label htmlFor={`link-${eventId}`}>Zoom / Meet / Teams link</Label>
          <Input
            id={`link-${eventId}`}
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://zoom.us/j/1234567890"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`pass-${eventId}`}>Passcode (optional)</Label>
          <Input
            id={`pass-${eventId}`}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="e.g. 458291"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={save} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save meeting link"}
        </Button>
        {link.trim() && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => window.open(link.trim(), "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-4 w-4" />
              Join as host
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-2"
              onClick={() => {
                navigator.clipboard.writeText(link.trim());
                toast.success("Meeting link copied");
              }}
            >
              <Copy className="h-4 w-4" />
              Copy link
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
