import { useEffect, useState } from 'react';
import { Pledge } from '@/components/RecentPledges';

// Simulated real-time updates using polling
// In production, this would use WebSockets or a real-time database like Supabase
export function useRealtimeUpdates(initialPledges: Pledge[] = []) {
  const [pledges, setPledges] = useState<Pledge[]>(initialPledges);
  const [listeners] = useState<Set<(pledges: Pledge[]) => void>>(new Set());

  useEffect(() => {
    // Load pledges from localStorage on mount
    const stored = localStorage.getItem('fundraising_pledges');
    if (stored) {
      try {
        const parsedPledges = JSON.parse(stored);
        setPledges(parsedPledges.map((p: any) => ({
          ...p,
          timestamp: new Date(p.timestamp)
        })));
      } catch (error) {
        console.error('Failed to load pledges:', error);
      }
    }

    // Poll for updates every 5 seconds (simulating real-time)
    const interval = setInterval(() => {
      const stored = localStorage.getItem('fundraising_pledges');
      if (stored) {
        try {
          const parsedPledges = JSON.parse(stored);
          setPledges(parsedPledges.map((p: any) => ({
            ...p,
            timestamp: new Date(p.timestamp)
          })));
        } catch (error) {
          console.error('Failed to load pledges:', error);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const addPledge = (pledge: Pledge) => {
    const newPledges = [pledge, ...pledges];
    setPledges(newPledges);
    
    // Persist to localStorage
    localStorage.setItem('fundraising_pledges', JSON.stringify(newPledges));
    
    // Notify all listeners
    listeners.forEach(listener => listener(newPledges));
  };

  const resetPledges = () => {
    setPledges([]);
    localStorage.removeItem('fundraising_pledges');
    listeners.forEach(listener => listener([]));
  };

  const subscribe = (callback: (pledges: Pledge[]) => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };

  return {
    pledges,
    addPledge,
    resetPledges,
    subscribe
  };
}