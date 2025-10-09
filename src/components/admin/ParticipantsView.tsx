import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Users } from 'lucide-react';

interface Participant {
  attendee_name: string;
  joined_at: string;
  last_activity: string;
  total_pledged: number;
  pledge_count: number;
}

interface ParticipantsViewProps {
  eventId: string;
}

export function ParticipantsView({ eventId }: ParticipantsViewProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select('*')
        .eq('event_id', eventId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      setParticipants(data || []);
    } catch (error) {
      console.error('Error loading participants:', error);
      toast.error('Failed to load participants');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!eventId) return;

    loadParticipants();

    // Subscribe to real-time updates for sessions and pledges
    const channel = supabase
      .channel('admin-participants')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_sessions',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          console.log('Session change detected, reloading participants...');
          loadParticipants();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_pledges',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          console.log('New pledge detected, reloading participants...');
          loadParticipants();
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
          console.log('Pledge updated, reloading participants...');
          loadParticipants();
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
          <p>Loading participants...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Event Participants
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Joined At</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Pledges</TableHead>
              <TableHead>Total Pledged</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No participants yet
                </TableCell>
              </TableRow>
            ) : (
              participants.map((participant, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">
                    {participant.attendee_name || 'Anonymous'}
                  </TableCell>
                  <TableCell>
                    {participant.joined_at ? format(new Date(participant.joined_at), 'MMM dd, HH:mm') : '-'}
                  </TableCell>
                  <TableCell>
                    {participant.last_activity ? format(new Date(participant.last_activity), 'MMM dd, HH:mm') : '-'}
                  </TableCell>
                  <TableCell>{participant.pledge_count || 0}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">${(participant.total_pledged || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        KES {((participant.total_pledged || 0) * 128).toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
