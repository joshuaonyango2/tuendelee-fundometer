import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function JoinEvent() {
  const { shareLink } = useParams();
  const navigate = useNavigate();
  const [passcode, setPasscode] = useState("");
  const [attendeeName, setAttendeeName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // First, find the event by share link
      const { data: event, error: eventError } = await supabase
        .from("fundraising_events")
        .select("*")
        .eq("share_link", shareLink)
        .single();

      if (eventError || !event) {
        throw new Error("Event not found. Please check your link.");
      }

      // Check if event is active
      if (!event.is_active) {
        throw new Error("This event is not currently active.");
      }

      // Verify passcode
      if (event.passcode !== passcode.toUpperCase()) {
        throw new Error("Invalid passcode. Please try again.");
      }

      // Create a session for this attendee
      const sessionToken = Math.random().toString(36).substring(2, 15);
      
      const { error: sessionError } = await supabase
        .from("event_sessions")
        .insert({
          event_id: event.id,
          session_token: sessionToken,
          attendee_name: attendeeName,
        });

      if (sessionError) throw sessionError;

      // Store session info in localStorage for access control
      localStorage.setItem("event_session", JSON.stringify({
        eventId: event.id,
        sessionToken,
        attendeeName,
      }));

      toast.success("Welcome to the fundraising event!");
      navigate(`/event/${event.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to join event");
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Join Fundraising Event</CardTitle>
          <CardDescription>
            Enter the passcode provided by your event organizer
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                value={attendeeName}
                onChange={(e) => setAttendeeName(e.target.value)}
                placeholder="Enter your full name"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="passcode">Event Passcode</Label>
              <Input
                id="passcode"
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter 6-character passcode"
                maxLength={6}
                className="font-mono text-lg text-center tracking-wider"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                The passcode should be provided by your event organizer
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Joining..." : "Join Event"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}