import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Video, Calendar, Clock, Users, Link2, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateMeetingDialogProps {
  eventId: string;
  eventTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMeetingCreated?: () => void;
}

interface Platform {
  id: string;
  name: string;
  display_name: string;
  icon_url?: string;
}

interface PlatformWithConnection extends Platform {
  is_connected: boolean;
}

export default function CreateMeetingDialog({
  eventId,
  eventTitle,
  open,
  onOpenChange,
  onMeetingCreated
}: CreateMeetingDialogProps) {
  const [allPlatforms, setAllPlatforms] = useState<PlatformWithConnection[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [meetingDetails, setMeetingDetails] = useState({
    title: `${eventTitle} - Virtual Meeting`,
    description: "",
    start_time: "",
    duration_minutes: 60,
    external_url: "",
    external_passcode: ""
  });


  useEffect(() => {
    if (open) {
      loadPlatformsAndConnections();
      // Set default start time to 1 hour from now
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      setMeetingDetails(prev => ({
        ...prev,
        start_time: defaultTime.toISOString().slice(0, 16)
      }));
    }
  }, [open, eventTitle]);

  const loadPlatformsAndConnections = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all available platforms
      const { data: platforms, error: platformsError } = await supabase
        .from("meeting_platforms")
        .select("*")
        .eq("is_active", true);

      if (platformsError) throw platformsError;

      // Load user's connected platforms
      const { data: connections, error: connectionsError } = await supabase
        .from("admin_meeting_integrations")
        .select("platform_id")
        .eq("admin_id", user.id)
        .eq("is_connected", true);

      if (connectionsError) throw connectionsError;

      // Merge platforms with connection status
      const connectedPlatformIds = new Set(connections?.map(c => c.platform_id) || []);
      const platformsWithConnection = (platforms || []).map(platform => ({
        ...platform,
        is_connected: connectedPlatformIds.has(platform.id)
      }));

      setAllPlatforms(platformsWithConnection);
      
      // Auto-select first connected platform if available
      const firstConnected = platformsWithConnection.find(p => p.is_connected);
      if (firstConnected && !selectedPlatform) {
        setSelectedPlatform(firstConnected.id);
      }
    } catch (error) {
      console.error("Error loading platforms:", error);
      toast.error("Failed to load meeting platforms");
    } finally {
      setLoading(false);
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

    const platform = allPlatforms.find(p => p.id === selectedPlatform);
    if (!platform) {
      toast.error("Selected platform not found");
      return;
    }

    const externalUrl = meetingDetails.external_url.trim();

    if (externalUrl && !/^https?:\/\/\S+$/i.test(externalUrl)) {
      toast.error("Please paste a valid meeting link starting with https://");
      return;
    }

    if (!externalUrl && !platform.is_connected) {
      toast.error(`Paste the ${platform.display_name} meeting link, or connect ${platform.display_name} first`);
      return;
    }

    setIsCreating(true);

    try {
      // Generate meeting details
      const meetingId = generateMeetingId();
      const passcode = meetingDetails.external_passcode.trim() || generatePasscode();
      const baseUrl = window.location.origin;

      // Create meeting URLs based on platform
      let meetingUrl = "";
      let joinUrl = "";
      let hostUrl = "";

      if (externalUrl) {
        // Admin pasted the real meeting link (e.g. a Zoom invite link)
        meetingUrl = externalUrl;
        joinUrl = externalUrl;
        hostUrl = externalUrl;
      } else {
        switch (platform.name) {
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
            meetingUrl = `${baseUrl}/meeting/${platform.name}/${meetingId}`;
            joinUrl = meetingUrl;
            hostUrl = meetingUrl;
        }
      }

      // Prepare description with meeting details
      const meetingDescription = meetingDetails.description 
        ? `${meetingDetails.description}\n\n--- Meeting Details ---\nMeeting Link: ${joinUrl}\nMeeting ID: ${meetingId}\nPasscode: ${passcode}\nPlatform: ${platform.display_name}`
        : `Join the virtual meeting:\n\nMeeting Link: ${joinUrl}\nMeeting ID: ${meetingId}\nPasscode: ${passcode}\nPlatform: ${platform.display_name}`;

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
        platform_name: platform.display_name
      });

      toast.success(`Meeting created successfully on ${platform.display_name}!`);
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
      duration_minutes: 60,
      external_url: "",
      external_passcode: ""
    });

    onOpenChange(false);
  };

  const connectedPlatforms = allPlatforms.filter(p => p.is_connected);
  const selectedPlatformData = allPlatforms.find(p => p.id === selectedPlatform);

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
            {loading ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Loading platforms...</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="platform">Meeting Platform</Label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a meeting platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {allPlatforms.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id}>
                          <div className="flex items-center gap-2">
                            <span>{platform.display_name}</span>
                            {!platform.is_connected && (
                              <span className="text-xs text-muted-foreground">(Not connected)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPlatformData && !selectedPlatformData.is_connected && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You need to connect {selectedPlatformData.display_name} first. 
                      <Button
                        variant="link"
                        size="sm"
                        className="px-1"
                        onClick={() => {
                          handleClose();
                          const integrationsTab = document.querySelector('[value="integrations"]') as HTMLElement;
                          if (integrationsTab) integrationsTab.click();
                        }}
                      >
                        Go to Integrations
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

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
                  <Label htmlFor="external_url">Meeting Link (paste your Zoom / Meet / Teams link)</Label>
                  <Input
                    id="external_url"
                    value={meetingDetails.external_url}
                    onChange={(e) => setMeetingDetails({ ...meetingDetails, external_url: e.target.value })}
                    placeholder="https://us02web.zoom.us/j/1234567890?pwd=..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Donors will be taken straight to this link in a new tab from the Fundraising Room.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="external_passcode">Meeting Passcode (optional)</Label>
                  <Input
                    id="external_passcode"
                    value={meetingDetails.external_passcode}
                    onChange={(e) => setMeetingDetails({ ...meetingDetails, external_passcode: e.target.value })}
                    placeholder="e.g. 123456"
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

                {connectedPlatforms.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No meeting platforms connected yet. Connect at least one platform to create meetings.
                    </AlertDescription>
                  </Alert>
                )}

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
                    disabled={isCreating || !selectedPlatform || (selectedPlatformData && !selectedPlatformData.is_connected && !meetingDetails.external_url.trim())}
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