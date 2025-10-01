import { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Mail, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailVerificationPromptProps {
  email: string;
  onResend: () => void;
  onDismiss: () => void;
}

export function EmailVerificationPrompt({ email, onResend, onDismiss }: EmailVerificationPromptProps) {
  const [open, setOpen] = useState(true);
  const { toast } = useToast();

  const handleResend = () => {
    onResend();
    toast({
      title: 'Verification email sent',
      description: 'Please check your inbox and spam folder.',
    });
  };

  const handleClose = () => {
    setOpen(false);
    onDismiss();
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
        
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-center">
            Check your email to confirm your account
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-4">
            <p>
              A confirmation email has been sent to <strong>{email}</strong>
            </p>
            <p>
              Please click the link in the email to verify your account.
              If you don't see it, check your spam folder.
            </p>
            <div className="bg-muted p-3 rounded text-sm">
              <strong>Note:</strong> You can browse and update your profile, but booking
              sessions requires email verification.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={handleResend} variant="outline">
            Resend Verification Email
          </Button>
          <Button onClick={handleClose} variant="secondary">
            I'll Verify Later
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}