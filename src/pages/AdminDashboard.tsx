import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Calendar, Users, Link2, LogOut, Play, Square, Copy, CheckCircle, Key, Settings, Video } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import MeetingIntegrations from "@/components/meetings/MeetingIntegrations";
import CreateMeetingDialog from "@/components/meetings/CreateMeetingDialog";

interface FundraisingEvent {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  goal_amount: number;
  passcode: string;
  share_link: string;
  is_active: boolean;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<FundraisingEvent[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const [selectedEventForMeeting, setSelectedEventForMeeting] = useState<FundraisingEvent | null>(null);

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    duration_minutes: 60,
    goal_amount: 50000,
  });

  useEffect(() => {
    checkAuth();
    loadEvents();
    
    // Check if we should show password change prompt
    const shouldShowPrompt = localStorage.getItem("showPasswordChangePrompt");
    if (shouldShowPrompt === "true") {
      setShowPasswordChange(true);
      localStorage.removeItem("showPasswordChangePrompt");
    }
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/admin/auth");
      return;
    }
    setUser(user);
    setNewEmail(user.email || "");
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("fundraising_events")
        .select("*")
        .order("scheduled_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast.error("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  const generatePasscode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let passcode = "";
    for (let i = 0; i < 6; i++) {
      passcode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return passcode;
  };

  const generateShareLink = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const passcode = generatePasscode();
      const shareLink = generateShareLink();

      const { error } = await supabase.from("fundraising_events").insert({
        admin_id: user.id,
        title: newEvent.title,
        description: newEvent.description,
        scheduled_at: newEvent.scheduled_at,
        duration_minutes: newEvent.duration_minutes,
        goal_amount: newEvent.goal_amount,
        passcode,
        share_link: shareLink,
      });

      if (error) throw error;

      toast.success("Event created successfully!");
      setNewEvent({
        title: "",
        description: "",
        scheduled_at: "",
        duration_minutes: 60,
        goal_amount: 50000,
      });
      loadEvents();
    } catch (error: any) {
      toast.error("Failed to create event");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleEventStatus = async (eventId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("fundraising_events")
        .update({ 
          is_active: !currentStatus,
          status: !currentStatus ? "live" : "ended"
        })
        .eq("id", eventId);

      if (error) throw error;

      toast.success(currentStatus ? "Event ended" : "Event started");
      loadEvents();
    } catch (error: any) {
      toast.error("Failed to update event status");
    }
  };

  const copyShareLink = (event: FundraisingEvent) => {
    const fullLink = `${window.location.origin}/join/${event.share_link}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedLink(event.id);
    toast.success("Link copied to clipboard!");
    
    setTimeout(() => {
      setCopiedLink(null);
    }, 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/auth");
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long!");
      return;
    }

    setPasswordChangeLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Password changed successfully!");
      setShowPasswordChange(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleAccountUpdate = async () => {
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    setPasswordChangeLoading(true);
    try {
      // Verify current password first
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        toast.error("Current password is incorrect");
        return;
      }

      // Update email if changed
      if (newEmail && newEmail !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: newEmail,
        });
        if (emailError) throw emailError;
        toast.success("Email update initiated. Please check your new email for confirmation.");
      }

      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error("New passwords do not match");
          return;
        }

        if (newPassword.length < 8) {
          toast.error("Password must be at least 8 characters");
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) throw passwordError;
        toast.success("Password updated successfully!");
      }

      // Clear form and close dialog
      setShowAccountSettings(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Reload user data
      await checkAuth();
    } catch (err: any) {
      toast.error(err.message || "Failed to update account");
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your fundraising events</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              setShowAccountSettings(true);
              setNewEmail(user?.email || "");
            }}>
              <Settings className="w-4 h-4 mr-2" />
              Account Settings
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="events" className="space-y-4">
          <TabsList>
            <TabsTrigger value="events">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="create">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Video className="w-4 h-4 mr-2" />
              Meeting Platforms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p>Loading events...</p>
                </CardContent>
              </Card>
            ) : events.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">No events created yet</p>
                  <Button onClick={() => {
                    const createTab = document.querySelector('[value="create"]') as HTMLElement;
                    if (createTab) createTab.click();
                  }}>
                    Create Your First Event
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{event.title}</CardTitle>
                          <CardDescription>
                            {format(new Date(event.scheduled_at), "PPpp")}
                          </CardDescription>
                        </div>
                        <Badge variant={event.is_active ? "default" : "secondary"}>
                          {event.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Goal Amount</Label>
                          <p className="font-semibold">${event.goal_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <Label>Duration</Label>
                          <p className="font-semibold">{event.duration_minutes} minutes</p>
                        </div>
                        <div>
                          <Label>Passcode</Label>
                          <p className="font-mono font-semibold text-lg">{event.passcode}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => copyShareLink(event)}
                        >
                          {copiedLink === event.id ? (
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
                        
                        <Button
                          variant={event.is_active ? "destructive" : "default"}
                          onClick={() => toggleEventStatus(event.id, event.is_active)}
                        >
                          {event.is_active ? (
                            <>
                              <Square className="w-4 h-4 mr-2" />
                              End Event
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Start Event
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => navigate(`/event/${event.id}/manage`)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          View Details
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedEventForMeeting(event);
                            setShowCreateMeeting(true);
                          }}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Create Meeting
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New Fundraising Event</CardTitle>
                <CardDescription>
                  Schedule a new fundraising session with a unique passcode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createEvent} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Annual Scholarship Fundraiser"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Help us provide scholarships to deserving students..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduled_at">Date & Time</Label>
                      <Input
                        id="scheduled_at"
                        type="datetime-local"
                        value={newEvent.scheduled_at}
                        onChange={(e) => setNewEvent({ ...newEvent, scheduled_at: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={newEvent.duration_minutes}
                        onChange={(e) => setNewEvent({ ...newEvent, duration_minutes: parseInt(e.target.value) })}
                        min="15"
                        max="480"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal">Goal Amount (USD)</Label>
                    <Input
                      id="goal"
                      type="number"
                      value={newEvent.goal_amount}
                      onChange={(e) => setNewEvent({ ...newEvent, goal_amount: parseFloat(e.target.value) })}
                      min="100"
                      step="100"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Event"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <MeetingIntegrations 
              onIntegrationComplete={() => {
                toast.success("Integration complete! You can now create meetings.");
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {selectedEventForMeeting && (
        <CreateMeetingDialog
          eventId={selectedEventForMeeting.id}
          eventTitle={selectedEventForMeeting.title}
          open={showCreateMeeting}
          onOpenChange={setShowCreateMeeting}
          onMeetingCreated={() => {
            toast.success("Meeting created successfully!");
            setShowCreateMeeting(false);
            setSelectedEventForMeeting(null);
          }}
        />
      )}
      
      {/* Password Change Dialog */}
      <Dialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Your Password</DialogTitle>
            <DialogDescription>
              {localStorage.getItem("showPasswordChangePrompt") === "true" 
                ? "Welcome! For security, we recommend changing your default password."
                : "Enter a new password for your admin account."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 8 characters)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
              />
            </div>
            
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <Alert variant="destructive">
                <AlertDescription>Passwords do not match</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPasswordChange(false);
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              Skip for now
            </Button>
            <Button 
              onClick={handlePasswordChange}
              disabled={passwordChangeLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            >
              {passwordChangeLoading ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Account Settings Dialog */}
      <Dialog open={showAccountSettings} onOpenChange={setShowAccountSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
            <DialogDescription>
              Update your email address and password
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-pass">Current Password*</Label>
              <Input
                id="current-pass"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password to make changes"
                required
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="new-email">Email Address</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
              />
              <p className="text-xs text-muted-foreground">
                Leave unchanged if you don't want to update
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="new-pass">New Password</Label>
              <Input
                id="new-pass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 8 characters)"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank if you don't want to change password
              </p>
            </div>
            
            {newPassword && (
              <div className="space-y-2">
                <Label htmlFor="confirm-pass">Confirm New Password</Label>
                <Input
                  id="confirm-pass"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                />
              </div>
            )}
            
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <Alert variant="destructive">
                <AlertDescription>New passwords do not match</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAccountSettings(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setNewEmail(user?.email || "");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAccountUpdate}
              disabled={passwordChangeLoading || !currentPassword}
            >
              {passwordChangeLoading ? "Updating..." : "Update Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}