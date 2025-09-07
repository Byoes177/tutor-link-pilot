import { useState, useEffect } from 'react';
import { TutorCard } from '@/components/TutorCard';
import { TutorFilters, FilterState } from '@/components/TutorFilters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

        {filteredTutors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No tutors found matching your criteria.
            </p>
          </div>
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