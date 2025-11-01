import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface Booking {
  id: string;
  session_date: string;
  subject: string;
  student_id: string;
  start_time: string;
  end_time: string;
  profiles?: {
    full_name: string;
  };
}

interface ProgressForm {
  booking_id: string;
  subject: string;
  date_of_session: string;
  progress_note: string;
  skill_level: 'Needs support' | 'Satisfactory' | 'Good' | 'Excellent';
  homework_next_action: string;
}

export function SessionProgress() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [completedSessions, setCompletedSessions] = useState<Booking[]>([]);
  const [tutorId, setTutorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Booking | null>(null);
  const [formData, setFormData] = useState<ProgressForm>({
    booking_id: '',
    subject: '',
    date_of_session: '',
    progress_note: '',
    skill_level: 'Satisfactory',
    homework_next_action: '',
  });

  useEffect(() => {
    if (user) {
      fetchTutorData();
    }
  }, [user]);

  const fetchTutorData = async () => {
    try {
      const { data: tutorData } = await supabase
        .from('tutors')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (tutorData) {
        setTutorId(tutorData.id);
        await fetchCompletedSessions(tutorData.id);
      }
    } catch (error) {
      console.error('Error fetching tutor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedSessions = async (tutorId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('tutor_id', tutorId)
        .eq('status', 'completed')
        .order('session_date', { ascending: false });

      if (error) throw error;
      
      // Fetch student names separately
      const sessionsWithProfiles = await Promise.all(
        (data || []).map(async (session) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', session.student_id)
            .maybeSingle();
          
          return {
            ...session,
            profiles: profile
          };
        })
      );
      
      setCompletedSessions(sessionsWithProfiles as Booking[]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load completed sessions',
        variant: 'destructive',
      });
    }
  };

  const handleOpenDialog = (session: Booking) => {
    setSelectedSession(session);
    setFormData({
      booking_id: session.id,
      subject: session.subject || '',
      date_of_session: session.session_date,
      progress_note: '',
      skill_level: 'Satisfactory',
      homework_next_action: '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tutorId || !selectedSession) return;

    try {
      const { error: progressError } = await supabase
        .from('learner_progress')
        .insert({
          learner_id: selectedSession.student_id,
          tutor_id: tutorId,
          booking_id: formData.booking_id,
          subject: formData.subject,
          date_of_session: formData.date_of_session,
          progress_note: formData.progress_note,
          skill_level: formData.skill_level,
          homework_next_action: formData.homework_next_action,
        });

      if (progressError) throw progressError;

      // Create notification for student
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedSession.student_id,
          title: 'Progress Update',
          message: `Your tutor has updated your progress for ${formData.subject}.`,
          type: 'progress',
          related_id: formData.booking_id,
        });

      if (notifError) console.error('Notification error:', notifError);

      toast({
        title: 'Success',
        description: 'Progress added successfully',
      });

      setDialogOpen(false);
      setSelectedSession(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add progress',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Session Progress</h2>
      </div>

      <div className="grid gap-4">
        {completedSessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No completed sessions yet
              </p>
            </CardContent>
          </Card>
        ) : (
          completedSessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{session.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Student: {session.profiles?.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Date: {format(new Date(session.session_date), 'PPP')}
                    </p>
                  </div>
                  <Badge variant="secondary">Completed</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Dialog open={dialogOpen && selectedSession?.id === session.id} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog(session)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Progress
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Progress for {session.subject}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="progress_note">Progress Note</Label>
                        <Textarea
                          id="progress_note"
                          required
                          value={formData.progress_note}
                          onChange={(e) => setFormData({ ...formData, progress_note: e.target.value })}
                          placeholder="Describe the student's progress during this session..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="skill_level">Skill Level</Label>
                        <Select
                          value={formData.skill_level}
                          onValueChange={(value: any) => setFormData({ ...formData, skill_level: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Needs support">Needs support</SelectItem>
                            <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                            <SelectItem value="Good">Good</SelectItem>
                            <SelectItem value="Excellent">Excellent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="homework_next_action">Homework / Next Action (Optional)</Label>
                        <Textarea
                          id="homework_next_action"
                          value={formData.homework_next_action}
                          onChange={(e) => setFormData({ ...formData, homework_next_action: e.target.value })}
                          placeholder="Any homework or action items for the student..."
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Submit Progress</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}