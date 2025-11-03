import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, User, BookOpen, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { ProgressChart } from './progress/ProgressChart';
import { LearningGoals } from './progress/LearningGoals';
import { ProgressFeedback } from './progress/ProgressFeedback';

interface ProgressEntry {
  id: string;
  subject: string;
  date_of_session: string;
  progress_note: string;
  skill_level: string;
  homework_next_action: string | null;
  tutor_name: string;
  learner_id: string;
  learner_name: string;
}

export function LearningProgress() {
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const { data: userData } = useQuery({
    queryKey: ['user-data'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      return { userId: user.id, profile };
    },
  });

  const { data: children } = useQuery({
    queryKey: ['parent-children'],
    queryFn: async () => {
      if (!userData?.userId) return [];

      const { data, error } = await supabase
        .from('parent_child_accounts')
        .select(`
          child_user_id,
          profiles!parent_child_accounts_child_user_id_fkey(full_name)
        `)
        .eq('parent_user_id', userData.userId);

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.child_user_id,
        name: item.profiles?.full_name || 'Unknown',
      }));
    },
    enabled: !!userData?.userId,
  });

  const { data: progressEntries, isLoading } = useQuery({
    queryKey: ['learning-progress', userData?.userId, selectedChild, selectedSubject],
    queryFn: async () => {
      if (!userData?.userId) return [];

      let query = supabase
        .from('learner_progress')
        .select(`
          id,
          subject,
          date_of_session,
          progress_note,
          skill_level,
          homework_next_action,
          learner_id,
          tutors!learner_progress_tutor_id_fkey(full_name),
          profiles!learner_progress_learner_id_fkey(full_name)
        `)
        .order('date_of_session', { ascending: false });

      // Filter by learner - either current user, selected child, or all children
      if (selectedChild === 'all') {
        if (children && children.length > 0) {
          // Parent viewing all children
          const childIds = children.map(c => c.id);
          query = query.in('learner_id', [userData.userId, ...childIds]);
        } else {
          // Student viewing own progress
          query = query.eq('learner_id', userData.userId);
        }
      } else {
        // Specific child or student selected
        query = query.eq('learner_id', selectedChild);
      }

      if (selectedSubject !== 'all') {
        query = query.eq('subject', selectedSubject);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map((entry: any) => ({
        id: entry.id,
        subject: entry.subject,
        date_of_session: entry.date_of_session,
        progress_note: entry.progress_note,
        skill_level: entry.skill_level,
        homework_next_action: entry.homework_next_action,
        tutor_name: entry.tutors?.full_name || 'Unknown Tutor',
        learner_id: entry.learner_id,
        learner_name: entry.profiles?.full_name || 'Unknown',
      }));
    },
    enabled: !!userData?.userId,
  });

  const uniqueSubjects = [...new Set(progressEntries?.map(e => e.subject) || [])];
  const groupedBySubject = progressEntries?.reduce((acc, entry) => {
    if (!acc[entry.subject]) acc[entry.subject] = [];
    acc[entry.subject].push(entry);
    return acc;
  }, {} as Record<string, ProgressEntry[]>) || {};

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'Excellent':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'Good':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'Satisfactory':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'Needs support':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading progress...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Learning Progress</h2>
        <p className="text-muted-foreground">Track your learning journey</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {children && children.length > 0 && (
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All children" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All children</SelectItem>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {uniqueSubjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {progressEntries?.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Progress Entries</h3>
              <p className="text-muted-foreground">
                Progress updates from your tutors will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Progress Charts */}
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(groupedBySubject).map(([subject, entries]) => (
              <ProgressChart key={subject} subject={subject} entries={entries} />
            ))}
          </div>

          {/* Learning Goals */}
          <LearningGoals 
            learnerId={selectedChild === 'all' ? userData?.userId || '' : selectedChild}
            subject={selectedSubject !== 'all' ? selectedSubject : undefined}
            canEdit={false}
          />

          {/* Progress Entries by Subject */}
          {Object.entries(groupedBySubject).map(([subject, entries]) => (
            <div key={subject}>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {subject} - Session Details
              </h3>
              <div className="grid gap-4">
                {entries.map((entry) => (
                  <Card key={entry.id}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Badge className={getSkillLevelColor(entry.skill_level)}>
                            {entry.skill_level}
                          </Badge>
                          {children && children.length > 0 && (
                            <span className="text-sm text-muted-foreground">
                              {entry.learner_name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {entry.tutor_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(entry.date_of_session), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-1">Progress Note</h4>
                        <p className="text-muted-foreground">{entry.progress_note}</p>
                      </div>
                      {entry.homework_next_action && (
                        <div>
                          <h4 className="font-medium mb-1 flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            Next Action
                          </h4>
                          <p className="text-muted-foreground">{entry.homework_next_action}</p>
                        </div>
                      )}
                      <ProgressFeedback progressId={entry.id} canAddFeedback={true} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
