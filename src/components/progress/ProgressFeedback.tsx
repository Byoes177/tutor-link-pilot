import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ProgressFeedbackProps {
  progressId: string;
  canAddFeedback?: boolean;
}

interface Feedback {
  id: string;
  feedback_text: string;
  created_at: string;
  created_by: string;
  creator_name: string;
}

export function ProgressFeedback({ progressId, canAddFeedback = false }: ProgressFeedbackProps) {
  const [newFeedback, setNewFeedback] = useState('');
  const queryClient = useQueryClient();

  const { data: feedback = [] } = useQuery({
    queryKey: ['progress-feedback', progressId],
    queryFn: async () => {
      const { data: feedbackData, error } = await supabase
        .from('progress_feedback')
        .select('id, feedback_text, created_at, created_by')
        .eq('progress_id', progressId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch creator names
      const creatorIds = [...new Set(feedbackData?.map(f => f.created_by) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', creatorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      return feedbackData.map(f => ({
        ...f,
        creator_name: profileMap.get(f.created_by) || 'Unknown User',
      })) as Feedback[];
    },
  });

  const addFeedbackMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('progress_feedback').insert({
        progress_id: progressId,
        feedback_text: newFeedback,
        created_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-feedback'] });
      setNewFeedback('');
      toast.success('Feedback added');
    },
    onError: () => {
      toast.error('Failed to add feedback');
    },
  });

  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Feedback & Comments
      </h4>

      {canAddFeedback && (
        <div className="flex gap-2">
          <Textarea
            value={newFeedback}
            onChange={(e) => setNewFeedback(e.target.value)}
            placeholder="Add your feedback or questions..."
            rows={2}
            className="flex-1"
          />
          <Button
            onClick={() => addFeedbackMutation.mutate()}
            disabled={!newFeedback.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {feedback.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No feedback yet
        </p>
      ) : (
        <div className="space-y-3">
          {feedback.map((item) => (
            <div key={item.id} className="border rounded-lg p-3 bg-muted/30">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium">
                  {item.creator_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(item.created_at), 'MMM dd, yyyy')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{item.feedback_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
