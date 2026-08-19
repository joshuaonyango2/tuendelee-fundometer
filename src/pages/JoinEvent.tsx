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
}

export default function JoinEvent() {
  const navigate = useNavigate();
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    loadActiveEvent();
  }, []);

  const loadActiveEvent = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("fundraising_events")
        .select("id, title, description, scheduled_at")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      setActiveEvent(data);
    } catch (err: any) {
      console.error("Error loading event:", err);
      toast.error("Failed to load active event");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent) return;

    setIsSubmitting(true);
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
          event_id: activeEvent.id,
          session_token: sessionToken,
          attendee_name: result.data.name,
        });

      if (sessionError) throw sessionError;

      // Store session info in localStorage for access control
      localStorage.setItem("event_session", JSON.stringify({
        eventId: activeEvent.id,
        sessionToken,
        attendeeName: result.data.name,
        attendeeEmail: result.data.email,
      }));

      toast.success("Welcome to the fundraising event!");
      navigate(`/event/${activeEvent.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to join event");
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p>Loading event...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeEvent) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-muted rounded-full">
                <AlertCircle className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">No Active Event</CardTitle>
            <CardDescription>
              There are no active fundraising events at the moment. Please check back later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <Helmet>
        <title>Join Fundraising Event | Tuendelee Foundation</title>
        <meta
          name="description"
          content={`Join ${activeEvent.title} with the Tuendelee Foundation — pledge, donate and follow live fundraising progress.`}
        />
        <link rel="canonical" href="https://tuendelee-fundometer.lovable.app/join" />
        <meta property="og:title" content={`Join ${activeEvent.title} | Tuendelee Foundation`} />
        <meta
          property="og:description"
          content={activeEvent.description || "Enter your details to join the live fundraising event."}
        />
        <meta property="og:url" content="https://tuendelee-fundometer.lovable.app/join" />
      </Helmet>
      <h1 className="sr-only">Join Fundraising Event</h1>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Join {activeEvent.title}</CardTitle>
          <CardDescription>
            {activeEvent.description || "Enter your details to join the event"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Joining..." : "Join Event"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}