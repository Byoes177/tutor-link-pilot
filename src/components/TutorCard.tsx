import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Clock, DollarSign } from 'lucide-react';

interface TutorCardProps {
  tutor: {
    id: string;
    full_name: string;
    email: string;
    subjects: string[];
    bio?: string;
    availability?: string;
    hourly_rate?: number;
  };
}

export function TutorCard({ tutor }: TutorCardProps) {
  const handleContact = () => {
    window.location.href = `mailto:${tutor.email}?subject=Tutoring Inquiry`;
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

        <Button onClick={handleContact} className="w-full">
          <Mail className="h-4 w-4 mr-2" />
          Contact Tutor
        </Button>
      </CardContent>
    </Card>
  );
}