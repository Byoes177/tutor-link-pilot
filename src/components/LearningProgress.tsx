import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface Progress {
  id: string;
  subject: string;
  date_of_session: string;
  progress_note: string;
  skill_level: string;
  homework_next_action?: string;
  tutors?: {
    full_name: string;
  };
  learner_id: string;
}

interface Child {
  child_user_id: string;
  profiles?: {
    full_name: string;
  };
}

export function LearningProgress() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progressEntries, setProgressEntries] = useState<Progress[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<Progress[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isParent, setIsParent] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [progressEntries, selectedChild, selectedSubject]);

  const fetchProgressData = async () => {
    try {
      // Check if user is a parent
      const { data: childAccounts } = await supabase
        .from('parent_child_accounts')
        .select('child_user_id')
        .eq('parent_user_id', user?.id);

      if (childAccounts && childAccounts.length > 0) {
        setIsParent(true);
        
        // Fetch child profiles separately
        const childrenWithProfiles = await Promise.all(
          childAccounts.map(async (account) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', account.child_user_id)
              .maybeSingle();
            
            return {
              child_user_id: account.child_user_id,
              profiles: profile
            };
          })
        );
        
        setChildren(childrenWithProfiles);
        
        const childIds = childAccounts.map(c => c.child_user_id);
        await fetchProgress([user?.id, ...childIds]);
      } else {
        await fetchProgress([user?.id]);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async (learnerIds: (string | undefined)[]) => {
    try {
      const validIds = learnerIds.filter(id => id !== undefined) as string[];
      
      const { data, error } = await supabase
        .from('learner_progress')
        .select('*')
        .in('learner_id', validIds)
        .order('date_of_session', { ascending: false });

      if (error) throw error;
      
      // Fetch tutor names separately
      const progressWithTutors = await Promise.all(
        (data || []).map(async (progress) => {
          const { data: tutor } = await supabase
            .from('tutors')
            .select('full_name')
            .eq('id', progress.tutor_id)
            .maybeSingle();
          
          return {
            ...progress,
            tutors: tutor
          };
        })
      );

      setProgressEntries(progressWithTutors as Progress[]);
      
      const uniqueSubjects = [...new Set((data || []).map(p => p.subject))];
      setSubjects(uniqueSubjects);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load progress entries',
        variant: 'destructive',
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...progressEntries];

    if (selectedChild !== 'all') {
      filtered = filtered.filter(p => p.learner_id === selectedChild);
    }

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(p => p.subject === selectedSubject);
    }

    setFilteredEntries(filtered);
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'Excellent':
        return 'bg-green-500';
      case 'Good':
        return 'bg-blue-500';
      case 'Satisfactory':
        return 'bg-yellow-500';
      case 'Needs support':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Learning Progress</h2>
        
        <div className="flex gap-4 mb-6">
          {isParent && children.length > 0 && (
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by child" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All children</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.child_user_id} value={child.child_user_id}>
                    {child.profiles?.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {subjects.length > 0 && (
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No progress entries yet
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {entry.subject}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Tutor: {entry.tutors?.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(entry.date_of_session), 'PPP')}</span>
                    </div>
                  </div>
                  <Badge className={getSkillLevelColor(entry.skill_level)}>
                    {entry.skill_level}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Progress Note:</p>
                  <p className="text-sm text-muted-foreground">{entry.progress_note}</p>
                </div>
                
                {entry.homework_next_action && (
                  <div>
                    <p className="text-sm font-medium mb-1">Next Action:</p>
                    <p className="text-sm text-muted-foreground">{entry.homework_next_action}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}