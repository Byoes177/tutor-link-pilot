import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { TutorProfile } from '@/components/TutorProfile';
import { BookingCalendar } from '@/components/BookingCalendar';
import { Messaging } from '@/components/Messaging';
import { PaymentFlow } from '@/components/PaymentFlow';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, MessageCircle, CreditCard } from 'lucide-react';

export default function TutorProfilePage() {
  const { tutorId } = useParams<{ tutorId: string }>();
  const [activeTab, setActiveTab] = useState('profile');
  const [paymentData, setPaymentData] = useState<{
    tutorName: string;
    hourlyRate: number;
    sessionDate: string;
    sessionTime: string;
    subject?: string;
  } | null>(null);

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
              onBookSession={() => setActiveTab('booking')}
            />
          </div>
          
          <div className="lg:col-span-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile" className="text-xs">
                  Profile
                </TabsTrigger>
                <TabsTrigger value="booking" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Book
                </TabsTrigger>
                <TabsTrigger value="messaging" className="text-xs">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="payment" className="text-xs" disabled={!paymentData}>
                  <CreditCard className="h-3 w-3 mr-1" />
                  Pay
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  <p>View tutor details on the left</p>
                </div>
              </TabsContent>

              <TabsContent value="booking" className="mt-4">
                <BookingCalendar 
                  tutorId={tutorId}
                  onBookingComplete={() => {
                    // Mock tutor data for demo
                    setPaymentData({
                      tutorName: 'Selected Tutor',
                      hourlyRate: 50,
                      sessionDate: new Date().toLocaleDateString(),
                      sessionTime: '10:00 AM',
                      subject: 'Mathematics'
                    });
                    setActiveTab('payment');
                  }}
                />
              </TabsContent>

              <TabsContent value="messaging" className="mt-4">
                <Messaging 
                  recipientId={tutorId}
                  recipientName="Tutor"
                  recipientType="tutor"
                />
              </TabsContent>

              <TabsContent value="payment" className="mt-4">
                {paymentData && (
                  <PaymentFlow 
                    {...paymentData}
                    onPaymentComplete={() => {
                      setActiveTab('profile');
                      setPaymentData(null);
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}