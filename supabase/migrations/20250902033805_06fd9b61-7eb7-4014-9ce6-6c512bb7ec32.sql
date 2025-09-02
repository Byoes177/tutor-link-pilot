-- Create storage bucket for tutor certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true);

-- Create RLS policies for certificate uploads
CREATE POLICY "Tutors can upload their own certificates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'certificates' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'tutor'
  )
);

CREATE POLICY "Tutors can view their own certificates" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'certificates' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Tutors can update their own certificates" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'certificates' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Tutors can delete their own certificates" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'certificates' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view certificates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'certificates');