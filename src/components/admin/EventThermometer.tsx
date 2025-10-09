import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImprovedThermometer } from '@/components/ImprovedThermometer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { currencyService } from '@/services/currencyService';

interface EventThermometerProps {
  eventId: string;
}

export function EventThermometer({ eventId }: EventThermometerProps) {
  const [paidUSD, setPaidUSD] = useState(0);
  const [paidKES, setPaidKES] = useState(0);
  const [unpaidUSD, setUnpaidUSD] = useState(0);
  const [unpaidKES, setUnpaidKES] = useState(0);
  const [goalAmount, setGoalAmount] = useState(50000);
  const [isLoading, setIsLoading] = useState(true);

  const loadPledgeData = async () => {
    try {
      // Load event to get goal amount
      const { data: eventData, error: eventError } = await supabase
        .from('fundraising_events')
        .select('goal_amount')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      if (eventData) {
        setGoalAmount(eventData.goal_amount);
      }

      // Load pledges - use admin function to get full data including is_confirmed
      const { data, error } = await supabase
        .rpc('get_admin_pledges', { p_event_id: eventId });

      if (error) {
        console.error('Error fetching pledges:', error);
        throw error;
      }

      console.log('All pledges:', data);

      // Separate confirmed/paid and unconfirmed/unpaid pledges
      const confirmedPledges = (data || []).filter((p: any) => p.is_confirmed === true);
      const unconfirmedPledges = (data || []).filter((p: any) => p.is_confirmed === false || p.is_confirmed === null);
      
      console.log('Confirmed pledges:', confirmedPledges);
      console.log('Unconfirmed pledges:', unconfirmedPledges);
      
      const paidUSDAmount = confirmedPledges.reduce((sum: number, p: any) => sum + (Number(p.amount_in_usd) || 0), 0);
      const unpaidUSDAmount = unconfirmedPledges.reduce((sum: number, p: any) => sum + (Number(p.amount_in_usd) || 0), 0);
      
      // Use fixed exchange rate: 1 USD = 128 KES
      const paidKESAmount = paidUSDAmount * 128;
      const unpaidKESAmount = unpaidUSDAmount * 128;

      setPaidUSD(paidUSDAmount);
      setPaidKES(paidKESAmount);
      setUnpaidUSD(unpaidUSDAmount);
      setUnpaidKES(unpaidKESAmount);
    } catch (error) {
      console.error('Error loading pledge data:', error);
      toast.error('Failed to load fundraising data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!eventId) return;

    loadPledgeData();

    // Subscribe to real-time updates for both INSERT and UPDATE
    const channel = supabase
      .channel('admin-pledge-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_pledges',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          console.log('New pledge detected, reloading...');
          loadPledgeData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'event_pledges',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          console.log('Pledge updated, reloading...');
          loadPledgeData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Loading thermometer data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fundraising Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ImprovedThermometer 
          paidAmountUSD={paidUSD}
          paidAmountKES={paidKES}
          unpaidAmountUSD={unpaidUSD}
          unpaidAmountKES={unpaidKES}
          goalAmountUSD={goalAmount}
        />
      </CardContent>
    </Card>
  );
}
