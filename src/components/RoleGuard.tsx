import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setUserRole(data.role);
      }
      setLoading(false);
    };

    fetchUserRole();
  }, [user]);

  useEffect(() => {
    if (loading || !user || !userRole) return;

    // Prevent tutors from accessing student search/booking pages
    if (userRole === 'tutor' && location.pathname === '/tutors') {
      toast({
        title: 'Redirected to Dashboard',
        description: 'Tutors cannot search for other tutors. Use your dashboard to manage your profile and bookings.',
      });
      navigate('/profile');
    }
  }, [userRole, location.pathname, loading, user, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}