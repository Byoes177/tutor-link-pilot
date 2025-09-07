-- Add new fields to tutors table for enhanced filtering and functionality
ALTER TABLE public.tutors 
ADD COLUMN education_level TEXT CHECK (education_level IN ('diploma', 'degree', 'masters', 'phd')),
ADD COLUMN teaching_level TEXT[] DEFAULT '{}',
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN teaching_location TEXT[] DEFAULT '{}',
ADD COLUMN qualifications TEXT,
ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN total_reviews INTEGER DEFAULT 0,
ADD COLUMN phone TEXT,
ADD COLUMN profile_image_url TEXT;

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tutor_id, student_id)
);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Students can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = student_id);

-- Create availability table for scheduling
CREATE TABLE public.tutor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on availability
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for availability
CREATE POLICY "Anyone can view tutor availability" ON public.tutor_availability
  FOR SELECT USING (true);

CREATE POLICY "Tutors can manage their own availability" ON public.tutor_availability
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.tutors WHERE tutors.id = tutor_id AND tutors.user_id = auth.uid()
  ));

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  subject TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() = student_id OR 
    EXISTS (SELECT 1 FROM public.tutors WHERE tutors.id = tutor_id AND tutors.user_id = auth.uid())
  );

CREATE POLICY "Students can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Tutors and students can update their bookings" ON public.bookings
  FOR UPDATE USING (
    auth.uid() = student_id OR 
    EXISTS (SELECT 1 FROM public.tutors WHERE tutors.id = tutor_id AND tutors.user_id = auth.uid())
  );

-- Create storage bucket for resources
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', false);

-- Create policies for resources bucket
CREATE POLICY "Tutors can upload resources" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resources' AND 
    EXISTS (SELECT 1 FROM public.tutors WHERE tutors.user_id = auth.uid())
  );

CREATE POLICY "Users can view resources" ON storage.objects
  FOR SELECT USING (bucket_id = 'resources');

CREATE POLICY "Tutors can update their own resources" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'resources' AND 
    EXISTS (SELECT 1 FROM public.tutors WHERE tutors.user_id = auth.uid())
  );

CREATE POLICY "Tutors can delete their own resources" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resources' AND 
    EXISTS (SELECT 1 FROM public.tutors WHERE tutors.user_id = auth.uid())
  );

-- Create resources table to track uploaded files
CREATE TABLE public.tutor_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT,
  subject TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on resources
ALTER TABLE public.tutor_resources ENABLE ROW LEVEL SECURITY;

-- Create policies for resources
CREATE POLICY "Anyone can view public resources" ON public.tutor_resources
  FOR SELECT USING (is_public = true);

CREATE POLICY "Tutors can view their own resources" ON public.tutor_resources
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.tutors WHERE tutors.id = tutor_id AND tutors.user_id = auth.uid()
  ));

CREATE POLICY "Tutors can manage their own resources" ON public.tutor_resources
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.tutors WHERE tutors.id = tutor_id AND tutors.user_id = auth.uid()
  ));

-- Add admin approval for certificates
ALTER TABLE storage.objects 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create trigger to update tutor rating when new review is added
CREATE OR REPLACE FUNCTION update_tutor_rating()
RETURNS TRIGGER AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tutor_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_tutor_rating();

-- Create updated_at triggers for new tables
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_availability_updated_at
  BEFORE UPDATE ON public.tutor_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.tutor_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();