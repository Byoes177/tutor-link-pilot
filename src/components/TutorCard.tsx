import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Clock, DollarSign, FileText, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TutorCardProps {
  tutor: {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    subjects: string[];
    bio?: string;
    availability?: string;
    hourly_rate?: number;
  };
}

export function TutorCard({ tutor }: TutorCardProps) {
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<any[]>([]);

  useEffect(() => {
    fetchCertificates();
  }, [tutor.user_id]);

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('certificates')
        .list(`${tutor.user_id}/`, {
          limit: 100,
          offset: 0,
        });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
  };

  const handleContact = () => {
    window.location.href = `mailto:${tutor.email}?subject=Tutoring Inquiry`;
  };

  const downloadCertificate = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('certificates')
        .download(`${tutor.user_id}/${fileName}`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download certificate. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{tutor.full_name}</CardTitle>
        <div className="flex flex-wrap gap-1">
          {tutor.subjects.map((subject) => (
            <Badge key={subject} variant="secondary" className="text-xs">
              {subject}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tutor.bio && (
          <p className="text-sm text-muted-foreground line-clamp-3">{tutor.bio}</p>
        )}
        
        <div className="space-y-2">
          {tutor.availability && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              {tutor.availability}
            </div>
          )}
          
          {tutor.hourly_rate && (
            <div className="flex items-center text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 mr-2" />
              ${tutor.hourly_rate}/hour
            </div>
          )}
        </div>

        {certificates.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Certificates
            </h4>
            <div className="space-y-1">
              {certificates.map((cert) => (
                <Button
                  key={cert.name}
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCertificate(cert.name)}
                  className="w-full justify-start text-xs"
                >
                  <Download className="h-3 w-3 mr-2" />
                  {cert.name.substring(cert.name.indexOf('-') + 1)}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleContact} className="w-full">
          <Mail className="h-4 w-4 mr-2" />
          Contact Tutor
        </Button>
      </CardContent>
    </Card>
  );
}