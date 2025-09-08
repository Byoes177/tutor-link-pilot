-- Add admin policies for comprehensive user management

-- Allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role = 'admin'::user_role
));

-- Allow admins to view all bookings
CREATE POLICY "Admins can view all bookings" 
ON public.bookings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role = 'admin'::user_role
));

-- Allow admins to manage all bookings
CREATE POLICY "Admins can manage all bookings" 
ON public.bookings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role = 'admin'::user_role
));

-- Allow admins to manage all reviews
CREATE POLICY "Admins can manage all reviews" 
ON public.reviews 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role = 'admin'::user_role
));

-- Allow admins to manage all tutor resources
CREATE POLICY "Admins can manage all tutor resources" 
ON public.tutor_resources 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role = 'admin'::user_role
));

-- Allow admins to manage all tutor availability
CREATE POLICY "Admins can manage all tutor availability" 
ON public.tutor_availability 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role = 'admin'::user_role
));