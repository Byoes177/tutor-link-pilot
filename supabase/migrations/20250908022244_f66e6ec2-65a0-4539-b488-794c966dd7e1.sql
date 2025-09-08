-- Fix search path for update_tutor_rating function
CREATE OR REPLACE FUNCTION public.update_tutor_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.tutors 
    SET 
      rating = COALESCE((
        SELECT AVG(rating)::DECIMAL(3,2) 
        FROM public.reviews 
        WHERE tutor_id = OLD.tutor_id
      ), 0.0),
      total_reviews = (
        SELECT COUNT(*) 
        FROM public.reviews 
        WHERE tutor_id = OLD.tutor_id
      )
    WHERE id = OLD.tutor_id;
    RETURN OLD;
  ELSE
    UPDATE public.tutors 
    SET 
      rating = (
        SELECT AVG(rating)::DECIMAL(3,2) 
        FROM public.reviews 
        WHERE tutor_id = NEW.tutor_id
      ),
      total_reviews = (
        SELECT COUNT(*) 
        FROM public.reviews 
        WHERE tutor_id = NEW.tutor_id
      )
    WHERE id = NEW.tutor_id;
    RETURN NEW;
  END IF;
END;
$$;