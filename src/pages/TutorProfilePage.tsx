import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { TutorProfile } from '@/components/TutorProfile';
import { BookingCalendar } from '@/components/BookingCalendar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TutorProfilePage() {
  const { tutorId } = useParams<{ tutorId: string }>();
  const [showBooking, setShowBooking] = useState(false);

  if (!tutorId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Tutor not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tutors
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TutorProfile 
              tutorId={tutorId} 
              onBookSession={() => setShowBooking(true)}
            />
          </div>
          
          <div className="lg:col-span-1">
            {showBooking && (
              <BookingCalendar 
                tutorId={tutorId}
                onBookingComplete={() => setShowBooking(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}