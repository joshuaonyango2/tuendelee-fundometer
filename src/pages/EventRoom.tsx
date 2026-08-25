import { useEffect, useState } from 'react';
import { Helmet } from "react-helmet-async";
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
import { FindMyPledge } from "@/components/FindMyPledge";
import { HelpDialog } from "@/components/HelpDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingSpinner, ConnectionStatus, ErrorFallback, ThermometerSkeleton, PledgeSkeleton } from "@/components/ui/loading-states";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimePledges } from "@/hooks/useRealtimePledges";
import { formatDistanceToNow } from "date-fns";
import { currencyService } from "@/services/currencyService";
import { toast } from 'sonner';
import { formatAmountWithKES } from '@/lib/currencyUtils';
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { localizedEventText } from "@/lib/eventText";

interface EventDetails {
  id: string;
  title: string;
  description: string;
  title_it?: string | null;
  title_fr?: string | null;
  title_sw?: string | null;
  description_it?: string | null;
  description_fr?: string | null;
  description_sw?: string | null;
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
  const { t, language } = useLanguage();
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
        .select('id, title, description, title_it, title_fr, title_sw, description_it, description_fr, description_sw, scheduled_at, duration_minutes, goal_amount, share_link, is_active, status, created_at, updated_at')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      setEvent(eventData as any);

