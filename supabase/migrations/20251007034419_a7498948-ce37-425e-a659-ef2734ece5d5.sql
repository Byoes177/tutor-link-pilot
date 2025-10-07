-- Add parent-child account relationships
CREATE TABLE public.parent_child_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_user_id, child_user_id)
);

ALTER TABLE public.parent_child_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their children"
  ON public.parent_child_accounts FOR SELECT
  USING (auth.uid() = parent_user_id);

CREATE POLICY "Parents can manage their children"
  ON public.parent_child_accounts FOR ALL
  USING (auth.uid() = parent_user_id);

-- Add payment transactions with escrow
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  tutor_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'held_in_escrow',
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  released_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() IN (
    SELECT user_id FROM public.tutors WHERE id = tutor_id
  ));

CREATE POLICY "Admins can manage all transactions"
  ON public.payment_transactions FOR ALL
  USING (is_admin());

-- Add focus topics to bookings
ALTER TABLE public.bookings ADD COLUMN focus_topic TEXT;

-- Add registration fee tracking to profiles
ALTER TABLE public.profiles ADD COLUMN registration_fee_paid BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN registration_fee_amount DECIMAL(10,2);
ALTER TABLE public.profiles ADD COLUMN registration_paid_at TIMESTAMP WITH TIME ZONE;

-- Add learning preferences to profiles
ALTER TABLE public.profiles ADD COLUMN location TEXT;
ALTER TABLE public.profiles ADD COLUMN learning_level TEXT;
ALTER TABLE public.profiles ADD COLUMN subjects_of_interest TEXT[];
ALTER TABLE public.profiles ADD COLUMN preferred_mode TEXT[];

-- Create trigger for payment transactions updated_at
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();