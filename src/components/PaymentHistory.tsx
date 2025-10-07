import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Clock, CheckCircle } from 'lucide-react';

interface Transaction {
  id: string;
  tutor: string;
  subject: string;
  amount: number;
  status: 'held_in_escrow' | 'released' | 'refunded';
  date: string;
  sessionDate: string;
}

export function PaymentHistory() {
  const transactions: Transaction[] = [
    {
      id: '1',
      tutor: 'Dr. Sarah Johnson',
      subject: 'Mathematics',
      amount: 30,
      status: 'released',
      date: '2025-09-20',
      sessionDate: '2025-09-15',
    },
    {
      id: '2',
      tutor: 'Prof. Ahmad Rahman',
      subject: 'Science',
      amount: 25,
      status: 'held_in_escrow',
      date: '2025-10-05',
      sessionDate: '2025-10-08',
    },
    {
      id: '3',
      tutor: 'Ms. Emily Chen',
      subject: 'English',
      amount: 28,
      status: 'released',
      date: '2025-09-25',
      sessionDate: '2025-09-20',
    },
  ];

  const totalEscrow = transactions
    .filter(t => t.status === 'held_in_escrow')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter(t => t.status === 'released')
    .reduce((sum, t) => sum + t.amount, 0);

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'held_in_escrow':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />In Escrow</Badge>;
      case 'released':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Released</Badge>;
      case 'refunded':
        return <Badge variant="secondary">Refunded</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">${totalSpent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Held in Escrow</p>
                <p className="text-2xl font-bold">${totalEscrow}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tutor</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Session Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.tutor}</TableCell>
                  <TableCell>{transaction.subject}</TableCell>
                  <TableCell>{new Date(transaction.sessionDate).toLocaleDateString()}</TableCell>
                  <TableCell>${transaction.amount}</TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