      // Load live meeting if exists (check for both active and scheduled meetings)
      const { data: meetingData } = await supabase
        .from('event_meetings')
        .select(`
          id, event_id, platform_id, meeting_id, meeting_url, join_url, passcode, start_time, duration_minutes, status, created_at, updated_at,
          meeting_platforms (
            name,
            display_name
          )
        `)
        .eq('event_id', eventId)
        .in('status', ['active', 'scheduled'])
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (meetingData) {
        setLiveMeeting(meetingData);
      } else {
        setLiveMeeting(null);
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
      <Helmet>
        <title>{`${event.title} | Tuendelee Fundometer`}</title>
        <meta
          name="description"
          content={
            event.description
              ? `${event.description}`.slice(0, 155)
              : `Follow live fundraising progress for ${event.title} and make your pledge with the Tuendelee Foundation.`
          }
        />
        <link rel="canonical" href={`https://tuendelee-fundometer.lovable.app/event/${event.id}`} />
        <meta property="og:title" content={`${event.title} | Tuendelee Fundometer`} />
        <meta
          property="og:description"
          content={
            event.description
              ? `${event.description}`.slice(0, 155)
              : `Follow live fundraising progress for ${event.title}.`
          }
        />
        <meta property="og:url" content={`https://tuendelee-fundometer.lovable.app/event/${event.id}`} />
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <h1 className="sr-only">{`${event.title} — Fundraising Room`}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-3xl font-bold">{event.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <HelpDialog />
                    <ConnectionStatus 
                      isConnected={connectionStatus.isConnected}
                      isReconnecting={connectionStatus.isReconnecting}
                    />
                    {liveMeeting ? (
                      <Badge 
                        className="bg-green-500 hover:bg-green-600 text-white cursor-pointer"
                        onClick={() => window.open(liveMeeting.join_url || liveMeeting.meeting_url, '_blank', 'noopener,noreferrer')}
                      >
                        {t("room.online")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-500 text-white">
                        {t("room.offline")}
                      </Badge>
                    )}
                    <Badge variant={event.is_active ? "default" : "secondary"}>
                      {event.is_active ? t("room.live") : t("room.ended")}
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
                {/* Find My Pledge Button */}
                <div className="mb-6 flex justify-center">
                  <FindMyPledge eventId={eventId!} />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("room.date")}</p>
                      <p className="font-semibold">
                        {new Date(event.scheduled_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("room.time")}</p>
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
                      <p className="text-sm text-muted-foreground">{t("room.participants")}</p>
                      <p className="font-semibold">{activeUsers}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("room.duration")}</p>
                      <p className="font-semibold">{event.duration_minutes} {t("room.minutes")}</p>
                    </div>
                  </div>
                </div>
                
                {/* Fundraising Room Section */}
                <div className="mt-4">
                  {liveMeeting ? (
                    <Button
                      onClick={() => window.open(liveMeeting.join_url || liveMeeting.meeting_url, '_blank', 'noopener,noreferrer')}
                      className="w-full p-6 h-auto bg-gradient-secondary hover:bg-gradient-secondary/90 rounded-lg border-2 border-white/20"
                    >
                      <div className="flex flex-col w-full gap-3">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <Video className="h-6 w-6 text-white" />
                            <div className="text-left">
                              <h2 className="font-semibold text-white text-lg">{t("room.joinMeeting")}</h2>
                              <p className="text-xs text-white/70">
                                {liveMeeting.meeting_platforms?.display_name || t("room.virtualMeeting")}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-500 text-white">
                            {liveMeeting.status === 'active' ? t("room.liveNow") : t("room.scheduled")}
                          </Badge>
                        </div>
                         <div className="w-full bg-white/10 rounded p-3 text-left text-xs text-white/90 space-y-2">
                          {liveMeeting.description ? (
                            <div className="whitespace-pre-wrap">{liveMeeting.description}</div>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span className="font-medium">{t("room.meetingId")}:</span>
                                <span className="font-mono">{liveMeeting.meeting_id}</span>
                              </div>
                              {liveMeeting.passcode && (
                                <div className="flex justify-between">
                                  <span className="font-medium">{t("room.passcode")}:</span>
                                  <span className="font-mono font-semibold">{liveMeeting.passcode}</span>
                                </div>
                              )}
                              {liveMeeting.start_time && (
                                <div className="flex justify-between">
                                  <span className="font-medium">{t("room.time")}:</span>
                                  <span>{new Date(liveMeeting.start_time).toLocaleString()}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <p className="text-xs text-white/80 text-center">{t("room.openNewTab")}</p>
                      </div>
                    </Button>
                  ) : (
                    <div className="w-full p-6 bg-muted rounded-lg border-2 border-border">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <Video className="h-6 w-6 text-muted-foreground" />
                          <div className="text-left">
                            <h2 className="font-semibold text-muted-foreground text-lg">{t("room.fundraisingRoom")}</h2>
                            <p className="text-xs text-muted-foreground/70">{t("room.noMeeting")}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-red-500 text-white">{t("room.offline")}</Badge>
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
                  {t("room.progress")}
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
            <Accordion type="multiple" defaultValue={["donations"]} className="space-y-4">
              {/* Recent Pledges - Collapsible */}
              <AccordionItem value="donations" className="border rounded-lg">
                <Card className="border-0">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <CardTitle className="text-lg">{t("room.recentDonations")}</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="pt-0">
                      {pledgesLoading ? (
                        <PledgeSkeleton count={3} />
                      ) : pledgesError ? (
                        <ErrorFallback error={pledgesError} onRetry={reloadPledges} />
                      ) : realtimePledges.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          {t("room.noDonations")}
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
                                {t("room.scrollAll")} ({realtimePledges.length})
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
                    <CardTitle className="text-lg">{t("room.makePledge")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PledgeForm onSubmit={handlePledgeSubmit} />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{t("room.eventEnded")}</h3>
                    <p className="text-muted-foreground">{t("room.eventEndedBody")}</p>
                  </CardContent>
                </Card>
              )}
            </Accordion>
          </div>
        </div>

        {/* Leave Event Button */}
        <div className="fixed bottom-4 right-4">
          <Button variant="outline" onClick={handleLeaveEvent}>
            {t("room.leave")}
          </Button>
        </div>
      </div>

      {/* Payment Options Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("room.completeDonation")}</DialogTitle>
            <DialogDescription>
              {t("room.completeDonationBody")}
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