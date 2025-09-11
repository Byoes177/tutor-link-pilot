import { useState, useEffect } from 'react';
import { TutorCard } from '@/components/TutorCard';
import { TutorFilters, FilterState } from '@/components/TutorFilters';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Search } from 'lucide-react';

interface Tutor {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  subjects: string[];
  bio?: string;
  availability?: string;
  hourly_rate?: number;
  education_level?: string;
  teaching_level?: string[];
  gender?: string;
  teaching_location?: string[];
  rating: number;
  total_reviews: number;
}

export default function Tutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('is_approved', true);

      if (error) throw error;
      setTutors(data || []);
      setFilteredTutors(data || []); // Initialize filtered tutors with all tutors
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

  const handleFiltersChange = (filters: FilterState) => {
    let filtered = tutors;

    // Search query
    if (filters.searchQuery) {
      filtered = filtered.filter((tutor) =>
        tutor.full_name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        tutor.subjects.some(subject => 
          subject.toLowerCase().includes(filters.searchQuery.toLowerCase())
        ) ||
        tutor.bio?.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    // Education level filter
    if (filters.educationLevel.length > 0) {
      filtered = filtered.filter(tutor => 
        tutor.education_level && filters.educationLevel.includes(tutor.education_level)
      );
    }

    // Teaching level filter
    if (filters.teachingLevel.length > 0) {
      filtered = filtered.filter(tutor => 
        tutor.teaching_level && tutor.teaching_level.some(level => 
          filters.teachingLevel.includes(level)
        )
      );
    }

    // Subjects filter
    if (filters.subjects.length > 0) {
      filtered = filtered.filter(tutor => 
        tutor.subjects.some(subject => 
          filters.subjects.includes(subject)
        )
      );
    }

    // Gender filter
    if (filters.gender.length > 0) {
      filtered = filtered.filter(tutor => 
        tutor.gender && filters.gender.includes(tutor.gender)
      );
    }

    // Teaching location filter
    if (filters.teachingLocation.length > 0) {
      filtered = filtered.filter(tutor => 
        tutor.teaching_location && tutor.teaching_location.some(location => 
          filters.teachingLocation.includes(location)
        )
      );
    }

    // Rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(tutor => tutor.rating >= filters.minRating);
    }

    // Hourly rate filter
    if (filters.maxHourlyRate < 1000) {
      filtered = filtered.filter(tutor => 
        !tutor.hourly_rate || tutor.hourly_rate <= filters.maxHourlyRate
      );
    }

    setFilteredTutors(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading tutors...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Find a Tutor</h1>
          <TutorFilters onFiltersChange={handleFiltersChange} />
        </div>

        {tutors.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6 text-muted-foreground" />}
            title="No tutors available"
            description="There are currently no approved tutors on the platform. Check back soon as we're always adding new qualified tutors!"
          />
        ) : filteredTutors.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6 text-muted-foreground" />}
            title="No tutors found"
            description="No tutors match your current search criteria. Try adjusting your filters or check back later for new tutors."
            actionLabel="Clear Filters"
            onAction={() => window.location.reload()}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}