import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChildAccount {
  id: string;
  name: string;
  email: string;
  totalBookings: number;
  totalSpent: number;
  progress: number;
}

export function ParentAccountManager() {
  const { toast } = useToast();
  const [children, setChildren] = useState<ChildAccount[]>([
    {
      id: '1',
      name: 'Sarah Ahmed',
      email: 'sarah.ahmed@example.com',
      totalBookings: 12,
      totalSpent: 360,
      progress: 85,
    },
    {
      id: '2',
      name: 'Ahmad Rahman',
      email: 'ahmad.rahman@example.com',
      totalBookings: 8,
      totalSpent: 240,
      progress: 72,
    },
  ]);
  const [newChildEmail, setNewChildEmail] = useState('');

  const addChild = () => {
    if (!newChildEmail.trim()) return;
    
    toast({
      title: 'Child account linked',
      description: `Invitation sent to ${newChildEmail}`,
    });
    setNewChildEmail('');
  };

  const removeChild = (id: string) => {
    setChildren(children.filter(c => c.id !== id));
    toast({
      title: 'Child account unlinked',
      description: 'The student account has been removed from your parent account.',
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Link Child Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Child's email address"
              value={newChildEmail}
              onChange={(e) => setNewChildEmail(e.target.value)}
            />
            <Button onClick={addChild}>Add Child</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {children.map((child) => (
          <Card key={child.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{child.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{child.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeChild(child.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Sessions</span>
                  <Badge variant="secondary">{child.totalBookings}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Spent</span>
                  <span className="font-semibold">${child.totalSpent}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Progress
                    </span>
                    <span className="font-medium">{child.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${child.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
