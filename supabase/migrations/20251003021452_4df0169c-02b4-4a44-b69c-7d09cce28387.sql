-- Ensure app_role enum exists
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'student', 'tutor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create/update has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
$$;

-- Drop and recreate policies that were dependent on profiles.role
DROP POLICY IF EXISTS "Admins can manage all tutors" ON public.tutors;
CREATE POLICY "Admins can manage all tutors"
ON public.tutors
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Tutors can upload their own certificates" ON storage.objects;
CREATE POLICY "Tutors can upload their own certificates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificates' AND
  public.has_role(auth.uid(), 'tutor'::app_role) AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Admins can manage certificate approvals" ON public.certificate_approvals;
CREATE POLICY "Admins can manage certificate approvals"
ON public.certificate_approvals
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create RLS policies for user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  
  -- Insert role into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role')::app_role, 'student'::app_role)
  );
  
  RETURN new;
END;
$$;