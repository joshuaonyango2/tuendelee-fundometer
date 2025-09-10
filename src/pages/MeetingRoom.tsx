import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FundraisingThermometer } from "@/components/FundraisingThermometer";
import { supabase } from "@/integrations/supabase/client";
import { Video, Users, Calendar, Clock, LogIn, Copy, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
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
    goal_amount: number;
    is_active: boolean;
  };
}

interface EventPledge {
  id: string;
  display_name: string;
  amount: number;
  currency: string;
  amount_in_usd: number;
  amount_in_kes: number;
  payment_type: string;
  created_at: string;
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
  const [totalRaised, setTotalRaised] = useState(0);
  const [pledges, setPledges] = useState<EventPledge[]>([]);
  const [showThermometer, setShowThermometer] = useState(false);

  useEffect(() => {
    loadMeetingDetails();
    checkIfHost();
  }, [meetingId]);

  useEffect(() => {
    if (meeting) {
      loadFundraisingData();
      const interval = setInterval(loadFundraisingData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [meeting]);

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
            description,
            goal_amount,
            is_active
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

  const loadFundraisingData = async () => {
    if (!meeting) return;
    
    try {
      // Load pledges using the public function (anonymized)
      const { data: pledgesData, error: pledgesError } = await supabase
        .rpc("get_public_pledges", { p_event_id: meeting.event_id });

      if (!pledgesError && pledgesData) {
        setPledges(pledgesData);
        
        // Calculate total raised
        const total = pledgesData.reduce((sum: number, p: any) => sum + p.amount_in_usd, 0) || 0;
        setTotalRaised(total);
      }
    } catch (error) {
      console.error("Error loading fundraising data:", error);
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

      // Show the thermometer after joining
      setShowThermometer(true);
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
    <div className="min-h-screen bg-gradient-background p-4">
      {/* Main meeting card or meeting room with thermometer */}
      {showThermometer ? (
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{meeting.event.title}</h1>
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate(`/event/${meeting.event_id}`)}
                variant="outline"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Go to Event Page
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowThermometer(false)}
              >
                Back to Meeting Info
              </Button>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Fundraising Thermometer */}
            <div className="flex justify-center">
              <FundraisingThermometer
                currentAmount={totalRaised}
                goalAmount={meeting.event.goal_amount}
                currency="USD"
              />
            </div>
            
            {/* Meeting Frame or Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  {meeting.platform.display_name} Meeting
                </CardTitle>
                <CardDescription>
                  You're in the meeting room. Track fundraising progress live!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <strong>Meeting ID:</strong> {meeting.meeting_id}
                    {meeting.passcode && (
                      <div>
                        <strong>Passcode:</strong> {meeting.passcode}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
                
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Participant Name</p>
                  <p className="font-semibold">{userName || "Guest"}</p>
                </div>
                
                {/* Live pledge tracking info */}
                <div className="p-4 bg-accent rounded-lg">
                  <p className="text-sm font-semibold text-accent-foreground">
                    💡 Tip: The thermometer updates automatically as new pledges come in!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Pledges */}
          {pledges.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Recent Contributions</h2>
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {pledges.slice(0, 10).map((pledge) => (
                  <Card key={pledge.id}>
                    <CardContent className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm">{pledge.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(pledge.created_at), "p")}
                        </p>
                      </div>
                      <Badge variant={pledge.payment_type === 'cash' ? 'default' : 'secondary'}>
                        {pledge.currency} {pledge.amount.toLocaleString()}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center">
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
      )}
    </div>
  );
}