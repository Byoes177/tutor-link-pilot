-- Make byoes.sky@gmail.com an admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'byoes.sky@gmail.com';