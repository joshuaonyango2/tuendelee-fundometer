import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Target, AlertCircle, Video } from "lucide-react";
import { FundraisingThermometer } from "@/components/FundraisingThermometer";
import { PledgeForm, PledgeData } from "@/components/PledgeForm";
import { PaymentOptions } from "@/components/PaymentOptions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingSpinner, ConnectionStatus, ErrorFallback, ThermometerSkeleton, PledgeSkeleton } from "@/components/ui/loading-states";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimePledges } from "@/hooks/useRealtimePledges";
import { formatDistanceToNow } from "date-fns";
import { currencyService } from "@/services/currencyService";
import { toast } from 'sonner';

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
  event_id: string;
  display_name: string;
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
  const [activeUsers, setActiveUsers] = useState(0);
  const [isEventLoading, setIsEventLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentPledge, setCurrentPledge] = useState<PledgeData | null>(null);
  const [liveMeeting, setLiveMeeting] = useState<any>(null);
  
  const {
    pledges: realtimePledges,
    totalRaised,
    isLoading: pledgesLoading,
    error: pledgesError,
    connectionStatus,
    createPledge,
    reloadPledges
  } = useRealtimePledges({ eventId: eventId || '', enableOptimistic: true });

  useEffect(() => {
    checkSession();
    loadEventDetails();
  }, [eventId]);

  const checkSession = async () => {
    const session = localStorage.getItem('event_session');
    if (!session) {
      navigate('/');
      return;
    }

    const sessionData = JSON.parse(session);
    if (sessionData.eventId !== eventId) {
      navigate('/');
      return;
    }

    // Verify session is still valid using secure function
    try {
      const { data } = await supabase
        .rpc('get_session_by_token', { p_session_token: sessionData.sessionToken })
        .single();

      if (!data || data.event_id !== eventId) {
        localStorage.removeItem('event_session');
        navigate('/');
        return;
      }

      // Update activity using secure function
      await supabase.rpc('update_session_activity', { p_session_token: sessionData.sessionToken });
    } catch (error) {
      localStorage.removeItem('event_session');
      navigate('/');
    }
  };

  const loadEventDetails = async () => {
    if (!eventId) return;

    try {
      setIsEventLoading(true);
      
      // Load event details
      const { data: eventData, error: eventError } = await supabase
        .from('fundraising_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      setEvent(eventData);

      // Load live meeting if exists
      const { data: meetingData } = await supabase
        .from('event_meetings')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'active')
        .single();

      if (meetingData) {
        setLiveMeeting(meetingData);
      }

      // Count active sessions
      const { data: sessionCount, error: sessionError } = await supabase
        .rpc('count_active_sessions', { p_event_id: eventId });

      if (sessionError) {
        console.error('Error counting sessions:', sessionError);
      } else {
        setActiveUsers(sessionCount || 0);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Failed to load event details');
    } finally {
      setIsEventLoading(false);
    }
  };

  const handlePledgeSubmit = async (pledgeData: PledgeData) => {
    try {
      // Convert currency if needed
      const amountInUSD = await currencyService.convertAmount(pledgeData.amount, pledgeData.currency, 'USD');
      const amountInKES = await currencyService.convertAmount(pledgeData.amount, pledgeData.currency, 'KES');
      
      await createPledge({
        event_id: eventId!,
        display_name: pledgeData.name,
        amount: pledgeData.amount,
        amount_in_usd: amountInUSD,
        amount_in_kes: amountInKES,
        currency: pledgeData.currency,
        message: pledgeData.message,
        payment_type: 'pending'
      });

      setCurrentPledge(pledgeData);
      setShowPaymentDialog(true);
      
      toast.success('Pledge submitted successfully!');
    } catch (error) {
      console.error('Error processing pledge:', error);
      toast.error('Failed to process pledge');
    }
  };

  const handleLeaveEvent = () => {
    localStorage.removeItem('event_session');
    navigate('/');
  };

  if (isEventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Event Not Found</h3>
            <p className="text-muted-foreground">The event you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-3xl font-bold">{event.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <ConnectionStatus 
                      isConnected={connectionStatus.isConnected}
                      isReconnecting={connectionStatus.isReconnecting}
                    />
                    <Badge variant={event.is_active ? "default" : "secondary"}>
                      {event.is_active ? "Live" : "Ended"}
                    </Badge>
                  </div>
                </div>
                {event.description && (
                  <CardDescription className="text-lg">
                    {event.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-semibold">
                        {new Date(event.scheduled_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-semibold">
                        {new Date(event.scheduled_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Participants</p>
                      <p className="font-semibold">{activeUsers}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-semibold">{event.duration_minutes} min</p>
                    </div>
                  </div>
                </div>
                
                {/* Live Meeting Button */}
                {liveMeeting && event.is_active && (
                  <div className="mt-4 p-4 bg-gradient-secondary rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">Live Meeting in Progress</h3>
                        <p className="text-secondary-foreground/80">Join the conversation and see real-time progress</p>
                      </div>
                      <Button 
                        onClick={() => window.open(`/meeting/room/${liveMeeting.id}`, '_blank')}
                        className="bg-white text-secondary hover:bg-white/90"
                      >
                        <Video className="mr-2 h-4 w-4" />
                        Join Live Meeting
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fundraising Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-6 w-6 text-success" />
                  Fundraising Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pledgesLoading ? (
                  <ThermometerSkeleton />
                ) : pledgesError ? (
                  <ErrorFallback 
                    error={pledgesError} 
                    onRetry={reloadPledges}
                  />
                ) : (
                  <FundraisingThermometer
                    currentAmount={totalRaised}
                    goalAmount={event.goal_amount}
                    currency="USD"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Pledges */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Donations</CardTitle>
              </CardHeader>
              <CardContent>
                {pledgesLoading ? (
                  <PledgeSkeleton count={3} />
                ) : pledgesError ? (
                  <ErrorFallback error={pledgesError} onRetry={reloadPledges} />
                ) : realtimePledges.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No donations yet. Be the first to contribute!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {realtimePledges.slice(0, 10).map((pledge) => (
                      <div key={pledge.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{pledge.display_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(pledge.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {pledge.message && (
                            <p className="text-sm text-muted-foreground mb-2">{pledge.message}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-primary">
                              {pledge.currency} {pledge.amount.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ≈ ${pledge.amount_in_usd.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Action Button */}
            {event.is_active ? (
              <PledgeForm onSubmit={handlePledgeSubmit} />
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Event Has Ended</h3>
                  <p className="text-muted-foreground">This fundraising event is no longer accepting pledges.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Leave Event Button */}
        <div className="fixed bottom-4 right-4">
          <Button variant="outline" onClick={handleLeaveEvent}>
            Leave Event
          </Button>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Your Donation</DialogTitle>
            <DialogDescription>
              Choose your preferred payment method to complete your contribution.
            </DialogDescription>
          </DialogHeader>
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