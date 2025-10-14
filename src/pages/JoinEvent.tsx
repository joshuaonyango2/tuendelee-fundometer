import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Shield, AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { z } from 'zod';
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  goal_amount: number;
}

export default function JoinEvent() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Input validation schema
  const joinSchema = z.object({
    name: z.string()
      .trim()
      .min(1, 'Name is required')
      .max(100, 'Name too long'),
    email: z.string()
      .trim()
      .email('Valid email required')
      .max(255, 'Email too long')
  });


  useEffect(() => {
    loadActiveEvents();
  }, []);

  const loadActiveEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("fundraising_events")
        .select("id, title, description, scheduled_at, goal_amount")
        .eq("is_active", true)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err: any) {
      console.error("Error loading events:", err);
      toast.error("Failed to load events");
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) {
      setError("Please select an event to join");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Validate inputs
      const result = joinSchema.safeParse({
        name: name.trim(),
        email: email.trim()
      });

      if (!result.success) {
        throw new Error(result.error.errors[0].message);
      }

      // Create a secure session token
      const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const { error: sessionError } = await supabase
        .from("event_sessions")
        .insert({
          event_id: selectedEvent.id,
          session_token: sessionToken,
          attendee_name: result.data.name,
        });

      if (sessionError) throw sessionError;

      // Store session info in localStorage for access control
      localStorage.setItem("event_session", JSON.stringify({
        eventId: selectedEvent.id,
        sessionToken,
        attendeeName: result.data.name,
        attendeeEmail: result.data.email,
      }));

      toast.success("Welcome to the fundraising event!");
      navigate(`/event/${selectedEvent.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to join event");
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Join Fundraising Event</CardTitle>
          <CardDescription>
            Select an event and provide your details to join
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!selectedEvent ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Active Events</h3>
              {events.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No active events available at the moment.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <Card 
                      key={event.id} 
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{event.title}</h4>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(event.scheduled_at), "PPP 'at' p")}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">Join</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold">Selected Event:</h3>
                <p className="text-sm text-muted-foreground">{selectedEvent.title}</p>
                <Button 
                  type="button" 
                  variant="link" 
                  className="p-0 h-auto text-sm"
                  onClick={() => setSelectedEvent(null)}
                >
                  Change event
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  We'll use this to follow up with you about the event
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}