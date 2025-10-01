import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

interface BookingCalendarProps {
  tutorId: string;
  onBookingComplete?: () => void;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

interface Availability {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export function BookingCalendar({ tutorId, onBookingComplete }: BookingCalendarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, [tutorId]);

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
    }
  }, [selectedDate, availability]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tutor_availability')
        .select('*')
        .eq('tutor_id', tutorId)
        .eq('is_available', true);

      if (error) throw error;
      setAvailability(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load availability",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = async () => {
    if (!selectedDate) return;

    const dayOfWeek = selectedDate.getDay();
    const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek);

    if (dayAvailability.length === 0) {
      setTimeSlots([]);
      return;
    }

    // Get existing bookings for the selected date
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('tutor_id', tutorId)
      .eq('session_date', selectedDate.toISOString().split('T')[0])
      .neq('status', 'cancelled');

    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }

    const bookedTimes = bookings?.map(b => ({
      start: b.start_time,
      end: b.end_time
    })) || [];

    // Generate time slots
    const slots: TimeSlot[] = [];
    
    dayAvailability.forEach(avail => {
      const startHour = parseInt(avail.start_time.split(':')[0]);
      const endHour = parseInt(avail.end_time.split(':')[0]);
      
      for (let hour = startHour; hour < endHour; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        const endTimeSlot = `${(hour + 1).toString().padStart(2, '0')}:00`;
        
        const isBooked = bookedTimes.some(booking => 
          booking.start <= timeSlot && booking.end > timeSlot
        );

        slots.push({
          start_time: timeSlot,
          end_time: endTimeSlot,
          available: !isBooked
        });
      }
    });

    setTimeSlots(slots);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !user) {
      toast({
        title: "Error",
        description: "Please select a date, time, and make sure you're logged in",
        variant: "destructive",
      });
      return;
    }

    // Check email verification
    const { data: profileData } = await supabase
      .from('profiles')
      .select('email_verified')
      .eq('user_id', user.id)
      .single();

    if (!profileData?.email_verified) {
      toast({
        title: "Email Verification Required",
        description: "Please verify your email before booking sessions. Check your inbox for the verification link.",
        variant: "destructive",
      });
      return;
    }

    try {
      setBookingLoading(true);
      
      const selectedSlot = timeSlots.find(slot => slot.start_time === selectedTime);
      if (!selectedSlot) return;

      // Check for booking conflicts
      const { data: conflictCheck, error: conflictError } = await supabase
        .rpc('check_booking_conflict', {
          p_tutor_id: tutorId,
          p_session_date: selectedDate.toISOString().split('T')[0],
          p_start_time: selectedSlot.start_time,
          p_end_time: selectedSlot.end_time
        });

      if (conflictError) throw conflictError;

      if (conflictCheck) {
        toast({
          title: "Slot Taken",
          description: "This time slot is no longer available. Please choose another time.",
          variant: "destructive",
        });
        generateTimeSlots(); // Refresh to show updated slots
        return;
      }

      const { error } = await supabase
        .from('bookings')
        .insert({
          tutor_id: tutorId,
          student_id: user.id,
          session_date: selectedDate.toISOString().split('T')[0],
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          subject: subject || null,
          notes: notes || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking request sent successfully! The tutor will confirm shortly.",
      });

      // Reset form
      setSelectedTime('');
      setSubject('');
      setNotes('');
      generateTimeSlots(); // Refresh time slots

      onBookingComplete?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to book a session</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Book a Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calendar */}
        <div>
          <h4 className="font-medium mb-3">Select Date</h4>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date() || date < new Date(new Date().setHours(0, 0, 0, 0))}
            className="rounded-md border"
          />
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Available Times
            </h4>
            {loading ? (
              <p className="text-muted-foreground">Loading availability...</p>
            ) : timeSlots.length === 0 ? (
              <p className="text-muted-foreground">No available times for this date</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.start_time}
                    variant={selectedTime === slot.start_time ? "default" : "outline"}
                    size="sm"
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.start_time)}
                    className="text-xs"
                  >
                    {slot.start_time}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subject */}
        {selectedTime && (
          <div>
            <label className="text-sm font-medium">Subject (Optional)</label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mathematics">Mathematics</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="physics">Physics</SelectItem>
                <SelectItem value="chemistry">Chemistry</SelectItem>
                <SelectItem value="biology">Biology</SelectItem>
                <SelectItem value="history">History</SelectItem>
                <SelectItem value="geography">Geography</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Notes */}
        {selectedTime && (
          <div>
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific topics or requirements..."
              className="mt-1"
            />
          </div>
        )}

        {/* Book Button */}
        {selectedTime && (
          <Button
            onClick={handleBooking}
            disabled={bookingLoading}
            className="w-full"
          >
            {bookingLoading ? 'Booking...' : 'Book Session'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}