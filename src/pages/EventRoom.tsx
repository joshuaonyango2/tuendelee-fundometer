import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FundraisingThermometer } from "@/components/FundraisingThermometer";
import { PledgeForm, PledgeData } from "@/components/PledgeForm";
import { PaymentOptions } from "@/components/PaymentOptions";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { currencyService } from "@/services/currencyService";
import { Users, Clock, Target, LogOut, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface EventDetails {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  goal_amount: number;
  is_active: boolean;
  status: string;
}

interface EventPledge {
  id: string;
  display_name: string; // Changed from 'name' to 'display_name' for anonymized display
  amount: number;
  currency: string;
  amount_in_usd: number;
  amount_in_kes: number;
  payment_type: string;
  message?: string;
  created_at: string;
}

export default function EventRoom() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [pledges, setPledges] = useState<EventPledge[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentPledge, setCurrentPledge] = useState<PledgeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRaised, setTotalRaised] = useState(0);

  useEffect(() => {
    checkSession();
    loadEventDetails();
    subscribeToUpdates();
  }, [eventId]);

  const checkSession = async () => {
    const session = localStorage.getItem("event_session");
    if (!session) {
      navigate("/");
      return;
    }

    const sessionData = JSON.parse(session);
    if (sessionData.eventId !== eventId) {
      navigate("/");
      return;
    }

    // Verify session is still valid using secure function
    try {
      const { data } = await supabase
        .rpc('get_session_by_token', { p_session_token: sessionData.sessionToken })
        .single();

      if (!data || data.event_id !== eventId) {
        localStorage.removeItem("event_session");
        navigate("/");
        return;
      }

      // Update activity using secure function
      await supabase.rpc('update_session_activity', { p_session_token: sessionData.sessionToken });
    } catch (error) {
      localStorage.removeItem("event_session");
      navigate("/");
    }
  };

  const loadEventDetails = async () => {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from("fundraising_events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Load pledges using the public function (anonymized)
      const { data: pledgesData, error: pledgesError } = await supabase
        .rpc("get_public_pledges", { p_event_id: eventId });

      if (pledgesError) throw pledgesError;
      setPledges(pledgesData || []);
      
      // Calculate total raised
      const total = pledgesData?.reduce((sum, p) => sum + p.amount_in_usd, 0) || 0;
      setTotalRaised(total);

      // Count active sessions - only admins can directly query this
      // For public users, just show a generic count or skip this
      // Since we can't directly query sessions anymore, we'll skip the exact count
      setActiveUsers(1); // Default to showing at least the current user
    } catch (error: any) {
      toast.error("Failed to load event details");
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('event_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_pledges',
          filter: `event_id=eq.${eventId}`
        },
        async (payload) => {
          // Fetch the anonymized version of the new pledge
          const { data } = await supabase
            .rpc("get_public_pledges", { p_event_id: eventId });
          
          if (data && data.length > 0) {
            const newPledge = data.find((p: any) => p.id === (payload.new as any).id);
            if (newPledge) {
              setPledges(prev => [newPledge as EventPledge, ...prev]);
              setTotalRaised(prev => prev + (payload.new as any).amount_in_usd);
              toast.success(`New pledge received!`);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fundraising_events',
          filter: `id=eq.${eventId}`
        },
        (payload) => {
          setEvent(payload.new as EventDetails);
          if (!(payload.new as any).is_active) {
            toast.info("This event has ended. Thank you for participating!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handlePledgeSubmit = async (pledgeData: PledgeData) => {
    try {
      // Convert to multiple currencies
      const conversions = await currencyService.convertToMultiple(
        pledgeData.amount,
        pledgeData.currency,
        ['KES', 'USD']
      );

      // Determine payment type
      const paymentType = pledgeData.message?.toLowerCase().includes('cash') ? 'cash' : 'pledge';

      // Save pledge to database
      const { error } = await supabase.from("event_pledges").insert({
        event_id: eventId,
        name: pledgeData.name,
        email: pledgeData.email,
        amount: pledgeData.amount,
        currency: pledgeData.currency,
        amount_in_usd: conversions.USD || 0,
        amount_in_kes: conversions.KES || 0,
        payment_type: paymentType,
        message: pledgeData.message,
      });

      if (error) throw error;

      setCurrentPledge(pledgeData);
      setShowPaymentDialog(true);
      
      toast.success(`Thank you for your ${paymentType === 'cash' ? 'cash donation' : 'pledge'}!`);
    } catch (error: any) {
      toast.error("Failed to process pledge. Please try again.");
    }
  };

  const handleLeaveEvent = () => {
    localStorage.removeItem("event_session");
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <p>Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Event not found</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground">{event.description}</p>
          </div>
          <Button variant="outline" onClick={handleLeaveEvent}>
            <LogOut className="w-4 h-4 mr-2" />
            Leave Event
          </Button>
        </div>

        {/* Event Info Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Participants</p>
                <p className="font-semibold">{activeUsers}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold">{event.duration_minutes} min</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Target className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Goal</p>
                <p className="font-semibold">${event.goal_amount.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <Badge variant={event.is_active ? "default" : "secondary"} className="w-full justify-center">
                {event.is_active ? "LIVE" : "ENDED"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Thermometer */}
          <div className="flex justify-center">
            <FundraisingThermometer
              currentAmount={totalRaised}
              goalAmount={event.goal_amount}
              currency="USD"
            />
          </div>

          {/* Pledge Form */}
          <div>
            {event.is_active ? (
              <PledgeForm onSubmit={handlePledgeSubmit} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold mb-2">Event Has Ended</h3>
                  <p className="text-muted-foreground mb-4">
                    Thank you for participating! The final amount raised was:
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    ${totalRaised.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Pledges */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Recent Contributions</h2>
          <div className="grid gap-3">
            {pledges.slice(0, 10).map((pledge) => (
              <Card key={pledge.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{pledge.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(pledge.created_at), "p")}
                    </p>
                    {pledge.message && (
                      <p className="text-sm text-muted-foreground italic mt-1">
                        "{pledge.message}"
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant={pledge.payment_type === 'cash' ? 'default' : 'secondary'}>
                      {pledge.payment_type}
                    </Badge>
                    <p className="font-semibold mt-1">
                      {pledge.currency} {pledge.amount.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {currentPledge && (
            <PaymentOptions
              amount={currentPledge.amount}
              currency={currentPledge.currency}
              email={currentPledge.email}
              name={currentPledge.name}
              onClose={() => setShowPaymentDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}