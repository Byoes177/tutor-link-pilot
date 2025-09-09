import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Users, FileCheck, UserCheck, BookOpen, Download, Check, X, Shield, Edit, Trash2, Calendar, MessageSquare } from 'lucide-react';

interface User {
  id: string;
  user_id: string;
  email: string;
  role: 'student' | 'tutor' | 'admin';
  full_name: string;
  created_at: string;
}

interface TutorProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  bio: string;
  subjects: string[];
  hourly_rate: number;
  is_approved: boolean;
  rating: number;
  total_reviews: number;
  created_at: string;
}

interface Booking {
  id: string;
  student_id: string;
  tutor_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  subject: string;
  notes: string;
  created_at: string;
}

interface Review {
  id: string;
  student_id: string;
  tutor_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface Certificate {
  id: string;
  tutor_id: string;
  file_name: string;
  is_approved: boolean;
  tutor_name: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingTutor, setEditingTutor] = useState<TutorProfile | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch tutors
      const { data: tutorsData, error: tutorsError } = await supabase
        .from('tutors')
        .select('*')
        .order('created_at', { ascending: false });

      if (tutorsError) throw tutorsError;
      setTutors(tutorsData || []);

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // Fetch certificates with tutor info
      const { data: certificatesData, error: certificatesError } = await supabase
        .from('certificate_approvals')
        .select(`
          *,
          tutors!inner(full_name)
        `)
        .order('created_at', { ascending: false });

      if (certificatesError) throw certificatesError;
      
      const formattedCertificates = certificatesData?.map(cert => ({
        ...cert,
        tutor_name: cert.tutors.full_name
      })) || [];
      
      setCertificates(formattedCertificates);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'student' | 'tutor' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const updateUserProfile = async (user: User) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: user.full_name,
          email: user.email 
        })
        .eq('user_id', user.user_id);

      if (error) throw error;

      // Also update the tutors table if this user is a tutor
      if (user.role === 'tutor') {
        await supabase
          .from('tutors')
          .update({ 
            full_name: user.full_name,
            email: user.email 
          })
          .eq('user_id', user.user_id);
      }

      toast({
        title: "Success",
        description: "User profile updated successfully",
      });

      setEditingUser(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user profile",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const updateTutorProfile = async (tutor: TutorProfile) => {
    try {
      const { error } = await supabase
        .from('tutors')
        .update({
          bio: tutor.bio,
          subjects: tutor.subjects,
          hourly_rate: tutor.hourly_rate,
          is_approved: tutor.is_approved
        })
        .eq('id', tutor.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tutor profile updated successfully",
      });

      setEditingTutor(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update tutor profile",
        variant: "destructive",
      });
    }
  };

  const deleteBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete booking",
        variant: "destructive",
      });
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const approveCertificate = async (certificateId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('certificate_approvals')
        .update({
          is_approved: approved,
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', certificateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Certificate ${approved ? 'approved' : 'rejected'} successfully`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update certificate status",
        variant: "destructive",
      });
    }
  };

  const downloadCertificate = async (fileName: string, tutorId: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('certificates')
        .download(`${tutorId}/${fileName}`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download certificate",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = selectedRole && selectedRole !== 'all'
    ? users.filter(user => user.role === selectedRole)
    : users;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, certificates, and platform settings</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tutors</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.role === 'tutor').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.role === 'student').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Certificates</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {certificates.filter(c => !c.is_approved).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="tutors">Tutors</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Management</CardTitle>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="tutor">Tutor</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{user.full_name || 'No name'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          user.role === 'admin' ? 'default' : 
                          user.role === 'tutor' ? 'secondary' : 'outline'
                        }>
                          {user.role}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit User Profile</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                  id="fullName"
                                  value={editingUser?.full_name || ''}
                                  onChange={(e) => setEditingUser(prev => prev ? {...prev, full_name: e.target.value} : null)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                  id="email"
                                  value={editingUser?.email || ''}
                                  onChange={(e) => setEditingUser(prev => prev ? {...prev, email: e.target.value} : null)}
                                />
                              </div>
                              <Button onClick={() => editingUser && updateUserProfile(editingUser)}>
                                Save Changes
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Select
                          value={user.role}
                          onValueChange={(newRole: 'student' | 'tutor' | 'admin') => updateUserRole(user.user_id, newRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="tutor">Tutor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUser(user.user_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Certificate Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {certificates.map((certificate) => (
                    <div key={certificate.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{certificate.tutor_name}</p>
                            <p className="text-sm text-muted-foreground">{certificate.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded: {new Date(certificate.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={certificate.is_approved ? 'default' : 'secondary'}>
                          {certificate.is_approved ? 'Approved' : 'Pending'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadCertificate(certificate.file_name, certificate.tutor_id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {!certificate.is_approved && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => approveCertificate(certificate.id, true)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => approveCertificate(certificate.id, false)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {certificates.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No certificates found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tutors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tutor Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tutors.map((tutor) => (
                    <div key={tutor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{tutor.full_name}</p>
                            <p className="text-sm text-muted-foreground">{tutor.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Rate: ${tutor.hourly_rate}/hr | Rating: {tutor.rating}/5 ({tutor.total_reviews} reviews)
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Subjects: {tutor.subjects.join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={tutor.is_approved ? 'default' : 'secondary'}>
                          {tutor.is_approved ? 'Approved' : 'Pending'}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingTutor(tutor)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Tutor Profile</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                  id="bio"
                                  value={editingTutor?.bio || ''}
                                  onChange={(e) => setEditingTutor(prev => prev ? {...prev, bio: e.target.value} : null)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="rate">Hourly Rate</Label>
                                <Input
                                  id="rate"
                                  type="number"
                                  value={editingTutor?.hourly_rate || 0}
                                  onChange={(e) => setEditingTutor(prev => prev ? {...prev, hourly_rate: parseFloat(e.target.value)} : null)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="subjects">Subjects (comma-separated)</Label>
                                <Input
                                  id="subjects"
                                  value={editingTutor?.subjects.join(', ') || ''}
                                  onChange={(e) => setEditingTutor(prev => prev ? {...prev, subjects: e.target.value.split(',').map(s => s.trim())} : null)}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="approved"
                                  checked={editingTutor?.is_approved || false}
                                  onChange={(e) => setEditingTutor(prev => prev ? {...prev, is_approved: e.target.checked} : null)}
                                />
                                <Label htmlFor="approved">Approved</Label>
                              </div>
                              <Button onClick={() => editingTutor && updateTutorProfile(editingTutor)}>
                                Save Changes
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                  {tutors.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No tutors found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Booking Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">
                              {booking.subject} - {new Date(booking.session_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {booking.start_time} - {booking.end_time}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Status: {booking.status} | Notes: {booking.notes || 'None'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          booking.status === 'confirmed' ? 'default' : 
                          booking.status === 'pending' ? 'secondary' : 'outline'
                        }>
                          {booking.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteBooking(booking.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {bookings.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No bookings found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Review Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">Rating: {review.rating}/5</p>
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {review.rating} ⭐
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteReview(review.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No reviews found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}