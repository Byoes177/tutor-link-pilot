import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Clock, DollarSign, Phone, Mail, Download, Calendar, BookOpen, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TutorProfileProps {
  tutorId: string;
  onBookSession?: () => void;
}

interface TutorData {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  subjects: string[];
  bio?: string;
  availability?: string;
  hourly_rate?: number;
  education_level?: string;
  teaching_level?: string[];
  gender?: string;
  teaching_location?: string[];
  qualifications?: string;
  rating: number;
  total_reviews: number;
  profile_image_url?: string;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  student_name: string;
}

interface Resource {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  file_type?: string;
  subject?: string;
  created_at: string;
}

export function TutorProfile({ tutorId, onBookSession }: TutorProfileProps) {
  const { toast } = useToast();
  const [tutor, setTutor] = useState<TutorData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTutorData();
  }, [tutorId]);

  const fetchTutorData = async () => {
    try {
      setLoading(true);

      // Fetch tutor data
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .select('*')
        .eq('id', tutorId)
        .maybeSingle();

      if (tutorError) throw tutorError;
      if (!tutorData) {
        throw new Error('Tutor not found');
      }
      setTutor(tutorData);

      // Fetch reviews with student names
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_student_id_fkey(full_name)
        `)
        .eq('tutor_id', tutorId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      
      const formattedReviews = reviewsData?.map(review => ({
        ...review,
        student_name: (review.profiles as any)?.full_name || 'Anonymous'
      })) || [];
      setReviews(formattedReviews);

      // Fetch public resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('tutor_resources')
        .select('*')
        .eq('tutor_id', tutorId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (resourcesError) throw resourcesError;
      setResources(resourcesData || []);

      // Fetch approved certificates
      const { data: certificatesData, error: certificatesError } = await supabase
        .from('certificate_approvals')
        .select('file_name')
        .eq('tutor_id', tutorId)
        .eq('is_approved', true);

      if (certificatesError) throw certificatesError;
      setCertificates(certificatesData || []);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load tutor profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadResource = async (resource: Resource) => {
    try {
      const { data, error } = await supabase.storage
        .from('resources')
        .download(resource.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = resource.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download resource",
        variant: "destructive",
      });
    }
  };

  const downloadCertificate = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('certificates')
        .download(`${tutor?.user_id}/${fileName}`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download certificate",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Loading tutor profile...</div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Tutor not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={tutor.profile_image_url} />
              <AvatarFallback className="text-2xl">
                {tutor.full_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{tutor.full_name}</h1>
                  {tutor.education_level && (
                    <p className="text-lg text-muted-foreground capitalize">
                      {tutor.education_level}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2">
                    {tutor.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{tutor.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({tutor.total_reviews} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {onBookSession && (
                    <Button onClick={onBookSession} className="w-full md:w-auto">
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Session
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => window.location.href = `mailto:${tutor.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-4">
                {tutor.subjects.map((subject) => (
                  <Badge key={subject} variant="secondary">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tutor.bio && (
              <p className="text-muted-foreground">{tutor.bio}</p>
            )}
            
            <div className="space-y-3">
              {tutor.hourly_rate && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>${tutor.hourly_rate}/hour</span>
                </div>
              )}
              
              {tutor.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{tutor.phone}</span>
                </div>
              )}
              
              {tutor.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{tutor.email}</span>
                </div>
              )}
              
              {tutor.gender && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{tutor.gender}</span>
                </div>
              )}
              
              {tutor.availability && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{tutor.availability}</span>
                </div>
              )}
              
              {tutor.teaching_location && tutor.teaching_location.length > 0 && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{tutor.teaching_location.join(', ')}</span>
                </div>
              )}

              {tutor.teaching_level && tutor.teaching_level.length > 0 && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">Teaching: {tutor.teaching_level.join(', ')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Qualifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tutor.qualifications ? (
              <div className="whitespace-pre-wrap text-muted-foreground">
                {tutor.qualifications}
              </div>
            ) : (
              <p className="text-muted-foreground">No qualifications listed</p>
            )}
            
            {certificates.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Verified Certificates</h4>
                <div className="space-y-2">
                  {certificates.map((cert) => (
                    <Button
                      key={cert.file_name}
                      variant="outline"
                      size="sm"
                      onClick={() => downloadCertificate(cert.file_name)}
                      className="w-full justify-start"
                    >
                      <Download className="h-3 w-3 mr-2" />
                      {cert.file_name.substring(cert.file_name.indexOf('-') + 1)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resources */}
      {resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Study Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {resources.map((resource) => (
                <Card key={resource.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{resource.title}</h4>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {resource.description}
                        </p>
                      )}
                      {resource.subject && (
                        <Badge variant="outline" className="mt-2">
                          {resource.subject}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadResource(resource)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{review.student_name}</p>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-muted-foreground mt-1">{review.comment}</p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}