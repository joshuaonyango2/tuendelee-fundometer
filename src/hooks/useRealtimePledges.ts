import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseRealtime } from './useSupabaseRealtime';
import { useOptimisticUpdates } from './useOptimisticUpdates';
import { toast } from '@/components/ui/use-toast';

export interface RealtimePledge {
  id: string;
  event_id: string;
  display_name: string;
  amount: number;
  amount_in_usd: number;
  amount_in_kes: number;
  currency: string;
  message?: string;
  payment_type: string;
  created_at: string;
}

interface UseRealtimePledgesOptions {
  eventId: string;
  enableOptimistic?: boolean;
}

export function useRealtimePledges({ eventId, enableOptimistic = true }: UseRealtimePledgesOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { status, subscribeToTable } = useSupabaseRealtime({
    enableAutoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 2000,
    onConnectionChange: (status) => {
      if (!status.isConnected && status.lastError) {
        setError('Failed to subscribe to real-time updates');
        toast({
          title: "Connection Error",
          description: "Failed to subscribe to real-time updates",
          variant: "destructive",
        });
      } else if (status.isConnected && error) {
        setError(null);
        toast({
          title: "Connected",
          description: "Real-time updates restored",
        });
      }
    }
  });

  const {
    items: pledges,
    addOptimisticOperation,
    confirmOperation,
    rejectOperation,
    setServerItems,
    getItemStatus
  } = useOptimisticUpdates<RealtimePledge>();

  // Load initial pledges
  const loadPledges = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .rpc('get_public_pledges', { p_event_id: eventId });

      if (error) throw error;
      
      setServerItems(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load pledges';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventId, setServerItems]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = subscribeToTable<RealtimePledge>(
      'event_pledges',
      'INSERT',
      (payload) => {
        if (payload.new.event_id === eventId) {
          // Add new pledge to the list
          setServerItems((prev: RealtimePledge[]) => [payload.new, ...prev]);
          
          toast({
            title: "New Donation!",
            description: `${payload.new.display_name} donated ${payload.new.currency} ${payload.new.amount}`,
          });
        }
      },
      { column: 'event_id', eq: eventId }
    );

    return unsubscribe;
  }, [eventId, subscribeToTable, setServerItems]);

  // Create pledge with optimistic update
  const createPledge = useCallback(async (pledgeData: Omit<RealtimePledge, 'id' | 'created_at'>) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticPledge: RealtimePledge = {
      ...pledgeData,
      id: tempId,
      created_at: new Date().toISOString()
    };

    let operationId: string | null = null;

    if (enableOptimistic) {
      operationId = addOptimisticOperation('create', optimisticPledge);
    }

    try {
      const { data, error } = await supabase
        .from('event_pledges')
        .insert({
          event_id: pledgeData.event_id,
          name: pledgeData.display_name,
          amount: pledgeData.amount,
          amount_in_usd: pledgeData.amount_in_usd,
          amount_in_kes: pledgeData.amount_in_kes,
          currency: pledgeData.currency,
          message: pledgeData.message,
          payment_type: pledgeData.payment_type
        })
        .select()
        .single();

      if (error) throw error;

      if (operationId) {
        confirmOperation(operationId, {
          ...data,
          display_name: data.name
        } as RealtimePledge);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create pledge';
      
      if (operationId) {
        rejectOperation(operationId, message);
      }
      
      throw err;
    }
  }, [addOptimisticOperation, confirmOperation, rejectOperation, enableOptimistic]);

  // Get total amount raised
  const totalRaised = pledges.reduce((sum, pledge) => sum + pledge.amount_in_usd, 0);

  // Get pledge count
  const pledgeCount = pledges.length;

  // Get recent pledges (last 10)
  const recentPledges = pledges.slice(0, 10);

  useEffect(() => {
    loadPledges();
  }, [loadPledges]);

  return {
    pledges,
    recentPledges,
    totalRaised,
    pledgeCount,
    isLoading,
    error,
    connectionStatus: status,
    createPledge,
    reloadPledges: loadPledges,
    getItemStatus
  };
}