import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { Download, CheckCircle, XCircle } from 'lucide-react';
import { PledgeEditor } from './PledgeEditor';
import { formatAmountWithKES } from '@/lib/currencyUtils';

interface Pledge {
  id: string;
  name: string;
  email: string;
  donor_phone: string;
  amount: number;
  amount_in_usd: number;
  amount_in_kes: number;
  currency: string;
  payment_type: string;
  payment_method: string;
  payment_reference: string;
  is_confirmed: boolean;
  created_at: string;
  message: string;
  payment_deadline?: string | null;
}

interface PledgeReportsViewProps {
  eventId: string;
}

export function PledgeReportsView({ eventId }: PledgeReportsViewProps) {
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPledges = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_pledges', { p_event_id: eventId });

      if (error) throw error;

      setPledges(data || []);
    } catch (error) {
      console.error('Error loading pledges:', error);
      toast.error('Failed to load pledges');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!eventId) return;

    loadPledges();

    const channel = supabase
      .channel('admin-pledges')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_pledges',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          loadPledges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const exportToCSV = (data: Pledge[], filename: string) => {
    const headers = ['Date', 'Name', 'Email', 'Phone', 'Amount', 'Currency', 'USD Value', 'Payment Method', 'Reference', 'Status', 'Due Date', 'Message'];
    const rows = data.map(p => [
      format(new Date(p.created_at), 'yyyy-MM-dd HH:mm'),
      p.name || '',
      p.email || '',
      p.donor_phone || '',
      p.amount,
      p.currency,
      p.amount_in_usd,
      p.payment_method || p.payment_type,
      p.payment_reference || '',
      p.is_confirmed ? 'Paid' : 'Pending',
      p.payment_deadline ? format(new Date(p.payment_deadline), 'yyyy-MM-dd') : 'N/A',
      p.message || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const paidPledges = pledges.filter(p => p.is_confirmed);
  const pendingPledges = pledges.filter(p => !p.is_confirmed);

  const PledgeTable = ({ data }: { data: Pledge[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-muted-foreground">
              No pledges found
            </TableCell>
          </TableRow>
        ) : (
          data.map((pledge) => (
            <TableRow key={pledge.id}>
              <TableCell>{format(new Date(pledge.created_at), 'MMM dd, HH:mm')}</TableCell>
              <TableCell className="font-medium">{pledge.name}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{pledge.email || '-'}</div>
                  <div className="text-muted-foreground">{pledge.donor_phone || '-'}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {formatAmountWithKES(pledge.amount, pledge.currency, pledge.amount_in_kes).primary}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatAmountWithKES(pledge.amount, pledge.currency, pledge.amount_in_kes).kes}
                </div>
              </TableCell>
              <TableCell>{pledge.payment_method || pledge.payment_type}</TableCell>
              <TableCell className="font-mono text-xs">{pledge.payment_reference || '-'}</TableCell>
              <TableCell>
                {pledge.is_confirmed ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Paid
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-orange-600">
                    <XCircle className="w-4 h-4" />
                    Pending
                  </div>
                )}
              </TableCell>
              <TableCell>
                {pledge.payment_deadline ? (
                  <div className="text-sm">
                    <div className="font-medium">{format(new Date(pledge.payment_deadline), 'MMM dd, yyyy')}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(pledge.payment_deadline), { addSuffix: true })}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <PledgeEditor pledge={pledge} onUpdate={loadPledges} />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Loading pledge reports...</p>
        </CardContent>
      </Card>
    );
  }

  const totalPaidAmountUSD = paidPledges.reduce((sum, p) => sum + p.amount_in_usd, 0);
  const totalPendingAmountUSD = pendingPledges.reduce((sum, p) => sum + p.amount_in_usd, 0);
  const totalAmountUSD = pledges.reduce((sum, p) => sum + p.amount_in_usd, 0);
  
  const totalPaidAmountKES = totalPaidAmountUSD * 128;
  const totalPendingAmountKES = totalPendingAmountUSD * 128;
  const totalAmountKES = totalAmountUSD * 128;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Pledge Reports</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(paidPledges, 'paid-pledges.csv')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Paid
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(pendingPledges, 'pending-pledges.csv')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Pending
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(pledges, 'all-pledges.csv')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-2">Total Pledges</div>
              <div className="text-2xl font-bold">${totalAmountUSD.toLocaleString()}</div>
              <div className="text-lg font-semibold text-primary/80">KES {totalAmountKES.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">{pledges.length} pledges</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="text-sm text-green-700 dark:text-green-400 mb-2">Paid</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">${totalPaidAmountUSD.toLocaleString()}</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-500">KES {totalPaidAmountKES.toLocaleString()}</div>
              <div className="text-xs text-green-600 dark:text-green-500 mt-1">{paidPledges.length} pledges</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="text-sm text-orange-700 dark:text-orange-400 mb-2">Pending</div>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">${totalPendingAmountUSD.toLocaleString()}</div>
              <div className="text-lg font-semibold text-orange-600 dark:text-orange-500">KES {totalPendingAmountKES.toLocaleString()}</div>
              <div className="text-xs text-orange-600 dark:text-orange-500 mt-1">{pendingPledges.length} pledges</div>
            </CardContent>
          </Card>
        </div>

        {/* Pledge Tables */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({pledges.length})</TabsTrigger>
            <TabsTrigger value="paid">Paid ({paidPledges.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingPledges.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <PledgeTable data={pledges} />
          </TabsContent>
          <TabsContent value="paid">
            <PledgeTable data={paidPledges} />
          </TabsContent>
          <TabsContent value="pending">
            <PledgeTable data={pendingPledges} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
