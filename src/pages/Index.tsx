import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, BookOpen, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <GraduationCap className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Connect with Expert Tutors
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Find qualified tutors in your subject area or become a tutor and share your knowledge with students who need help.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Link to="/tutors">
                  <Button size="lg" className="w-full sm:w-auto">
                    Find Tutors
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    My Profile
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link to="/tutors">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Browse Tutors
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            How TutorConnect Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>For Students</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Browse qualified tutors, filter by subject, and connect directly for personalized learning sessions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>For Tutors</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Create your profile, showcase your expertise, and help students achieve their academic goals.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Quality Assurance</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  All tutors are reviewed and approved to ensure quality education and a safe learning environment.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join our community of learners and educators today.
          </p>
          {!user && (
            <Link to="/auth">
              <Button size="lg">
                Sign Up Now
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
