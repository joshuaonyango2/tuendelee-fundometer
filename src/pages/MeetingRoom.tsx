import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Video, Users, Calendar, Clock, LogIn, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface MeetingDetails {
  id: string;
  event_id: string;
  meeting_id: string;
  meeting_url: string;
  join_url: string;
  host_url: string;
  passcode: string | null;
  start_time: string;
  duration_minutes: number;
  status: string;
  platform: {
    name: string;
    display_name: string;
  };
  event: {
    title: string;
    description: string;
  };
}

export default function MeetingRoom() {
  const { platform, meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [userName, setUserName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadMeetingDetails();
    checkIfHost();
  }, [meetingId]);

  const loadMeetingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("event_meetings")
        .select(`
          *,
          platform:meeting_platforms(
            name,
            display_name
          ),
          event:fundraising_events(
            title,
            description
          )
        `)
        .eq("meeting_id", meetingId)
        .single();

      if (error) throw error;

      if (data) {
        setMeeting(data as any);
      }
    } catch (error) {
      console.error("Error loading meeting:", error);
      toast.error("Meeting not found");
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfHost = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && meeting) {
      // Check if user is the event admin
      const { data } = await supabase
        .from("fundraising_events")
        .select("admin_id")
        .eq("id", meeting.event_id)
        .single();
      
      if (data?.admin_id === user.id) {
        setIsHost(true);
      }
    }
  };

  const handleJoinMeeting = () => {
    if (!userName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsJoining(true);
    
    // Simulate joining the meeting
    // In a real implementation, this would integrate with the actual meeting platform's SDK
    setTimeout(() => {
      toast.success(`Joining ${meeting?.platform.display_name} meeting...`);
      
      // Create a virtual meeting room UI or redirect to actual platform
      // For now, we'll show a success message
      setIsJoining(false);
      
      // Store participant info in session
      sessionStorage.setItem("meeting_participant", JSON.stringify({
        name: userName,
        meetingId: meeting?.meeting_id,
        platform: meeting?.platform.name
      }));

      // Navigate to virtual meeting interface
      navigate(`/meeting/room/${meetingId}`);
    }, 1500);
  };

  const copyMeetingLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Meeting link copied!");
    
    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  };

  const getMeetingStatus = () => {
    if (!meeting) return { label: "Loading", variant: "secondary" as const };
    
    const now = new Date();
    const startTime = new Date(meeting.start_time);
    const endTime = new Date(startTime.getTime() + meeting.duration_minutes * 60000);
    
    if (now < startTime) {
      return { label: "Scheduled", variant: "secondary" as const };
    } else if (now >= startTime && now <= endTime) {
      return { label: "Live", variant: "default" as const };
    } else {
      return { label: "Ended", variant: "outline" as const };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p>Loading meeting details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Meeting Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This meeting link may be invalid or expired.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const meetingStatus = getMeetingStatus();

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{meeting.event.title}</CardTitle>
              <CardDescription className="mt-2">
                {meeting.event.description}
              </CardDescription>
            </div>
            <Badge variant={meetingStatus.variant}>
              {meetingStatus.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Meeting Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-5 h-5 text-primary" />
              <p className="font-medium">{meeting.platform.display_name} Meeting</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Date & Time</span>
                </div>
                <p className="font-medium">
                  {format(new Date(meeting.start_time), "PPp")}
                </p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Duration</span>
                </div>
                <p className="font-medium">{meeting.duration_minutes} minutes</p>
              </div>
              
              {meeting.passcode && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <LogIn className="w-4 h-4" />
                    <span>Passcode</span>
                  </div>
                  <p className="font-mono font-semibold text-lg">{meeting.passcode}</p>
                </div>
              )}
              
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Users className="w-4 h-4" />
                  <span>Meeting ID</span>
                </div>
                <p className="font-mono text-sm">{meeting.meeting_id}</p>
              </div>
            </div>
          </div>

          {/* Join Form */}
          {meetingStatus.label === "Live" || meetingStatus.label === "Scheduled" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name to join"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleJoinMeeting();
                    }
                  }}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleJoinMeeting}
                  disabled={isJoining || !userName.trim()}
                  className="flex-1"
                >
                  {isJoining ? "Joining..." : `Join ${meeting.platform.display_name} Meeting`}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={copyMeetingLink}
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>

              {isHost && (
                <Alert>
                  <AlertDescription>
                    You are the host of this meeting. Use your host link from the admin dashboard for additional controls.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                This meeting has ended. Please contact the organizer for more information.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}