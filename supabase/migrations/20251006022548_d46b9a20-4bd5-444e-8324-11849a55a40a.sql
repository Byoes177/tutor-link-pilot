-- Convert qualifications from text to text array
ALTER TABLE public.tutors 
ALTER COLUMN qualifications TYPE text[] 
USING CASE 
  WHEN qualifications IS NULL OR qualifications = '' THEN '{}'::text[]
  ELSE string_to_array(qualifications, E'\n')
END;

-- Create RPC function to get all unique qualifications
CREATE OR REPLACE FUNCTION public.get_all_qualifications()
RETURNS TABLE (qualification text) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT unnest(qualifications) as qualification
  FROM tutors
  WHERE qualifications IS NOT NULL 
    AND array_length(qualifications, 1) > 0
    AND is_approved = true
  ORDER BY qualification;
$$;