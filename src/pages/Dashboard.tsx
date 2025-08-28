import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';

interface Profile {
  role: 'student' | 'tutor' | 'admin';
}

interface Tutor {
  id: string;
  full_name: string;
  email: string;
  subjects: string[];
  bio?: string;
  availability?: string;
  hourly_rate?: number;
  is_approved: boolean;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTutors();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    }
  };

  const fetchTutors = async () => {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTutors(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load tutors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTutorApproval = async (tutorId: string, isApproved: boolean) => {
    try {
      const { error } = await supabase
        .from('tutors')
        .update({ is_approved: isApproved })
        .eq('id', tutorId);

      if (error) throw error;
      
      fetchTutors();
      toast({
        title: "Success",
        description: `Tutor ${isApproved ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update tutor status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access this dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingTutors = tutors.filter(t => !t.is_approved);
  const approvedTutors = tutors.filter(t => t.is_approved);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Admin Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tutors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tutors.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Tutors</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedTutors.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTutors.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {pendingTutors.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Pending Approval</h2>
              <div className="space-y-4">
                {pendingTutors.map((tutor) => (
                  <Card key={tutor.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{tutor.full_name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{tutor.email}</p>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium">Subjects:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tutor.subjects.map((subject) => (
                              <Badge key={subject} variant="outline" className="text-xs">
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {tutor.bio && (
                          <div>
                            <p className="text-sm font-medium">Bio:</p>
                            <p className="text-sm text-muted-foreground">{tutor.bio}</p>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => updateTutorApproval(tutor.id, true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => updateTutorApproval(tutor.id, false)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-4">Approved Tutors ({approvedTutors.length})</h2>
            <div className="space-y-4">
              {approvedTutors.map((tutor) => (
                <Card key={tutor.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{tutor.full_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{tutor.email}</p>
                      </div>
                      <Badge variant="default">Approved</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}