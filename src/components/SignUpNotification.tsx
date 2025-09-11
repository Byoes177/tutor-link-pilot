import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, X } from 'lucide-react';

interface SignUpNotificationProps {
  show: boolean;
  onDismiss: () => void;
}

export function SignUpNotification({ show, onDismiss }: SignUpNotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300); // Wait for animation to complete
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300); // Wait for animation to complete
  };

  if (!show) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      visible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
    }`}>
      <Card className="w-96 border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Mail className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-green-900 mb-1">
                Check Your Email!
              </h4>
              <p className="text-sm text-green-700">
                Check your email inbox to confirm your account before logging in. 
                If you don't see it, check your spam folder.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-100 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}