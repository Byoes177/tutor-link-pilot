import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, BookOpen, Calendar, Star, FileCheck, Trash2, Edit, Download, CheckCircle, XCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { 
  useUsers, 
  useTutors, 
  useBookings, 
  useReviews, 
  useCertificates,
  useUpdateUserRole,
  useUpdateUserProfile,
  useDeleteUser,
  useUpdateTutorProfile,
  useDeleteBooking,
  useDeleteReview,
  useApproveCertificate,
  useDeleteCertificate,
  useRealTimeSubscriptions,
  type User,
  type TutorProfile,
  type Booking,
  type Review,
  type Certificate
} from '@/hooks/useAdminData';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const { toast } = useToast();
  
  // Use React Query hooks
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useUsers();
  const { data: tutors = [], isLoading: tutorsLoading, refetch: refetchTutors } = useTutors();
  const { data: bookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = useBookings();
  const { data: reviews = [], isLoading: reviewsLoading, refetch: refetchReviews } = useReviews();
  const { data: certificates = [], isLoading: certificatesLoading, refetch: refetchCertificates } = useCertificates();
  
  // Mutations
  const updateUserRoleMutation = useUpdateUserRole();
  const updateUserProfileMutation = useUpdateUserProfile();
  const deleteUserMutation = useDeleteUser();
  const updateTutorProfileMutation = useUpdateTutorProfile();
  const deleteBookingMutation = useDeleteBooking();
  const deleteReviewMutation = useDeleteReview();
  const approveCertificateMutation = useApproveCertificate();
  const deleteCertificateMutation = useDeleteCertificate();
  
  // Set up real-time subscriptions
  useRealTimeSubscriptions();
  
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingTutor, setEditingTutor] = useState<TutorProfile | null>(null);

  const loading = usersLoading || tutorsLoading || bookingsLoading || reviewsLoading || certificatesLoading;

  // Filter users based on role
  useEffect(() => {
    if (userRoleFilter === 'all') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user => user.role === userRoleFilter));
    }
  }, [users, userRoleFilter]);

  // Refresh functions for manual refresh
  const refreshData = () => {
    refetchUsers();
    refetchTutors();
    refetchBookings();
    refetchReviews();
    refetchCertificates();
  };

  const downloadCertificate = async (fileName: string, tutorId: string) => {
    try {
      // Get the tutor's user_id to build the correct path
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .select('user_id')
        .eq('id', tutorId)
        .single();

      if (tutorError) throw tutorError;

      const { data, error } = await supabase.storage
        .from('certificates')
        .download(`${tutorData.user_id}/${fileName}`);

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={refreshData} variant="outline">
            Refresh Data
          </Button>
        </div>

        {/* Summary Cards */}
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
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tutors.length}</div>
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

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Management</CardTitle>
                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
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
                        <Select
                          value={user.role}
                          onValueChange={(value: 'student' | 'tutor' | 'admin') => 
                            updateUserRoleMutation.mutate({ userId: user.id, newRole: value })
                          }
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
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUserMutation.mutate(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Edit User Dialog */}
                {editingUser && (
                  <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit User Profile</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={editingUser.full_name}
                            onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={editingUser.email}
                            onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={() => {
                            updateUserProfileMutation.mutate(editingUser);
                            setEditingUser(null);
                          }}
                          disabled={!editingUser.full_name || !editingUser.email}
                        >
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tutors Tab */}
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
                              Subjects: {tutor.subjects.join(', ')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Rate: ${tutor.hourly_rate}/hour
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={tutor.is_approved ? 'default' : 'destructive'}>
                          {tutor.is_approved ? 'Approved' : 'Pending'}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">{tutor.rating}</span>
                          <span className="text-xs text-muted-foreground">({tutor.total_reviews})</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTutor(tutor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Edit Tutor Dialog */}
                {editingTutor && (
                  <Dialog open={!!editingTutor} onOpenChange={() => setEditingTutor(null)}>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Tutor Profile</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={editingTutor.bio}
                            onChange={(e) => setEditingTutor({...editingTutor, bio: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="subjects">Subjects (comma-separated)</Label>
                          <Input
                            id="subjects"
                            value={editingTutor.subjects.join(', ')}
                            onChange={(e) => setEditingTutor({
                              ...editingTutor, 
                              subjects: e.target.value.split(',').map(s => s.trim())
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="hourly_rate">Hourly Rate</Label>
                          <Input
                            id="hourly_rate"
                            type="number"
                            value={editingTutor.hourly_rate}
                            onChange={(e) => setEditingTutor({...editingTutor, hourly_rate: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is_approved"
                            checked={editingTutor.is_approved}
                            onChange={(e) => setEditingTutor({...editingTutor, is_approved: e.target.checked})}
                          />
                          <Label htmlFor="is_approved">Approved</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={() => {
                            updateTutorProfileMutation.mutate(editingTutor);
                            setEditingTutor(null);
                          }}
                          disabled={!editingTutor.bio || !editingTutor.subjects.length || !editingTutor.hourly_rate}
                        >
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
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
                          <Calendar className="h-4 w-4" />
                          <div>
                            <p className="font-medium">
                              {booking.student_name} → {booking.tutor_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {booking.session_date} at {booking.start_time} - {booking.end_time}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Subject: {booking.subject} | Status: {booking.status}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          booking.status === 'confirmed' ? 'default' : 
                          booking.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {booking.status}
                        </Badge>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteBookingMutation.mutate(booking.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {bookings.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No bookings found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
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
                          <Star className="h-4 w-4 text-yellow-500" />
                          <div>
                            <p className="font-medium">
                              {review.student_name} → {review.tutor_name}
                            </p>
                            <div className="flex items-center gap-1 my-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="text-sm ml-1">({review.rating})</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteReviewMutation.mutate(review.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No reviews found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificates Tab */}
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
                          <FileCheck className="h-4 w-4" />
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
                              onClick={() => approveCertificateMutation.mutate({ certificateId: certificate.id, approved: true })}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => approveCertificateMutation.mutate({ certificateId: certificate.id, approved: false })}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteCertificateMutation.mutate({ 
                            certificateId: certificate.id, 
                            fileName: certificate.file_name, 
                            tutorId: certificate.tutor_id 
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {certificates.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No certificates found.</p>
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