-- Insert sample learner progress data for test accounts
DO $$
DECLARE
  v_student_user_id uuid;
  v_tutor_user_id uuid;
  v_tutor_id uuid;
  v_booking_id_1 uuid;
  v_booking_id_2 uuid;
  v_booking_id_3 uuid;
BEGIN
  -- Get the user IDs from auth.users
  SELECT id INTO v_student_user_id FROM auth.users WHERE email = 'tcstudent@gmail.com';
  SELECT id INTO v_tutor_user_id FROM auth.users WHERE email = 'tctutor@gmail.com';
  
  -- Exit if users don't exist
  IF v_student_user_id IS NULL OR v_tutor_user_id IS NULL THEN
    RAISE NOTICE 'Test users not found. Please run seed-test-users function first.';
    RETURN;
  END IF;
  
  -- Get or create tutor profile
  SELECT id INTO v_tutor_id FROM public.tutors WHERE user_id = v_tutor_user_id;
  
  IF v_tutor_id IS NULL THEN
    INSERT INTO public.tutors (
      user_id, full_name, email, subjects, hourly_rate, is_approved, 
      experience_years, bio, education_level
    ) VALUES (
      v_tutor_user_id,
      'Test Tutor',
      'tctutor@gmail.com',
      ARRAY['Mathematics', 'Physics', 'Chemistry'],
      50.00,
      true,
      5,
      'Experienced tutor specializing in STEM subjects',
      'Masters Degree'
    ) RETURNING id INTO v_tutor_id;
  END IF;
  
  -- Create 3 completed bookings if they don't exist
  v_booking_id_1 := gen_random_uuid();
  v_booking_id_2 := gen_random_uuid();
  v_booking_id_3 := gen_random_uuid();
  
  INSERT INTO public.bookings (
    id, tutor_id, student_id, session_date, start_time, end_time, 
    status, subject, focus_topic
  ) VALUES
    (
      v_booking_id_1,
      v_tutor_id,
      v_student_user_id,
      CURRENT_DATE - INTERVAL '7 days',
      '10:00:00',
      '11:00:00',
      'completed',
      'Mathematics',
      'Algebra basics and equations'
    ),
    (
      v_booking_id_2,
      v_tutor_id,
      v_student_user_id,
      CURRENT_DATE - INTERVAL '5 days',
      '14:00:00',
      '15:00:00',
      'completed',
      'Physics',
      'Newton''s laws of motion'
    ),
    (
      v_booking_id_3,
      v_tutor_id,
      v_student_user_id,
      CURRENT_DATE - INTERVAL '2 days',
      '16:00:00',
      '17:00:00',
      'completed',
      'Chemistry',
      'Chemical bonding and reactions'
    )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert learner progress entries with correct enum values
  INSERT INTO public.learner_progress (
    learner_id, tutor_id, booking_id, date_of_session, 
    skill_level, progress_note, homework_next_action, subject
  ) VALUES
    (
      v_student_user_id,
      v_tutor_id,
      v_booking_id_1,
      CURRENT_DATE - INTERVAL '7 days',
      'Satisfactory',
      'Student showed good understanding of basic algebraic concepts. Successfully solved linear equations with one variable. Needs more practice with word problems.',
      'Complete exercises 1-10 from chapter 3. Focus on translating word problems into equations.',
      'Mathematics'
    ),
    (
      v_student_user_id,
      v_tutor_id,
      v_booking_id_2,
      CURRENT_DATE - INTERVAL '5 days',
      'Good',
      'Excellent grasp of Newton''s first and second laws. Student actively participated in demonstrations and asked insightful questions. Ready to move to advanced applications.',
      'Review force diagrams and complete practice problems on friction and tension. Watch the recommended video on real-world applications.',
      'Physics'
    ),
    (
      v_student_user_id,
      v_tutor_id,
      v_booking_id_3,
      CURRENT_DATE - INTERVAL '2 days',
      'Excellent',
      'Outstanding understanding of ionic and covalent bonds. Student can easily identify bond types in different compounds and shows excellent lab safety awareness.',
      'Create a chart comparing ionic and covalent bonds with 5 examples each. Study the periodic table trends for the quiz next week.',
      'Chemistry'
    )
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Sample progress data inserted successfully';
END $$;