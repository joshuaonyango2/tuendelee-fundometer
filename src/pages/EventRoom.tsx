import { T } from "@/components/T";
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
import { notify } from "@/lib/notify";
import { formatAmountWithKES } from '@/lib/currencyUtils';
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { localizedEventText } from "@/lib/eventText";
import { Linkify } from "@/components/Linkify";
import { useEventTexts } from "@/hooks/useEventTexts";

interface EventDetails {
  id: string;
  title: string;
  description: string;
  title_it?: string | null;
  title_fr?: string | null;
  title_sw?: string | null;
  title_es?: string | null;
  title_de?: string | null;
  description_it?: string | null;
  description_fr?: string | null;
  description_sw?: string | null;
  description_es?: string | null;
  description_de?: string | null;
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
  const { t, tr, language } = useLanguage();
  const { custom } = useEventTexts(eventId);
  const et = (key: string) => custom(key) ?? t(key);
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

  // Browsing is public; a donor session is established from the pledge details only on submission.
  const ensureDonorSession = async (formData: PledgeData) => {
    if (!eventId) throw new Error('Event not found');
    const saved = localStorage.getItem('event_session');
    if (saved) {
      try {
        const session = JSON.parse(saved);
        if (session.eventId === eventId && session.attendeeEmail === formData.email.trim()) {
          const { data } = await supabase.rpc('get_session_by_token', { p_session_token: session.sessionToken }).single();
          if (data?.event_id === eventId) {
            const { error } = await supabase.rpc('update_session_activity', { p_session_token: session.sessionToken });
            if (!error) return;
          }
        }
      } catch {
        // An invalid or expired saved session is replaced, not used for payment authorization.
      }
    }
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const { error } = await supabase.from('event_sessions').insert({
      event_id: eventId, session_token: sessionToken,
      attendee_name: formData.name.trim(), attendee_email: formData.email.trim(), preferred_language: language,
    });
    if (error) throw error;
    localStorage.setItem('event_session', JSON.stringify({
      eventId, sessionToken, attendeeName: formData.name.trim(), attendeeEmail: formData.email.trim(),
    }));
  };

