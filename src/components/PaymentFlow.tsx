import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, DollarSign, Clock, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentFlowProps {
  tutorName: string;
  hourlyRate: number;
  sessionDate: string;
  sessionTime: string;
  subject?: string;
  onPaymentComplete?: () => void;
}

export function PaymentFlow({ 
  tutorName, 
  hourlyRate, 
  sessionDate, 
  sessionTime, 
  subject,
  onPaymentComplete 
}: PaymentFlowProps) {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const sessionDuration = 1; // 1 hour default
  const subtotal = hourlyRate * sessionDuration;
  const platformFee = subtotal * 0.1; // 10% platform fee
  const total = subtotal + platformFee;

  const handlePayment = async (method: 'stripe' | 'paypal') => {
    setProcessing(true);
    
    try {
      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`💳 Payment processed via ${method.toUpperCase()}:`, {
        tutor: tutorName,
        amount: total,
        session: {
          date: sessionDate,
          time: sessionTime,
          subject: subject || 'General tutoring'
        }
      });

      toast({
        title: 'Payment Successful!',
        description: `Your session with ${tutorName} has been booked and paid for.`,
      });

      onPaymentComplete?.();
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'There was an issue processing your payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Summary */}
        <div className="space-y-3">
          <h4 className="font-medium">Session Summary</h4>
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tutor</span>
              <span className="text-sm font-medium">{tutorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date
              </span>
              <span className="text-sm font-medium">{sessionDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Time
              </span>
              <span className="text-sm font-medium">{sessionTime}</span>
            </div>
            {subject && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Subject</span>
                <Badge variant="outline">{subject}</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium">Pricing</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Tutoring session ({sessionDuration}h)</span>
              <span className="text-sm">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Platform fee (10%)</span>
              <span className="text-sm text-muted-foreground">${platformFee.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          <h4 className="font-medium">Payment Method</h4>
          <div className="space-y-2">
            <Button
              onClick={() => handlePayment('stripe')}
              disabled={processing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {processing ? 'Processing...' : 'Pay with Stripe - Coming Soon'}
            </Button>
            <Button
              onClick={() => handlePayment('paypal')}
              disabled={processing}
              variant="outline"
              className="w-full"
            >
              {processing ? 'Processing...' : 'Pay with PayPal - Coming Soon'}
            </Button>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-yellow-800">
              🚧 <strong>Demo Mode:</strong> Payment integration is coming soon. 
              This is a placeholder for demonstration purposes.
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-xs text-muted-foreground text-center border-t pt-3">
          🔒 Your payment information is secure and encrypted
        </div>
      </CardContent>
    </Card>
  );
}