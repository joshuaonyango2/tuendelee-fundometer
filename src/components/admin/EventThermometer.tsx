import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImprovedThermometer } from '@/components/ImprovedThermometer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EventThermometerProps {
  eventId: string;
}

export function EventThermometer({ eventId }: EventThermometerProps) {
  const [totalUSD, setTotalUSD] = useState(0);
  const [totalKES, setTotalKES] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadPledgeData = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_public_pledges', { p_event_id: eventId });

      if (error) throw error;

      const usd = data?.reduce((sum: number, p: any) => sum + (p.amount_in_usd || 0), 0) || 0;
      const kes = data?.reduce((sum: number, p: any) => sum + (p.amount_in_kes || 0), 0) || 0;

      setTotalUSD(usd);
      setTotalKES(kes);
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

    // Subscribe to real-time updates
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
          currentAmountUSD={totalUSD}
          currentAmountKES={totalKES}
        />
      </CardContent>
    </Card>
  );
}
