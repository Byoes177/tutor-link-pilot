-- Fix RLS policies to prevent infinite recursion

-- Drop existing admin policies that might cause recursion
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage all tutor resources" ON public.tutor_resources;
DROP POLICY IF EXISTS "Admins can manage all tutor availability" ON public.tutor_availability;

-- Create security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::user_role
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Recreate admin policies using the security definer function
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Admins can view all bookings" 
ON public.bookings 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can manage all bookings" 
ON public.bookings 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Admins can manage all reviews" 
ON public.reviews 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Admins can manage all tutor resources" 
ON public.tutor_resources 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Admins can manage all tutor availability" 
ON public.tutor_availability 
FOR ALL 
USING (public.is_admin());