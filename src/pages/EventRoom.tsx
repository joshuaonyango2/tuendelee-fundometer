import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, Clock, Users, Target, AlertCircle, Video } from "lucide-react";
import { ImprovedThermometer } from "@/components/ImprovedThermometer";
import { PledgeForm, PledgeData } from "@/components/PledgeForm";
import { ImprovedPaymentOptions } from "@/components/ImprovedPaymentOptions";
import { PaymentConfirmation } from "@/components/PaymentConfirmation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingSpinner, ConnectionStatus, ErrorFallback, ThermometerSkeleton, PledgeSkeleton } from "@/components/ui/loading-states";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimePledges } from "@/hooks/useRealtimePledges";
import { formatDistanceToNow } from "date-fns";
import { currencyService } from "@/services/currencyService";
import { toast } from 'sonner';
import { formatAmountWithKES } from '@/lib/currencyUtils';

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
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [currentPledge, setCurrentPledge] = useState<PledgeData | null>(null);
  const [currentPledgeId, setCurrentPledgeId] = useState<string | null>(null);
const [liveMeeting, setLiveMeeting] = useState<any>(null);
  const [paidUSD, setPaidUSD] = useState(0);
  const [paidKES, setPaidKES] = useState(0);
  const [unpaidUSD, setUnpaidUSD] = useState(0);
  const [unpaidKES, setUnpaidKES] = useState(0);
  
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

  // Separate paid and unpaid pledges and recalculate in real-time
  useEffect(() => {
    const calculatePledges = async () => {
      if (!eventId) return;
      
      try {
        const { data } = await supabase
          .rpc('get_public_pledges', { p_event_id: eventId });
        
        console.log('Public pledges data:', data);
        
        // Separate confirmed/paid and unconfirmed/unpaid
        const confirmed = (data || []).filter((p: any) => p.is_confirmed === true);
        const unconfirmed = (data || []).filter((p: any) => p.is_confirmed === false || p.is_confirmed === null);
        
        console.log('Confirmed pledges:', confirmed);
        console.log('Unconfirmed pledges:', unconfirmed);
        
        const paidUSDAmount = confirmed.reduce((sum: number, p: any) => sum + (Number(p.amount_in_usd) || 0), 0);
        const unpaidUSDAmount = unconfirmed.reduce((sum: number, p: any) => sum + (Number(p.amount_in_usd) || 0), 0);
        
        // Use fixed exchange rate: 1 USD = 128 KES
        const paidKESAmount = paidUSDAmount * 128;
        const unpaidKESAmount = unpaidUSDAmount * 128;
        
        setPaidUSD(paidUSDAmount);
        setPaidKES(paidKESAmount);
        setUnpaidUSD(unpaidUSDAmount);
        setUnpaidKES(unpaidKESAmount);
        
        console.log('Thermometer amounts:', { paidUSDAmount, paidKESAmount, unpaidUSDAmount, unpaidKESAmount });
      } catch (error) {
        console.error('Error calculating pledges:', error);
      }
    };
    
    calculatePledges();
  }, [eventId, realtimePledges]);

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

  const handlePledgeSubmit = async (formData: PledgeData) => {
    console.log('=== PLEDGE SUBMISSION STARTED ===');
    console.log('Form data:', formData);
    
    try {
      // Convert currency if needed
      const amountInUSD = await currencyService.convertAmount(formData.amount, formData.currency, 'USD');
      const amountInKES = await currencyService.convertAmount(formData.amount, formData.currency, 'KES');
      
      console.log('Converted amounts - USD:', amountInUSD, 'KES:', amountInKES);
      
      // Calculate payment deadline if it's a pledge
      let paymentDeadline = null;
      if (formData.paymentType === 'pledge' && formData.pledgeDurationDays) {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + formData.pledgeDurationDays);
        paymentDeadline = deadline.toISOString();
      }
      
      const generatedId = crypto.randomUUID();
      
      // For immediate payments, fetch the selected payment method details first
      let selectedPaymentMethod = null;
      if (formData.paymentType === 'immediate' && formData.paymentMethod) {
        const { data: methodData } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('type', formData.paymentMethod)
          .eq('is_active', true)
          .single();
        
        if (methodData) {
          selectedPaymentMethod = methodData;
        }
      }
      
      const { error: pledgeError } = await supabase
        .from('event_pledges')
        .insert(
          {
            id: generatedId,
            event_id: eventId!,
            name: formData.name,
            email: formData.email,
            amount: formData.amount,
            amount_in_usd: amountInUSD,
            amount_in_kes: amountInKES,
            currency: formData.currency,
            message: formData.message,
            payment_type: formData.paymentType,
            payment_method: formData.paymentMethod,
            pledge_duration_days: formData.paymentType === 'pledge' ? formData.pledgeDurationDays : null,
            payment_deadline: paymentDeadline
          } as any
        );

      console.log('Pledge creation result:', { pledgeError });

      if (pledgeError) {
        console.error('Pledge creation error:', pledgeError);
        toast.error('Failed to create pledge');
        return;
      }

      // For immediate payments, go directly to payment confirmation if method is selected
      if (formData.paymentType === 'immediate') {
        if (selectedPaymentMethod) {
          // Skip payment options and go directly to confirmation
          setCurrentPledge(formData);
          setCurrentPledgeId(generatedId);
          setSelectedPaymentMethod(selectedPaymentMethod);
          setShowPaymentConfirmation(true);
        } else {
          // Show payment options dialog
          setCurrentPledge(formData);
          setCurrentPledgeId(generatedId);
          setShowPaymentDialog(true);
        }
      } else {
        toast.success(`Pledge created! Payment due in ${formData.pledgeDurationDays} days`);
      }
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
                    {liveMeeting && event.is_active ? (
                      <a 
                        href={liveMeeting.join_url || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <Badge className="bg-green-500 hover:bg-green-600 text-white cursor-pointer">
                          Online
                        </Badge>
                      </a>
                    ) : (
                      <Badge variant="secondary" className="bg-red-500 text-white">
                        Offline
                      </Badge>
                    )}
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
                
                {/* Fundraising Room Section */}
                <div className="mt-4">
                  {liveMeeting && event.is_active ? (
                    <Button
                      onClick={() => window.open(liveMeeting.join_url || `/meeting/room/${liveMeeting.id}`, '_blank')}
                      className="w-full p-6 h-auto bg-gradient-secondary hover:bg-gradient-secondary/90 rounded-lg border-2 border-white/20"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <Video className="h-6 w-6 text-white" />
                          <div className="text-left">
                            <h3 className="font-semibold text-white text-lg">Fundraising Room</h3>
                            <p className="text-xs text-white/70">Click to join the live meeting</p>
                          </div>
                        </div>
                        <Badge className="bg-green-500 text-white">Live</Badge>
                      </div>
                    </Button>
                  ) : (
                    <div className="w-full p-6 bg-muted rounded-lg border-2 border-border">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <Video className="h-6 w-6 text-muted-foreground" />
                          <div className="text-left">
                            <h3 className="font-semibold text-muted-foreground text-lg">Fundraising Room</h3>
                            <p className="text-xs text-muted-foreground/70">Waiting for event to start</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-red-500 text-white">Offline</Badge>
                      </div>
                    </div>
                  )}
                </div>
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
                  <ImprovedThermometer
                    paidAmountUSD={paidUSD}
                    paidAmountKES={paidKES}
                    unpaidAmountUSD={unpaidUSD}
                    unpaidAmountKES={unpaidKES}
                    goalAmountUSD={event?.goal_amount || 50000}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Accordion type="multiple" defaultValue={[]} className="space-y-4">
              {/* Recent Pledges - Collapsible */}
              <AccordionItem value="donations" className="border rounded-lg">
                <Card className="border-0">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <CardTitle className="text-lg">Recent Donations</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="pt-0">
                      {pledgesLoading ? (
                        <PledgeSkeleton count={3} />
                      ) : pledgesError ? (
                        <ErrorFallback error={pledgesError} onRetry={reloadPledges} />
                      ) : realtimePledges.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No donations yet. Be the first to contribute!
                        </p>
                      ) : (
                        <>
                          <ScrollArea className="h-[400px]">
                            <div className="space-y-3 pr-4">
                              {realtimePledges.map((pledge) => (
                                <div key={pledge.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-sm">{pledge.display_name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(pledge.created_at), { addSuffix: true })}
                                      </span>
                                    </div>
                                    {pledge.message && (
                                      <p className="text-sm text-muted-foreground mb-2 italic">"{pledge.message}"</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-primary text-lg">
                                        {formatAmountWithKES(pledge.amount, pledge.currency, pledge.amount_in_kes).primary}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        {formatAmountWithKES(pledge.amount, pledge.currency, pledge.amount_in_kes).kes}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          {realtimePledges.length > 5 && (
                            <div className="text-center mt-2 pt-2 border-t">
                              <p className="text-xs text-muted-foreground">
                                Scroll to see all {realtimePledges.length} donations
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>

              {/* Pledge Form - Always Visible */}
              {event.is_active ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Make Your Pledge</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PledgeForm onSubmit={handlePledgeSubmit} />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Event Has Ended</h3>
                    <p className="text-muted-foreground">This fundraising event is no longer accepting pledges.</p>
                  </CardContent>
                </Card>
              )}
            </Accordion>
          </div>
        </div>

        {/* Leave Event Button */}
        <div className="fixed bottom-4 right-4">
          <Button variant="outline" onClick={handleLeaveEvent}>
            Leave Event
          </Button>
        </div>
      </div>

      {/* Payment Options Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Your Donation</DialogTitle>
            <DialogDescription>
              Choose your preferred payment method to complete your contribution.
            </DialogDescription>
          </DialogHeader>
          {currentPledge && currentPledgeId && (
            <ImprovedPaymentOptions
              pledgeId={currentPledgeId}
              amount={currentPledge.amount}
              currency={currentPledge.currency}
              email={currentPledge.email}
              name={currentPledge.name}
              onClose={() => setShowPaymentDialog(false)}
              onMethodSelected={(method) => {
                setSelectedPaymentMethod(method);
                setShowPaymentDialog(false);
                setShowPaymentConfirmation(true);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Direct Payment Confirmation Dialog */}
      <Dialog open={showPaymentConfirmation} onOpenChange={setShowPaymentConfirmation}>
        <DialogContent className="max-w-lg">
          {currentPledge && currentPledgeId && selectedPaymentMethod && (
            <PaymentConfirmation
              pledgeId={currentPledgeId}
              amount={currentPledge.amount}
              currency={currentPledge.currency}
              paymentMethod={selectedPaymentMethod}
              onBack={() => {
                setShowPaymentConfirmation(false);
                setShowPaymentDialog(true);
              }}
              onComplete={() => {
                setShowPaymentConfirmation(false);
                setCurrentPledge(null);
                setCurrentPledgeId(null);
                setSelectedPaymentMethod(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}