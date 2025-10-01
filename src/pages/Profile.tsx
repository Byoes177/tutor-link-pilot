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
import { X, Upload, FileText, Download, Trash } from 'lucide-react';

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
  const [certificates, setCertificates] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile?.role === 'tutor') {
      fetchTutorProfile();
      fetchCertificates();
    }
  }, [profile?.role]);

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

  const fetchCertificates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.storage
        .from('certificates')
        .list(`${user.id}/`, {
          limit: 100,
          offset: 0,
        });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
  };

  const uploadCertificate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Only PDF, JPEG, and PNG files are allowed.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'File size must be less than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: storageError } = await supabase.storage
        .from('certificates')
        .upload(`${user.id}/${fileName}`, file);

      if (storageError) throw storageError;

      // Get tutor ID for the current user
      const { data: tutorData } = await supabase
        .from('tutors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (tutorData) {
        // Add to certificate_approvals table for admin review
        const { error: approvalError } = await supabase
          .from('certificate_approvals')
          .insert({
            tutor_id: tutorData.id,
            file_name: fileName,
            is_approved: false
          });

        if (approvalError) throw approvalError;
      }

      toast({
        title: 'Certificate uploaded',
        description: 'Your certificate has been uploaded and is pending admin approval.',
      });

      fetchCertificates();
    } catch (error) {
      console.error('Error uploading certificate:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload certificate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const deleteCertificate = async (fileName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.storage
        .from('certificates')
        .remove([`${user.id}/${fileName}`]);

      if (error) throw error;

      toast({
        title: 'Certificate deleted',
        description: 'Certificate has been removed successfully.',
      });

      fetchCertificates();
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete certificate. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const downloadCertificate = async (fileName: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.storage
        .from('certificates')
        .download(`${user.id}/${fileName}`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download certificate. Please try again.',
        variant: 'destructive',
      });
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
            <>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={(tutorProfile as any)?.gender || ''}
                        onChange={(e) => setTutorProfile({
                          ...tutorProfile,
                          full_name: profile?.full_name || '',
                          email: profile?.email || '',
                          subjects: tutorProfile?.subjects || [],
                          is_approved: tutorProfile?.is_approved || false,
                          gender: e.target.value
                        } as any)}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="experience">Experience (years)</Label>
                      <Input
                        id="experience"
                        type="number"
                        min="0"
                        placeholder="5"
                        value={(tutorProfile as any)?.experience_years || ''}
                        onChange={(e) => setTutorProfile({
                          ...tutorProfile,
                          full_name: profile?.full_name || '',
                          email: profile?.email || '',
                          subjects: tutorProfile?.subjects || [],
                          is_approved: tutorProfile?.is_approved || false,
                          experience_years: parseInt(e.target.value) || undefined
                        } as any)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Gadong, Kiulap, or Online"
                      value={(tutorProfile as any)?.location || ''}
                      onChange={(e) => setTutorProfile({
                        ...tutorProfile,
                        full_name: profile?.full_name || '',
                        email: profile?.email || '',
                        subjects: tutorProfile?.subjects || [],
                        is_approved: tutorProfile?.is_approved || false,
                        location: e.target.value
                      } as any)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="languages">Languages (comma-separated)</Label>
                    <Input
                      id="languages"
                      placeholder="e.g., English, Malay, Mandarin"
                      value={(tutorProfile as any)?.languages?.join(', ') || ''}
                      onChange={(e) => setTutorProfile({
                        ...tutorProfile,
                        full_name: profile?.full_name || '',
                        email: profile?.email || '',
                        subjects: tutorProfile?.subjects || [],
                        is_approved: tutorProfile?.is_approved || false,
                        languages: e.target.value.split(',').map(l => l.trim()).filter(l => l)
                      } as any)}
                    />
                  </div>

                  <Button onClick={saveTutorProfile} disabled={saving} className="w-full">
                    {saving ? 'Saving...' : 'Save Tutor Profile'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Certificates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-3">
                     <Label className="block text-sm font-medium">
                       📋 Upload Certificate
                     </Label>
                     <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                       <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                       <p className="text-sm text-muted-foreground mb-4">
                         Upload your teaching certificates or qualifications
                       </p>
                       <Input
                         id="certificate-upload"
                         type="file"
                         accept=".pdf,.jpg,.jpeg,.png"
                         onChange={uploadCertificate}
                         disabled={uploading}
                         className="hidden"
                       />
                       <Button 
                         variant="outline" 
                         onClick={() => document.getElementById('certificate-upload')?.click()}
                         disabled={uploading}
                       >
                         {uploading ? 'Uploading...' : '🔗 Choose File'}
                       </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          PDF, JPEG, PNG - Max 10MB
                        </p>
                     </div>
                   </div>

                  {certificates.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Uploaded Certificates:</h4>
                      {certificates.map((cert) => (
                        <div key={cert.name} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm truncate">{cert.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadCertificate(cert.name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteCertificate(cert.name)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}