-- Add missing fields to tutors table for comprehensive tutor profiles
ALTER TABLE public.tutors
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add email verification tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster subject lookups
CREATE INDEX IF NOT EXISTS idx_tutors_subjects ON public.tutors USING GIN(subjects);

-- Function to get all unique subjects from tutors
CREATE OR REPLACE FUNCTION public.get_all_subjects()
RETURNS TABLE (subject TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT unnest(subjects) as subject
  FROM public.tutors
  WHERE is_approved = true
  ORDER BY subject;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check booking conflicts
CREATE OR REPLACE FUNCTION public.check_booking_conflict(
  p_tutor_id UUID,
  p_session_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.bookings
    WHERE tutor_id = p_tutor_id
    AND session_date = p_session_date
    AND status NOT IN ('cancelled', 'rejected')
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
    AND (
      (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
    )
  ) INTO conflict_exists;
  
  RETURN conflict_exists;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Add cancellation_deadline to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS cancellation_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME zone,
ADD COLUMN IF NOT EXISTS cancelled_by UUID;

-- Update cancellation_deadline automatically when booking is created
CREATE OR REPLACE FUNCTION public.set_cancellation_deadline()
RETURNS TRIGGER AS $$
BEGIN
  NEW.cancellation_deadline := (NEW.session_date + NEW.start_time) - INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_cancellation_deadline
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_cancellation_deadline();