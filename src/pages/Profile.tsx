import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface Profile {
  full_name: string;
  email: string;
  role: 'student' | 'tutor' | 'admin';
}

interface TutorProfile {
  id?: string;
  full_name: string;
  email: string;
  subjects: string[];
  bio?: string;
  availability?: string;
  hourly_rate?: number;
  is_approved: boolean;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTutorProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
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

  const fetchTutorProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setTutorProfile(data);
    } catch (error: any) {
      console.error('Error fetching tutor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTutorProfile = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const tutorData = {
        user_id: user.id,
        full_name: profile.full_name,
        email: profile.email,
        subjects: tutorProfile?.subjects || [],
        bio: tutorProfile?.bio || '',
        availability: tutorProfile?.availability || '',
        hourly_rate: tutorProfile?.hourly_rate || null,
      };

      if (tutorProfile?.id) {
        const { error } = await supabase
          .from('tutors')
          .update(tutorData)
          .eq('id', tutorProfile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tutors')
          .insert([tutorData]);
        if (error) throw error;
      }

      fetchTutorProfile();
      toast({
        title: "Success",
        description: "Tutor profile saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save tutor profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addSubject = () => {
    if (!newSubject.trim()) return;
    
    const currentSubjects = tutorProfile?.subjects || [];
    if (currentSubjects.includes(newSubject.trim())) {
      toast({
        title: "Error",
        description: "Subject already added",
        variant: "destructive",
      });
      return;
    }

    setTutorProfile({
      ...tutorProfile,
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      subjects: [...currentSubjects, newSubject.trim()],
      is_approved: tutorProfile?.is_approved || false,
    });
    setNewSubject('');
  };

  const removeSubject = (subject: string) => {
    const currentSubjects = tutorProfile?.subjects || [];
    setTutorProfile({
      ...tutorProfile,
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      subjects: currentSubjects.filter(s => s !== subject),
      is_approved: tutorProfile?.is_approved || false,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Profile</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <p className="text-sm text-muted-foreground">{profile?.full_name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
              <div>
                <Label>Role</Label>
                <Badge variant="outline">{profile?.role}</Badge>
              </div>
            </CardContent>
          </Card>

          {profile?.role === 'tutor' && (
            <Card>
              <CardHeader>
                <CardTitle>Tutor Information</CardTitle>
                {tutorProfile?.is_approved === false && (
                  <Badge variant="secondary">Pending Approval</Badge>
                )}
                {tutorProfile?.is_approved === true && (
                  <Badge variant="default">Approved</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subjects">Subjects</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="new-subject"
                      placeholder="Add a subject"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                    />
                    <Button onClick={addSubject} type="button">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tutorProfile?.subjects.map((subject) => (
                      <Badge key={subject} variant="outline" className="flex items-center gap-1">
                        {subject}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeSubject(subject)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell students about yourself..."
                    value={tutorProfile?.bio || ''}
                    onChange={(e) => setTutorProfile({
                      ...tutorProfile,
                      full_name: profile?.full_name || '',
                      email: profile?.email || '',
                      subjects: tutorProfile?.subjects || [],
                      bio: e.target.value,
                      is_approved: tutorProfile?.is_approved || false,
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <Input
                    id="availability"
                    placeholder="e.g., Weekdays 3-6 PM, Weekends flexible"
                    value={tutorProfile?.availability || ''}
                    onChange={(e) => setTutorProfile({
                      ...tutorProfile,
                      full_name: profile?.full_name || '',
                      email: profile?.email || '',
                      subjects: tutorProfile?.subjects || [],
                      availability: e.target.value,
                      is_approved: tutorProfile?.is_approved || false,
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="rate">Hourly Rate ($)</Label>
                  <Input
                    id="rate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="25.00"
                    value={tutorProfile?.hourly_rate || ''}
                    onChange={(e) => setTutorProfile({
                      ...tutorProfile,
                      full_name: profile?.full_name || '',
                      email: profile?.email || '',
                      subjects: tutorProfile?.subjects || [],
                      hourly_rate: parseFloat(e.target.value) || undefined,
                      is_approved: tutorProfile?.is_approved || false,
                    })}
                  />
                </div>

                <Button onClick={saveTutorProfile} disabled={saving} className="w-full">
                  {saving ? 'Saving...' : 'Save Tutor Profile'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}