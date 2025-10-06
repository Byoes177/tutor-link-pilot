import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Clock, DollarSign, FileText, Download, Star, MapPin, User, GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
    education_level?: string;
    teaching_level?: string[];
    gender?: string;
    teaching_location?: string[];
    rating: number;
    total_reviews: number;
  };
}

export function TutorCard({ tutor }: TutorCardProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
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
    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader onClick={() => navigate(`/tutor/${tutor.id}`)}>
        <CardTitle className="text-lg">{tutor.full_name}</CardTitle>
        {tutor.education_level && (
          <p className="text-sm text-muted-foreground capitalize">{tutor.education_level}</p>
        )}
        
        <div className="flex items-center gap-2 mb-2">
          {tutor.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{tutor.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({tutor.total_reviews})</span>
            </div>
          )}
        </div>
        
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
          {tutor.gender && (
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="h-4 w-4 mr-2" />
              <span className="capitalize">{tutor.gender}</span>
            </div>
          )}
          
          {tutor.teaching_level && tutor.teaching_level.length > 0 && (
            <div className="flex items-center text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4 mr-2" />
              <span className="capitalize">Teaches: {tutor.teaching_level.join(', ')}</span>
            </div>
          )}
          
          {tutor.teaching_location && tutor.teaching_location.length > 0 && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="capitalize">{tutor.teaching_location.join(', ')}</span>
            </div>
          )}
          
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

        <div className="space-y-2">
          <Button onClick={() => navigate(`/tutor/${tutor.id}`)} className="w-full">
            📅 Book Session
          </Button>
          <Button onClick={handleContact} variant="outline" className="w-full">
            <Mail className="h-4 w-4 mr-2" />
            Contact Tutor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}