  const loadEventDetails = async () => {
    if (!eventId) return;

    try {
      setIsEventLoading(true);
      
      // Load event details
      const { data: eventData, error: eventError } = await supabase
        .from('fundraising_events')
        .select('id, title, description, title_it, title_fr, title_sw, title_es, title_de, description_it, description_fr, description_sw, description_es, description_de, scheduled_at, duration_minutes, goal_amount, share_link, is_active, status, meeting_link, meeting_passcode, created_at, updated_at')
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

      const adminLink = (eventData as any)?.meeting_link as string | null;

      if (meetingData) {
        setLiveMeeting(meetingData);
      } else if (adminLink) {
        // Admin pasted an already-created meeting link on the event itself
        setLiveMeeting({
          id: `event-link-${eventId}`,
          event_id: eventId,
          meeting_id: '',
          meeting_url: adminLink,
          join_url: adminLink,
          passcode: (eventData as any)?.meeting_passcode ?? null,
          start_time: (eventData as any)?.scheduled_at ?? null,
          duration_minutes: (eventData as any)?.duration_minutes ?? null,
          status: (eventData as any)?.is_active ? 'active' : 'scheduled',
          meeting_platforms: { name: 'external', display_name: 'Virtual meeting' },
        } as any);
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
      notify.error('Failed to load event details');
    } finally {
      setIsEventLoading(false);
    }
  };

  const handlePledgeSubmit = async (formData: PledgeData) => {
    console.log('=== PLEDGE SUBMISSION STARTED ===');
    console.log('Form data:', formData);
    
    try {
      if (!eventId || !event?.is_active) throw new Error('This event is not open for pledges');
      await ensureDonorSession(formData);
      // Convert currency if needed
      const amountInUSD = await currencyService.convertAmount(formData.amount, formData.currency, 'USD');
      const amountInKES = await currencyService.convertAmount(formData.amount, formData.currency, 'KES');
      
      console.log('Converted amounts - USD:', amountInUSD, 'KES:', amountInKES);
      
      // Calculate payment deadline if it's a pledge
      let paymentDeadline = null;
      if (formData.paymentType === 'pledge' && formData.pledgeDurationDays !== undefined) {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + formData.pledgeDurationDays);
        if (formData.pledgeDurationDays === 0) deadline.setHours(23, 59, 0, 0);
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
            event_id: eventId,
            preferred_language: language,
            name: formData.name,
            email: formData.email.trim(),
            donor_phone: formData.phone?.replace(/[\s()-]/g, ""),
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
        throw pledgeError;
      }

      const sessionData = localStorage.getItem('event_session');
      if (sessionData) {
        const { sessionToken } = JSON.parse(sessionData);
        const { error: emailError } = await supabase.functions.invoke('send-pledge-email', {
          body: { pledgeId: generatedId, kind: 'pledge_created', sessionToken }
        });

        if (emailError) {
          console.error('Failed to send pledge confirmation email:', emailError);
        }
      }

      await reloadPledges();

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
        notify.success(
          formData.pledgeDurationDays === 0
            ? 'Pledge created! Payment due today'
            : `Pledge created! Payment due in ${formData.pledgeDurationDays} days`
        );
      }
    } catch (error) {
      console.error('Error processing pledge:', error);
      throw error;
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
          <p className="text-muted-foreground"><T>{"Loading event..."}</T></p>
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
            <h3 className="font-semibold text-lg mb-2"><T>{"Event Not Found"}</T></h3>
            <p className="text-muted-foreground"><T>{"The event you're looking for doesn't exist or has been removed."}</T></p>
            <Button onClick={() => navigate('/')} className="mt-4">
              <T>{"Go Home"}</T>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const localized = localizedEventText(event, language, tr);

  return (
    <div className="min-h-screen bg-gradient-background">
      <Helmet>
        <title>{`${localized.title} | Tuendelee Fundometer`}</title>
        <meta
          name="description"
          content={
            localized.description
              ? `${localized.description}`.slice(0, 155)
              : `Follow live fundraising progress for ${localized.title} and make your pledge with the Tuendelee Foundation.`
          }
        />
        <link rel="canonical" href={`https://tuendelee-fundometer.lovable.app/event/${event.id}`} />
        <meta property="og:title" content={`${localized.title} | Tuendelee Fundometer`} />
        <meta
          property="og:description"
          content={
            localized.description
              ? `${localized.description}`.slice(0, 155)
              : `Follow live fundraising progress for ${localized.title}.`
          }
        />
        <meta property="og:url" content={`https://tuendelee-fundometer.lovable.app/event/${event.id}`} />
      </Helmet>
      <div className="container mx-auto px-4 py-4 pb-20">
        <header className="mb-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold break-words min-w-0 flex-1">{localized.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <LanguageSwitcher />
              <HelpDialog />
              <Badge variant={event.is_active ? "default" : "secondary"}>{event.is_active ? t("room.live") : t("room.ended")}</Badge>
            </div>
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="details" className="border-b">
              <AccordionTrigger className="py-2"><T>{"Event details"}</T></AccordionTrigger>
              <AccordionContent className="space-y-4">
                {localized.description && <Linkify text={localized.description} className="whitespace-pre-line text-muted-foreground" />}
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
                
                {liveMeeting && (
                  <Button variant="outline" onClick={() => window.open(liveMeeting.join_url || liveMeeting.meeting_url, '_blank', 'noopener,noreferrer')}>
                    <Video className="mr-2 h-4 w-4" />{t("room.joinMeeting")}
                  </Button>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            {/* Fundraising Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-6 w-6 text-success" />
                  {et("room.progress")}
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
            <Accordion type="multiple" defaultValue={["donations"]}>
              {/* Recent Pledges - Collapsible */}
              <AccordionItem value="donations" className="border rounded-lg">
                <Card className="border-0">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <CardTitle className="text-lg">{et("room.recentDonations")}</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="pt-0">
                      {pledgesLoading ? (
                        <PledgeSkeleton count={3} />
                      ) : pledgesError ? (
                        <ErrorFallback error={pledgesError} onRetry={reloadPledges} />
                      ) : realtimePledges.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          {et("room.noDonations")}
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

            </Accordion>
          </div>

          <div id="make-pledge" className="space-y-4 min-w-0 order-1 lg:order-2">
              {/* Pledge Form - Always Visible */}
              {event.is_active ? (
                <PledgeForm title={et("room.makePledge")} onSubmit={handlePledgeSubmit} />
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{et("room.eventEnded")}</h3>
                    <p className="text-muted-foreground">{et("room.eventEndedBody")}</p>
                  </CardContent>
                </Card>
              )}
            <FindMyPledge eventId={event.id} />
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
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
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
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
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