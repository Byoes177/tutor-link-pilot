-- Create skill level enum
CREATE TYPE public.skill_level AS ENUM ('Needs support', 'Satisfactory', 'Good', 'Excellent');

-- Create learner_progress table
CREATE TABLE public.learner_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL,
  tutor_id UUID NOT NULL,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  date_of_session DATE NOT NULL,
  progress_note TEXT NOT NULL,
  skill_level skill_level NOT NULL,
  homework_next_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learner_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tutors can insert progress for their own sessions"
ON public.learner_progress
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tutors
    WHERE tutors.user_id = auth.uid()
    AND tutors.id = learner_progress.tutor_id
  )
);

CREATE POLICY "Tutors can view their own progress entries"
ON public.learner_progress
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tutors
    WHERE tutors.user_id = auth.uid()
    AND tutors.id = learner_progress.tutor_id
  )
);

CREATE POLICY "Students can view their own progress"
ON public.learner_progress
FOR SELECT
TO authenticated
USING (auth.uid() = learner_id);

CREATE POLICY "Parents can view their children's progress"
ON public.learner_progress
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.parent_child_accounts
    WHERE parent_child_accounts.parent_user_id = auth.uid()
    AND parent_child_accounts.child_user_id = learner_progress.learner_id
  )
);

CREATE POLICY "Admins can manage all progress"
ON public.learner_progress
FOR ALL
TO authenticated
USING (public.is_admin());

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  type TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications RLS policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add updated_at trigger for learner_progress
CREATE TRIGGER update_learner_progress_updated_at
BEFORE UPDATE ON public.learner_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed sample data (assuming test users exist)
-- Insert sample progress entries
INSERT INTO public.learner_progress (learner_id, tutor_id, booking_id, subject, date_of_session, progress_note, skill_level, homework_next_action)
SELECT 
  b.student_id,
  b.tutor_id,
  b.id,
  b.subject,
  b.session_date,
  CASE 
    WHEN ROW_NUMBER() OVER () = 1 THEN 'Great progress in understanding quadratic equations. Student showed strong problem-solving skills.'
    WHEN ROW_NUMBER() OVER () = 2 THEN 'Good grasp of grammar fundamentals. Needs more practice with essay structure.'
    ELSE 'Excellent understanding of chemical reactions. Very engaged during lab demonstrations.'
  END,
  CASE 
    WHEN ROW_NUMBER() OVER () = 1 THEN 'Excellent'::skill_level
    WHEN ROW_NUMBER() OVER () = 2 THEN 'Good'::skill_level
    ELSE 'Excellent'::skill_level
  END,
  CASE 
    WHEN ROW_NUMBER() OVER () = 1 THEN 'Complete practice worksheet on factoring polynomials'
    WHEN ROW_NUMBER() OVER () = 2 THEN 'Write a 500-word essay on a topic of choice'
    ELSE 'Review periodic table and element properties'
  END
FROM public.bookings b
WHERE b.status = 'completed'
LIMIT 3;