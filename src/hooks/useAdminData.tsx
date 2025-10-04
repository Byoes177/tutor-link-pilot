import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'student' | 'tutor' | 'admin';
  created_at: string;
}

export interface TutorProfile {
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

export interface Booking {
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
  student_name?: string;
  tutor_name?: string;
}

export interface Review {
  id: string;
  student_id: string;
  tutor_id: string;
  rating: number;
  comment: string;
  created_at: string;
  student_name?: string;
  tutor_name?: string;
}

export interface Certificate {
  id: string;
  tutor_id: string;
  file_name: string;
  is_approved: boolean;
  approved_by: string;
  approved_at: string;
  created_at: string;
  tutor_name?: string;
}

// Query keys
export const QUERY_KEYS = {
  users: ['users'],
  tutors: ['tutors'],
  bookings: ['bookings'],
  reviews: ['reviews'],
  certificates: ['certificates'],
} as const;

// Users hook
export function useUsers() {
  return useQuery({
    queryKey: QUERY_KEYS.users,
    queryFn: async (): Promise<User[]> => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .maybeSingle();
          
          return {
            id: profile.user_id, // Use user_id as id for role operations
            full_name: profile.full_name,
            email: profile.email,
            role: roleData?.role || 'student',
            created_at: profile.created_at,
          } as User;
        })
      );
      
      return usersWithRoles;
    },
  });
}

// Tutors hook
export function useTutors() {
  return useQuery({
    queryKey: QUERY_KEYS.tutors,
    queryFn: async (): Promise<TutorProfile[]> => {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });
}

// Bookings hook
export function useBookings() {
  return useQuery({
    queryKey: QUERY_KEYS.bookings,
    queryFn: async (): Promise<Booking[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Manually fetch student and tutor names
      const enrichedBookings = await Promise.all(
        (data || []).map(async (booking) => {
          // Get student name
          const { data: studentData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', booking.student_id)
            .single();
          
          // Get tutor name
          const { data: tutorData } = await supabase
            .from('tutors')
            .select('full_name')
            .eq('id', booking.tutor_id)
            .single();
          
          return {
            ...booking,
            student_name: studentData?.full_name || 'Unknown',
            tutor_name: tutorData?.full_name || 'Unknown',
          };
        })
      );
      
      return enrichedBookings;
    },
  });
}

// Reviews hook
export function useReviews() {
  return useQuery({
    queryKey: QUERY_KEYS.reviews,
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Manually fetch student and tutor names
      const enrichedReviews = await Promise.all(
        (data || []).map(async (review) => {
          // Get student name
          const { data: studentData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', review.student_id)
            .single();
          
          // Get tutor name
          const { data: tutorData } = await supabase
            .from('tutors')
            .select('full_name')
            .eq('id', review.tutor_id)
            .single();
          
          return {
            ...review,
            student_name: studentData?.full_name || 'Unknown',
            tutor_name: tutorData?.full_name || 'Unknown',
          };
        })
      );
      
      return enrichedReviews;
    },
  });
}

// Certificates hook
export function useCertificates() {
  return useQuery({
    queryKey: QUERY_KEYS.certificates,
    queryFn: async (): Promise<Certificate[]> => {
      const { data, error } = await supabase
        .from('certificate_approvals')
        .select(`
          *,
          tutor:tutors!tutor_id (full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(cert => ({
        ...cert,
        tutor_name: cert.tutor?.full_name || 'Unknown',
      }));
    },
  });
}

// Mutations
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'student' | 'tutor' | 'admin' }) => {
      // Check if role exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: (error) => {
      console.error('Role update error:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (user: User) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: user.full_name,
          email: user.email,
        })
        .eq('user_id', user.id);
      
      if (error) throw error;

      // Also update tutor profile if user is a tutor
      if (user.role === 'tutor') {
        const { error: tutorError } = await supabase
          .from('tutors')
          .update({
            full_name: user.full_name,
            email: user.email,
          })
          .eq('user_id', user.id);
        
        if (tutorError) throw tutorError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tutors });
      toast({
        title: "Success",
        description: "User profile updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user profile",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tutors });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTutorProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tutor: TutorProfile) => {
      const { error } = await supabase
        .from('tutors')
        .update({
          bio: tutor.bio,
          subjects: tutor.subjects,
          hourly_rate: tutor.hourly_rate,
          is_approved: tutor.is_approved,
        })
        .eq('id', tutor.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tutors });
      toast({
        title: "Success",
        description: "Tutor profile updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tutor profile",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookings });
      toast({
        title: "Success",
        description: "Booking deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete booking",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reviews });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tutors });
      toast({
        title: "Success",
        description: "Review deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    },
  });
}

export function useApproveCertificate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ certificateId, approved }: { certificateId: string; approved: boolean }) => {
      const { error } = await supabase
        .from('certificate_approvals')
        .update({
          is_approved: approved,
          approved_at: new Date().toISOString(),
        })
        .eq('id', certificateId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.certificates });
      toast({
        title: "Success",
        description: "Certificate approval status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update certificate approval status",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCertificate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ certificateId, fileName, tutorId }: { certificateId: string; fileName: string; tutorId: string }) => {
      // Get the tutor's user_id to build the correct path
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .select('user_id')
        .eq('id', tutorId)
        .single();

      if (tutorError) throw tutorError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('certificates')
        .remove([`${tutorData.user_id}/${fileName}`]);

      if (storageError) throw storageError;

      // Delete from certificate_approvals table
      const { error: dbError } = await supabase
        .from('certificate_approvals')
        .delete()
        .eq('id', certificateId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.certificates });
      toast({
        title: "Success",
        description: "Certificate deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete certificate",
        variant: "destructive",
      });
    },
  });
}

// Real-time subscriptions hook
export function useRealTimeSubscriptions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channels: any[] = [];

    // Subscribe to users changes
    const usersChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
        }
      )
      .subscribe();
    channels.push(usersChannel);

    // Subscribe to tutors changes
    const tutorsChannel = supabase
      .channel('tutors-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tutors' },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tutors });
        }
      )
      .subscribe();
    channels.push(tutorsChannel);

    // Subscribe to bookings changes
    const bookingsChannel = supabase
      .channel('bookings-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookings });
        }
      )
      .subscribe();
    channels.push(bookingsChannel);

    // Subscribe to reviews changes
    const reviewsChannel = supabase
      .channel('reviews-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reviews });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tutors });
        }
      )
      .subscribe();
    channels.push(reviewsChannel);

    // Subscribe to certificates changes
    const certificatesChannel = supabase
      .channel('certificates-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'certificate_approvals' },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.certificates });
        }
      )
      .subscribe();
    channels.push(certificatesChannel);

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [queryClient]);
}