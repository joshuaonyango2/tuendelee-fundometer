import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';

export interface RealtimeStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  lastError: string | null;
  connectionAttempts: number;
}

export interface UseSupabaseRealtimeOptions {
  enableAutoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  onConnectionChange?: (status: RealtimeStatus) => void;
}

export function useSupabaseRealtime(options: UseSupabaseRealtimeOptions = {}) {
  const {
    enableAutoReconnect = true,
    maxReconnectAttempts = 5,
    reconnectDelay = 2000,
    onConnectionChange
  } = options;

  const [status, setStatus] = useState<RealtimeStatus>({
    isConnected: false,
    isReconnecting: false,
    lastError: null,
    connectionAttempts: 0
  });

  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribersRef = useRef<Map<string, Set<(payload: any) => void>>>(new Map());

  const updateStatus = useCallback((updates: Partial<RealtimeStatus>) => {
    setStatus(prev => {
      const newStatus = { ...prev, ...updates };
      onConnectionChange?.(newStatus);
      return newStatus;
    });
  }, [onConnectionChange]);

  const handleReconnect = useCallback(() => {
    if (!enableAutoReconnect || status.connectionAttempts >= maxReconnectAttempts) {
      updateStatus({ isReconnecting: false });
      return;
    }

    updateStatus({ 
      isReconnecting: true, 
      connectionAttempts: status.connectionAttempts + 1 
    });

    reconnectTimeoutRef.current = setTimeout(() => {
      // Resubscribe to all channels
      const channels = Array.from(channelsRef.current.keys());
      channels.forEach(channelKey => {
        const subscribers = subscribersRef.current.get(channelKey);
        if (subscribers && subscribers.size > 0) {
          // Re-establish subscriptions
          const [tableName, eventType] = channelKey.split(':');
          subscribers.forEach(callback => {
            subscribeToTable(tableName, eventType as any, callback);
          });
        }
      });
    }, reconnectDelay * status.connectionAttempts);
  }, [enableAutoReconnect, maxReconnectAttempts, reconnectDelay, status.connectionAttempts, updateStatus]);

  const subscribeToTable = useCallback(<T = any>(
    tableName: string,
    eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: (payload: { new: T; old: T; eventType: string }) => void,
    filter?: { column: string; eq: string | number }
  ) => {
    const channelKey = `${tableName}:${eventType}`;
    let channel = channelsRef.current.get(channelKey);

    if (!channel) {
      channel = supabase.channel(`realtime:${channelKey}:${Date.now()}`);
      channelsRef.current.set(channelKey, channel);
    }

    // Track subscribers
    if (!subscribersRef.current.has(channelKey)) {
      subscribersRef.current.set(channelKey, new Set());
    }
    subscribersRef.current.get(channelKey)!.add(callback);

    const config: any = {
      event: eventType,
      schema: 'public',
      table: tableName
    };

    if (filter) {
      config.filter = `${filter.column}=eq.${filter.eq}`;
    }

    channel
      .on('postgres_changes', config, (payload) => {
        callback({
          new: payload.new as T,
          old: payload.old as T,
          eventType: payload.eventType
        });
      })
      .on('presence', { event: 'sync' }, () => {
        updateStatus({ isConnected: true, isReconnecting: false, lastError: null });
      })
      .on('presence', { event: 'join' }, () => {
        updateStatus({ isConnected: true });
      })
      .on('presence', { event: 'leave' }, () => {
        updateStatus({ isConnected: false });
        if (enableAutoReconnect) {
          handleReconnect();
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          updateStatus({ 
            isConnected: true, 
            isReconnecting: false, 
            lastError: null,
            connectionAttempts: 0 
          });
        } else if (status === 'CHANNEL_ERROR') {
          const error = 'Failed to subscribe to real-time updates';
          updateStatus({ 
            isConnected: false, 
            lastError: error 
          });
          toast({
            title: "Connection Error",
            description: error,
            variant: "destructive",
          });
          if (enableAutoReconnect) {
            handleReconnect();
          }
        }
      });

    return () => {
      subscribersRef.current.get(channelKey)?.delete(callback);
      if (subscribersRef.current.get(channelKey)?.size === 0) {
        channel?.unsubscribe();
        channelsRef.current.delete(channelKey);
        subscribersRef.current.delete(channelKey);
      }
    };
  }, [updateStatus, enableAutoReconnect, handleReconnect]);

  const subscribeToPresence = useCallback((
    roomId: string,
    onPresenceChange: (presences: any) => void
  ) => {
    const channel = supabase.channel(roomId);
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        onPresenceChange(newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        onPresenceChange({ type: 'join', key, newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        onPresenceChange({ type: 'leave', key, leftPresences });
      })
      .subscribe();

    return {
      track: (presence: any) => channel.track(presence),
      untrack: () => channel.untrack(),
      unsubscribe: () => channel.unsubscribe()
    };
  }, []);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Cleanup all channels
      channelsRef.current.forEach(channel => channel.unsubscribe());
      channelsRef.current.clear();
      subscribersRef.current.clear();
    };
  }, []);

  return {
    status,
    subscribeToTable,
    subscribeToPresence,
    forceReconnect: handleReconnect
  };
}