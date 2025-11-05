import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, TrendingUp, Users, FileText, Plus, Video } from 'lucide-react';
import { EventThermometer } from '@/components/admin/EventThermometer';
import { ParticipantsView } from '@/components/admin/ParticipantsView';
import { PledgeReportsView } from '@/components/admin/PledgeReportsView';
import { ManualPledgeEntry } from '@/components/admin/ManualPledgeEntry';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function EventManagement() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdminForEvent, setIsAdminForEvent] = useState<boolean | null>(null);
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    if (!eventId) return;
    loadEvent();
    loadMeetings();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('fundraising_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
      // Determine if the current user is the admin for this event
      const { data: userData } = await supabase.auth.getUser();
      setIsAdminForEvent(userData?.user?.id ? userData.user.id === data.admin_id : false);
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Failed to load event');
      navigate('/admin/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMeetings = async () => {
    if (!eventId) return;
    
    try {
      const { data, error } = await supabase
        .from('event_meetings')
        .select(`
          *,
          platform:meeting_platforms(*)
        `)
        .eq('event_id', eventId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error loading meetings:', error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventId) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('fundraising_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Event deleted successfully');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <p>Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <p>Event not found</p>
            <Button onClick={() => navigate('/admin/dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground">{event.description}</p>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Event
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this event and all associated data including pledges, participants, and meetings.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteEvent}
                  disabled={isDeleting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Event'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Tabs defaultValue="thermometer" className="space-y-4">
          <TabsList>
            <TabsTrigger value="thermometer">
              <TrendingUp className="w-4 h-4 mr-2" />
              Thermometer
            </TabsTrigger>
            <TabsTrigger value="meetings">
              <Video className="w-4 h-4 mr-2" />
              Meetings
            </TabsTrigger>
            <TabsTrigger value="participants">
              <Users className="w-4 h-4 mr-2" />
              Participants
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Plus className="w-4 h-4 mr-2" />
              Add Pledge
            </TabsTrigger>
          </TabsList>

          <TabsContent value="thermometer" className="space-y-4">
            <EventThermometer eventId={eventId!} />
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Your Scheduled Meetings</h3>
                {meetings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No meetings scheduled yet.</p>
                ) : (
                  <div className="space-y-4">
                    {meetings.map((meeting) => (
                      <div key={meeting.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Video className="w-5 h-5 text-primary" />
                            <span className="font-medium">{meeting.platform?.display_name}</span>
                            <Badge variant={meeting.status === 'scheduled' ? 'secondary' : 'default'}>
                              {meeting.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Start Time: </span>
                            <span>{format(new Date(meeting.start_time), 'PPpp')}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration: </span>
                            <span>{meeting.duration_minutes} minutes</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Meeting ID: </span>
                            <span className="font-mono">{meeting.meeting_id}</span>
                          </div>
                          {meeting.passcode && (
                            <div>
                              <span className="text-muted-foreground">Passcode: </span>
                              <span className="font-mono font-semibold">{meeting.passcode}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => window.open(meeting.host_url || meeting.join_url, '_blank', 'noopener,noreferrer')}
                            className="flex-1"
                          >
                            Join as Host
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(meeting.join_url);
                              toast.success('Participant link copied!');
                            }}
                          >
                            Copy Participant Link
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants" className="space-y-4">
            <ParticipantsView eventId={eventId!} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            {isAdminForEvent ? (
              <PledgeReportsView eventId={eventId!} />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Admin sign-in required to view pledge reports.</p>
                  <Button className="mt-4" onClick={() => navigate('/admin/auth')}>Sign in as Admin</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <ManualPledgeEntry eventId={eventId!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
