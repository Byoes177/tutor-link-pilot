import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface AddProgressDialogProps {
  session: {
    id: string;
    session_date: string;
    subject: string;
    student_id: string;
    student_name: string;
  } | null;
  tutorId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddProgressDialog({ session, tutorId, onClose, onSuccess }: AddProgressDialogProps) {
  const [progressNote, setProgressNote] = useState('');
  const [skillLevel, setSkillLevel] = useState<string>('');
  const [homework, setHomework] = useState('');

  const addProgressMutation = useMutation({
    mutationFn: async () => {
      if (!session || !tutorId) throw new Error('Missing required data');
      if (!progressNote || !skillLevel) throw new Error('Please fill in all required fields');

      // Insert progress entry
      const { error: progressError } = await supabase
        .from('learner_progress')
        .insert({
          learner_id: session.student_id,
          tutor_id: tutorId,
          booking_id: session.id,
          subject: session.subject,
          date_of_session: session.session_date,
          progress_note: progressNote,
          skill_level: skillLevel as any,
          homework_next_action: homework || null,
        } as any);

      if (progressError) throw progressError;

      // Create notification for student
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: session.student_id,
          title: 'Progress Update',
          message: `Your tutor has updated your progress for ${session.subject}.`,
          type: 'progress_update',
          related_id: session.id,
        });

      if (notifError) console.error('Notification error:', notifError);
    },
    onSuccess: () => {
      toast.success('Progress added successfully');
      setProgressNote('');
      setSkillLevel('');
      setHomework('');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add progress');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProgressMutation.mutate();
  };

  return (
    <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Progress for {session?.subject}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Student</Label>
            <p className="font-medium">{session?.student_name}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="progress-note">
              Progress Note <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="progress-note"
              placeholder="Describe the student's progress during this session..."
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skill-level">
              Skill Level <span className="text-destructive">*</span>
            </Label>
            <Select value={skillLevel} onValueChange={setSkillLevel} required>
              <SelectTrigger id="skill-level">
                <SelectValue placeholder="Select skill level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Needs support">Needs support</SelectItem>
                <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Excellent">Excellent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="homework">Homework / Next Action (Optional)</Label>
            <Textarea
              id="homework"
              placeholder="Any homework assignments or next steps..."
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addProgressMutation.isPending}>
              {addProgressMutation.isPending ? 'Adding...' : 'Add Progress'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
