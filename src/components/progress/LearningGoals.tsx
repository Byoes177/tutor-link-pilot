import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, Check, Calendar, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface LearningGoalsProps {
  learnerId: string;
  subject?: string;
  canEdit?: boolean;
}

interface Goal {
  id: string;
  subject: string;
  goal_text: string;
  target_date: string | null;
  is_achieved: boolean;
  achieved_date: string | null;
}

export function LearningGoals({ learnerId, subject, canEdit = false }: LearningGoalsProps) {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ subject: subject || '', goal_text: '', target_date: '' });
  const queryClient = useQueryClient();

  const { data: tutorProfile } = useQuery({
    queryKey: ['tutor-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('tutors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      return data;
    },
    enabled: canEdit,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['learning-goals', learnerId, subject],
    queryFn: async () => {
      let query = supabase
        .from('learning_goals')
        .select('*')
        .eq('learner_id', learnerId)
        .order('is_achieved')
        .order('target_date', { ascending: true });

      if (subject) {
        query = query.eq('subject', subject);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Goal[];
    },
  });

  const addGoalMutation = useMutation({
    mutationFn: async () => {
      if (!tutorProfile?.id) throw new Error('Tutor profile not found');

      const { error } = await supabase.from('learning_goals').insert({
        learner_id: learnerId,
        tutor_id: tutorProfile.id,
        subject: newGoal.subject,
        goal_text: newGoal.goal_text,
        target_date: newGoal.target_date || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
      setIsAddingGoal(false);
      setNewGoal({ subject: subject || '', goal_text: '', target_date: '' });
      toast.success('Goal added successfully');
    },
    onError: () => {
      toast.error('Failed to add goal');
    },
  });

  const toggleGoalMutation = useMutation({
    mutationFn: async ({ id, isAchieved }: { id: string; isAchieved: boolean }) => {
      const { error } = await supabase
        .from('learning_goals')
        .update({
          is_achieved: !isAchieved,
          achieved_date: !isAchieved ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
      toast.success('Goal updated');
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('learning_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
      toast.success('Goal deleted');
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Learning Goals
          </CardTitle>
          {canEdit && (
            <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Learning Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      value={newGoal.subject}
                      onChange={(e) => setNewGoal({ ...newGoal, subject: e.target.value })}
                      placeholder="Mathematics"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Goal</label>
                    <Textarea
                      value={newGoal.goal_text}
                      onChange={(e) => setNewGoal({ ...newGoal, goal_text: e.target.value })}
                      placeholder="Master quadratic equations..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Target Date (Optional)</label>
                    <Input
                      type="date"
                      value={newGoal.target_date}
                      onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                    />
                  </div>
                  <Button
                    onClick={() => addGoalMutation.mutate()}
                    disabled={!newGoal.subject || !newGoal.goal_text}
                    className="w-full"
                  >
                    Add Goal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No learning goals set yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className={`p-4 border rounded-lg ${
                  goal.is_achieved ? 'bg-muted/50' : 'bg-background'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{goal.subject}</Badge>
                      {goal.is_achieved && (
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                          <Check className="h-3 w-3 mr-1" />
                          Achieved
                        </Badge>
                      )}
                    </div>
                    <p className={goal.is_achieved ? 'line-through text-muted-foreground' : ''}>
                      {goal.goal_text}
                    </p>
                    {goal.target_date && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3" />
                        Target: {format(new Date(goal.target_date), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          toggleGoalMutation.mutate({ id: goal.id, isAchieved: goal.is_achieved })
                        }
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteGoalMutation.mutate(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
