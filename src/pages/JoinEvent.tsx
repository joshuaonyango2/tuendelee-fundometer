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
import { z } from 'zod';

export default function JoinEvent() {
  const { shareLink } = useParams();
  const navigate = useNavigate();
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Input validation schema
  const joinSchema = z.object({
    passcode: z.string()
      .length(6, 'Passcode must be 6 characters')
      .regex(/^[A-Z0-9]+$/, 'Invalid passcode format')
  });

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validate inputs
      const result = joinSchema.safeParse({
        passcode: passcode.toUpperCase()
      });

      if (!result.success) {
        throw new Error(result.error.errors[0].message);
      }
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

      // Create a secure session token (longer, more random)
      const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const { error: sessionError } = await supabase
        .from("event_sessions")
        .insert({
          event_id: event.id,
          session_token: sessionToken,
          attendee_name: "Guest",
        });

      if (sessionError) throw sessionError;

      // Store session info in localStorage for access control
      localStorage.setItem("event_session", JSON.stringify({
        eventId: event.id,
        sessionToken,
        attendeeName: "Guest",
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
            Enter the event passcode to join
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passcode">Event Passcode</Label>
              <Input
                id="passcode"
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character passcode"
                maxLength={6}
                className="font-mono text-2xl text-center tracking-widest uppercase"
                required
                disabled={isLoading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                Get the passcode from your event organizer
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