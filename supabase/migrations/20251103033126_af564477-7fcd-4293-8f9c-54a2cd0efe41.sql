-- Insert sample learning goals for test accounts
DO $$
DECLARE
  v_student_user_id uuid;
  v_tutor_id uuid;
BEGIN
  -- Get the user IDs
  SELECT id INTO v_student_user_id FROM auth.users WHERE email = 'tcstudent@gmail.com';
  SELECT id INTO v_tutor_id FROM public.tutors WHERE email = 'tctutor@gmail.com';
  
  IF v_student_user_id IS NULL OR v_tutor_id IS NULL THEN
    RAISE NOTICE 'Test users not found';
    RETURN;
  END IF;
  
  -- Insert sample learning goals
  INSERT INTO public.learning_goals (
    learner_id, tutor_id, subject, goal_text, target_date, is_achieved
  ) VALUES
    (
      v_student_user_id,
      v_tutor_id,
      'Mathematics',
      'Master solving quadratic equations and understand the quadratic formula',
      CURRENT_DATE + INTERVAL '30 days',
      false
    ),
    (
      v_student_user_id,
      v_tutor_id,
      'Physics',
      'Understand and apply Newton''s three laws of motion to real-world problems',
      CURRENT_DATE + INTERVAL '45 days',
      false
    ),
    (
      v_student_user_id,
      v_tutor_id,
      'Chemistry',
      'Learn the periodic table trends and electron configuration for elements 1-36',
      CURRENT_DATE + INTERVAL '60 days',
      false
    ),
    (
      v_student_user_id,
      v_tutor_id,
      'Mathematics',
      'Complete understanding of basic algebra operations',
      CURRENT_DATE - INTERVAL '10 days',
      true
    )
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Sample learning goals inserted successfully';
END $$;