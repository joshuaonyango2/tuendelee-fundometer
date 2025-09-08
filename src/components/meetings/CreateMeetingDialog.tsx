import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Video, Calendar, Clock, Users, Link2, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface CreateMeetingDialogProps {
  eventId: string;
  eventTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMeetingCreated?: () => void;
}

interface ConnectedPlatform {
  id: string;
  platform_id: string;
  platform: {
    id: string;
    name: string;
    display_name: string;
  };
}

export default function CreateMeetingDialog({
  eventId,
  eventTitle,
  open,
  onOpenChange,
  onMeetingCreated
}: CreateMeetingDialogProps) {
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState<any>(null);
  
  const [meetingDetails, setMeetingDetails] = useState({
    title: `${eventTitle} - Virtual Meeting`,
    description: "",
    start_time: "",
    duration_minutes: 60
  });

  useEffect(() => {
    if (open) {
      loadConnectedPlatforms();
      // Set default start time to 1 hour from now
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      setMeetingDetails(prev => ({
        ...prev,
        start_time: defaultTime.toISOString().slice(0, 16)
      }));
    }
  }, [open, eventTitle]);

  const loadConnectedPlatforms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("admin_meeting_integrations")
        .select(`
          id,
          platform_id,
          platform:meeting_platforms(
            id,
            name,
            display_name
          )
        `)
        .eq("admin_id", user.id)
        .eq("is_connected", true);

      if (error) throw error;
      
      const platforms = data?.filter(d => d.platform) || [];
      setConnectedPlatforms(platforms as ConnectedPlatform[]);
      
      if (platforms.length > 0 && !selectedPlatform) {
        setSelectedPlatform(platforms[0].platform_id);
      }
    } catch (error) {
      console.error("Error loading platforms:", error);
      toast.error("Failed to load connected platforms");
    }
  };

  const generateMeetingId = () => {
    return `MTG-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  };

  const generatePasscode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateMeeting = async () => {
    if (!selectedPlatform) {
      toast.error("Please select a meeting platform");
      return;
    }

    setIsCreating(true);

    try {
      const platform = connectedPlatforms.find(p => p.platform_id === selectedPlatform);
      if (!platform) throw new Error("Platform not found");

      // Generate meeting details
      const meetingId = generateMeetingId();
      const passcode = generatePasscode();
      const baseUrl = window.location.origin;
      
      // Create meeting URLs based on platform
      let meetingUrl = "";
      let joinUrl = "";
      let hostUrl = "";

      switch (platform.platform.name) {
        case "zoom":
          meetingUrl = `${baseUrl}/meeting/zoom/${meetingId}`;
          joinUrl = `${meetingUrl}?pwd=${passcode}`;
          hostUrl = `${meetingUrl}?pwd=${passcode}&role=host`;
          break;
        
        case "google_meet":
          meetingUrl = `${baseUrl}/meeting/meet/${meetingId}`;
          joinUrl = meetingUrl;
          hostUrl = meetingUrl;
          break;
        
        case "teams":
          meetingUrl = `${baseUrl}/meeting/teams/${meetingId}`;
          joinUrl = meetingUrl;
          hostUrl = `${meetingUrl}?role=presenter`;
          break;
        
        case "webex":
          meetingUrl = `${baseUrl}/meeting/webex/${meetingId}`;
          joinUrl = `${meetingUrl}?pwd=${passcode}`;
          hostUrl = `${meetingUrl}?pwd=${passcode}&role=host`;
          break;
        
        default:
          meetingUrl = `${baseUrl}/meeting/${platform.platform.name}/${meetingId}`;
          joinUrl = meetingUrl;
          hostUrl = meetingUrl;
      }

      // Save meeting to database
      const { data, error } = await supabase
        .from("event_meetings")
        .insert({
          event_id: eventId,
          platform_id: selectedPlatform,
          meeting_id: meetingId,
          meeting_url: meetingUrl,
          join_url: joinUrl,
          host_url: hostUrl,
          passcode: passcode,
          start_time: meetingDetails.start_time,
          duration_minutes: meetingDetails.duration_minutes,
          status: "scheduled"
        })
        .select()
        .single();

      if (error) throw error;

      setCreatedMeeting({
        ...data,
        platform_name: platform.platform.display_name
      });

      toast.success(`Meeting created successfully on ${platform.platform.display_name}!`);
      onMeetingCreated?.();
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error("Failed to create meeting");
    } finally {
      setIsCreating(false);
    }
  };

  const copyMeetingLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Link copied to clipboard!");
    
    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  };

  const handleClose = () => {
    setCreatedMeeting(null);
    setSelectedPlatform("");
    setMeetingDetails({
      title: `${eventTitle} - Virtual Meeting`,
      description: "",
      start_time: "",
      duration_minutes: 60
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {createdMeeting ? "Meeting Created Successfully!" : "Create Virtual Meeting"}
          </DialogTitle>
          <DialogDescription>
            {createdMeeting 
              ? `Your ${createdMeeting.platform_name} meeting has been created. Share the links below with participants.`
              : "Schedule a virtual meeting for your fundraising event"
            }
          </DialogDescription>
        </DialogHeader>

        {createdMeeting ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Video className="w-5 h-5 text-primary" />
                <p className="font-medium">{createdMeeting.platform_name} Meeting</p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Meeting ID</Label>
                  <p className="font-mono text-sm">{createdMeeting.meeting_id}</p>
                </div>
                
                {createdMeeting.passcode && (
                  <div>
                    <Label className="text-sm">Passcode</Label>
                    <p className="font-mono text-lg font-semibold">{createdMeeting.passcode}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm">Start Time</Label>
                  <p className="text-sm">
                    {format(new Date(createdMeeting.start_time), "PPpp")}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm">Duration</Label>
                  <p className="text-sm">{createdMeeting.duration_minutes} minutes</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <Label>Host Link (for you)</Label>
                <div className="flex gap-2">
                  <Input value={createdMeeting.host_url} readOnly />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyMeetingLink(createdMeeting.host_url)}
                  >
                    {copiedLink ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Participant Link</Label>
                <div className="flex gap-2">
                  <Input value={createdMeeting.join_url} readOnly />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyMeetingLink(createdMeeting.join_url)}
                  >
                    {copiedLink ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {connectedPlatforms.length === 0 ? (
              <div className="p-4 border border-dashed rounded-lg text-center">
                <Video className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  No meeting platforms connected yet
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleClose();
                    // Navigate to integrations tab
                    const integrationsTab = document.querySelector('[value="integrations"]') as HTMLElement;
                    if (integrationsTab) integrationsTab.click();
                  }}
                >
                  Connect Platform
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="platform">Meeting Platform</Label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {connectedPlatforms.map((platform) => (
                        <SelectItem key={platform.platform_id} value={platform.platform_id}>
                          {platform.platform.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Meeting Title</Label>
                  <Input
                    id="title"
                    value={meetingDetails.title}
                    onChange={(e) => setMeetingDetails({ ...meetingDetails, title: e.target.value })}
                    placeholder="Enter meeting title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={meetingDetails.description}
                    onChange={(e) => setMeetingDetails({ ...meetingDetails, description: e.target.value })}
                    placeholder="Add meeting details or agenda"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={meetingDetails.start_time}
                      onChange={(e) => setMeetingDetails({ ...meetingDetails, start_time: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={meetingDetails.duration_minutes}
                      onChange={(e) => setMeetingDetails({ 
                        ...meetingDetails, 
                        duration_minutes: parseInt(e.target.value) || 60 
                      })}
                      min="15"
                      max="480"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateMeeting}
                    disabled={isCreating || !selectedPlatform}
                    className="flex-1"
                  >
                    {isCreating ? "Creating..." : "Create Meeting"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}