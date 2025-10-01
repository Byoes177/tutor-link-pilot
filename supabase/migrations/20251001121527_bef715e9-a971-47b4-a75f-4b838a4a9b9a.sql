-- Fix security warnings: Add search_path to functions (with proper CASCADE handling)

-- Drop trigger first, then function
DROP TRIGGER IF EXISTS set_booking_cancellation_deadline ON public.bookings;
DROP FUNCTION IF EXISTS public.set_cancellation_deadline();

-- Recreate set_cancellation_deadline with proper search_path
CREATE OR REPLACE FUNCTION public.set_cancellation_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.cancellation_deadline := (NEW.session_date + NEW.start_time) - INTERVAL '24 hours';
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER set_booking_cancellation_deadline
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_cancellation_deadline();