import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, BookOpen, Pencil } from 'lucide-react';
import { AddProgressDialog } from './AddProgressDialog';
import { LearningGoals } from './progress/LearningGoals';
import { ProgressChart } from './progress/ProgressChart';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CompletedSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  subject: string;
  student_id: string;
  student_name: string;
  has_progress: boolean;
}

export function SessionProgress() {
  const [selectedSession, setSelectedSession] = useState<CompletedSession | null>(null);
  const queryClient = useQueryClient();

  const { data: tutorProfile } = useQuery({
    queryKey: ['tutor-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tutors')
        .select('id, user_id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: completedSessions, isLoading } = useQuery({
    queryKey: ['completed-sessions', tutorProfile?.id],
    queryFn: async () => {
      if (!tutorProfile?.id) return [];

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          session_date,
          start_time,
          end_time,
          subject,
          student_id,
          profiles!bookings_student_id_fkey(full_name)
        `)
        .eq('tutor_id', tutorProfile.id)
        .eq('status', 'completed')
        .order('session_date', { ascending: false });

      if (error) throw error;

      // Check which sessions already have progress entries
      const { data: progressEntries } = await supabase
        .from('learner_progress')
        .select('booking_id, id, skill_level, date_of_session')
        .eq('tutor_id', tutorProfile.id);

      const progressMap = new Map(progressEntries?.map(p => [p.booking_id, p]) || []);

      return bookings.map((booking: any) => ({
        id: booking.id,
        session_date: booking.session_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        subject: booking.subject,
        student_id: booking.student_id,
        student_name: booking.profiles?.full_name || 'Unknown',
        has_progress: progressMap.has(booking.id),
        progress_entry: progressMap.get(booking.id),
      }));
    },
    enabled: !!tutorProfile?.id,
  });

  // Get all progress entries for charts
  const { data: allProgressEntries = [] } = useQuery({
    queryKey: ['all-progress-entries', tutorProfile?.id],
    queryFn: async () => {
      if (!tutorProfile?.id) return [];

      const { data, error } = await supabase
        .from('learner_progress')
        .select('subject, skill_level, date_of_session, learner_id')
        .eq('tutor_id', tutorProfile.id)
        .order('date_of_session', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!tutorProfile?.id,
  });

  // Group by subject for charts
  const progressBySubject = allProgressEntries.reduce((acc, entry) => {
    if (!acc[entry.subject]) acc[entry.subject] = [];
    acc[entry.subject].push(entry);
    return acc;
  }, {} as Record<string, any[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Session Progress</h2>
          <p className="text-muted-foreground">Track and manage student progress</p>
        </div>
      </div>

      {/* Progress Charts */}
      {Object.keys(progressBySubject).length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(progressBySubject).map(([subject, entries]) => (
            <ProgressChart key={subject} subject={subject} entries={entries} />
          ))}
        </div>
      )}

      {/* Learning Goals - Show for first student or allow tutor to select */}
      {completedSessions && completedSessions.length > 0 && (
        <LearningGoals 
          learnerId={completedSessions[0].student_id}
          canEdit={true}
        />
      )}

      {completedSessions?.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Completed Sessions</h3>
              <p className="text-muted-foreground">
                Completed sessions will appear here for you to add progress notes.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {completedSessions?.map((session) => (
            <Card key={session.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{session.subject}</h3>
                        <p className="text-sm text-muted-foreground">
                          Student: {session.student_name}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(session.session_date), 'MMM dd, yyyy')}
                          </div>
                          <div>
                            {session.start_time} - {session.end_time}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    {session.has_progress ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedSession(session)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Progress
                      </Button>
                    ) : (
                      <Button onClick={() => setSelectedSession(session)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Progress
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddProgressDialog
        session={selectedSession}
        tutorId={tutorProfile?.id}
        onClose={() => setSelectedSession(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['completed-sessions'] });
          setSelectedSession(null);
        }}
      />
    </div>
  );
}
