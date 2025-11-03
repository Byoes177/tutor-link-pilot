-- Create learning goals table
CREATE TABLE IF NOT EXISTS public.learning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL,
  tutor_id UUID NOT NULL,
  subject TEXT NOT NULL,
  goal_text TEXT NOT NULL,
  target_date DATE,
  is_achieved BOOLEAN DEFAULT false,
  achieved_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create progress feedback table
CREATE TABLE IF NOT EXISTS public.progress_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_id UUID NOT NULL REFERENCES public.learner_progress(id) ON DELETE CASCADE,
  feedback_text TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_goals
CREATE POLICY "Students can view their own goals"
  ON public.learning_goals
  FOR SELECT
  USING (auth.uid() = learner_id);

CREATE POLICY "Parents can view their children's goals"
  ON public.learning_goals
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM parent_child_accounts
    WHERE parent_user_id = auth.uid()
    AND child_user_id = learner_id
  ));

CREATE POLICY "Tutors can view goals for their students"
  ON public.learning_goals
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tutors
    WHERE tutors.user_id = auth.uid()
    AND tutors.id = learning_goals.tutor_id
  ));

CREATE POLICY "Tutors can manage goals for their students"
  ON public.learning_goals
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM tutors
    WHERE tutors.user_id = auth.uid()
    AND tutors.id = learning_goals.tutor_id
  ));

CREATE POLICY "Admins can manage all goals"
  ON public.learning_goals
  FOR ALL
  USING (is_admin());

-- RLS Policies for progress_feedback
CREATE POLICY "Users can view feedback on their progress"
  ON public.progress_feedback
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM learner_progress
    WHERE learner_progress.id = progress_feedback.progress_id
    AND learner_progress.learner_id = auth.uid()
  ));

CREATE POLICY "Tutors can view feedback on their progress entries"
  ON public.progress_feedback
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM learner_progress
    JOIN tutors ON tutors.id = learner_progress.tutor_id
    WHERE learner_progress.id = progress_feedback.progress_id
    AND tutors.user_id = auth.uid()
  ));

CREATE POLICY "Users can add feedback to progress entries"
  ON public.progress_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all feedback"
  ON public.progress_feedback
  FOR ALL
  USING (is_admin());

-- Add triggers for updated_at
CREATE TRIGGER update_learning_goals_updated_at
  BEFORE UPDATE ON public.learning_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_progress_feedback_updated_at
  BEFORE UPDATE ON public.progress_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();